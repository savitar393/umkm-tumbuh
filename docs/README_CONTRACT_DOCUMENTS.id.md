# Stage 3: dokumen kontrak kemitraan

[English](README_CONTRACT_DOCUMENTS.md) | **Bahasa Indonesia**

Penyimpanan kontrak kini menerima berkas yang diunggah melalui document-service. Pengaju mengunggah dan menyimpan kontrak bertanda tangan; penerima meninjau dan menyetujui pengajuan melalui tindakan terpisah. Referensi kontrak lama tetap dapat dibaca melalui endpoint unduhan berdasarkan ID pengajuan yang sama.

## Memperbarui aplikasi lokal

Setelah menerapkan patch Stage 3, jalankan dari direktori utama repositori:

```bash
docker compose --env-file .env -f infra/docker-compose.yml run --build --rm db-migrate
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait --wait-timeout 180 partnerships-service document-service
npm --prefix frontend run check
```

Jalankan ulang Vite dengan `npm --prefix frontend run dev`. Pertahankan berkas environment dan volume Docker yang sudah digunakan. Tidak ada variabel environment baru, impor CSV dummy, atau reset basis data yang diperlukan.

Perintah Compose biasa memakai basis data pengembangan Anda. `bash tests/stack/run.sh` memakai proyek pengujian terpisah yang dibuang setelah selesai, sehingga tidak memperbarui atau mengisi basis data pengembangan Anda.

## Alur di browser

1. Login sebagai pengaju, lalu buka pengajuan yang sudah dikirim → **Dokumen Kontrak**.
2. Pilih kontrak bertanda tangan berupa PDF, JPG, atau PNG, maksimal 10 MiB, lalu tekan **Simpan Kontrak**. Berkas diunggah sebagai `PARTNERSHIP_FILE` dan dihubungkan ke pengajuan. Setelah berhasil, halaman kembali ke review; pengajuan belum disetujui.
3. Login sebagai penerima. Buka pengajuan yang sama → **Dokumen Kontrak** atau **Lanjut ke Persetujuan**, lalu unduh kontrak tersimpan untuk diperiksa.
4. Tekan **Setujui & Aktifkan** untuk menyetujui. Penerima tidak mengunggah atau menyimpan kontrak atas nama pengaju. Persetujuan mengubah status menjadi `AKTIF` dan menutup perubahan kontrak.
5. Kedua pihak dapat membuka kembali **Dokumen Kontrak** untuk mengunduh berkas, termasuk pada pengajuan yang sudah ditutup. Kegagalan unduhan menampilkan pesan kesalahan dan tidak membuat tombol terus memuat.

Persetujuan mempertahankan aturan sebelumnya: penerima boleh menyetujui tanpa kontrak. Halaman menjelaskan jika kontrak belum tersedia dan bahwa persetujuan menutup perubahan kontrak. Jika kontrak diperlukan, unggah sebelum menyetujui. Tahap ini tidak menerapkan tanda tangan elektronik atau memvalidasi tanda tangan di dalam berkas.

## API dan hak akses

Semua endpoint berikut memerlukan token akses. Document-service kini mewajibkan HS256, waktu kedaluwarsa, `sub` yang tidak kosong, dan peran yang dikenal, sesuai aturan token layanan kemitraan/pelatihan. Header peran tidak memberikan hak akses.

| Layanan / permintaan | Perilaku |
| --- | --- |
| Document: `POST /api/v1/documents/upload` | Multipart `file` dan `category=PARTNERSHIP_FILE`; mengembalikan `document.id` |
| Partnership: `POST /api/v1/partnerships/{id}/sign` | Body `{"dokumen_kontrak":"DOK000001"}`; hanya pengaju, dengan unggahan `PARTNERSHIP_FILE` aktif miliknya |
| Partnership: `GET /api/v1/partnerships/{id}` | Mengembalikan `contract_document_id` yang digunakan, `contract_document_source` (`CURRENT`/`LEGACY`), dan `contract_signed_at` di dalam `data.pengajuan` |
| Document: `GET /api/v1/partnership-contracts/{id}` | Membaca metadata kontrak yang digunakan pengajuan; untuk pengaju, penerima, atau admin |
| Document: `GET /api/v1/partnership-contracts/{id}/download` | Mengirim isi berkas setelah memeriksa hak akses; untuk pengaju, penerima, atau admin |
| Document: `DELETE /api/v1/documents/{id}` | Hanya pengunggah/admin; menghasilkan 409 selama dokumen dipakai sebagai kontrak baru pada pengajuan mana pun |

`{id}` pada `partnership-contracts` adalah **ID pengajuan**, bukan ID dokumen. Frontend memakai URL document API yang dikonfigurasi, sehingga proxy Vite juga menangani unggahan dan unduhan di WSL. Unduhan menggunakan API dengan autentikasi, tanpa membuka alamat Garage secara langsung. Unggahan dan unduhan biner memiliki batas waktu 30 detik, termasuk pembacaan isi respons; permintaan metadata serta penyimpanan/persetujuan dibatasi 15 detik.

| Tindakan kontrak | Status pengajuan yang diizinkan |
| --- | --- |
| Pengaju menyimpan atau mengganti kontrak | `DIAJUKAN`, `DITINJAU`, `MENUNGGU_DOKUMEN_TTD` |
| Penerima menyetujui/menolak | `DIAJUKAN`, `DITINJAU` |
| Kedua pihak mengunduh kontrak tersimpan | Semua status |

Penyimpanan kontrak tidak mengubah status pengajuan. Data lama berstatus `MENUNGGU_DOKUMEN_TTD` dapat menerima berkas, tetapi tahap ini belum menambah transisi persetujuan dari status tersebut. Penandaan pengajuan sebagai telah dibaca juga belum menyimpan waktu baca.

Token yang tidak ada/tidak valid menghasilkan 401; pihak yang tidak berhak atau referensi dokumen yang tidak dapat digunakan menghasilkan 403; transisi tidak valid/kedaluwarsa dan penghapusan kontrak yang masih digunakan menghasilkan 409. Metadata kontrak atau berkas tersimpan yang tidak ditemukan menghasilkan 404. Aturan jenis unggahan tetap berlaku: `PRODUCT_IMAGE` publik, dokumen umum, unggahan terhapus, dan berkas milik akun lain tidak dapat disimpan sebagai kontrak baru.

## Skema dan kompatibilitas data lama

Migrasi `032_current_partnership_contracts` menambah `partnership.transaksi_pengajuankerjasama.dokumen_kontrak_id`, berupa foreign key yang boleh kosong ke `documents.master_dokumen`. Foreign key lama `dokumen_perjanjian_id` beserta nilainya yang mengacu ke `document.transaksi_dokumenterunggah` tetap dipertahankan.

Referensi baru diprioritaskan. Jika kosong, endpoint unduhan membaca referensi lama secara eksplisit. Endpoint tidak mencari ID lama di tabel baru atau memakai berkas lama sebagai pengganti ketika referensi baru tidak tersedia. Ini diperlukan karena kedua tabel dapat memiliki ID yang sama untuk dokumen berbeda.

Penggantian kontrak lama yang masih terbuka menyimpan referensi baru sambil mempertahankan referensi lama. Migrasi tidak menyalin atau menghapus metadata maupun objek lama. Berkas harus tetap tersedia pada bucket/object key yang tercatat dan dapat diakses dengan kredensial penyimpanan yang dikonfigurasi; metadata saja tidak dapat memulihkan isi berkas yang hilang.

Penyimpanan dan penghapusan mengunci baris dokumen baru sebelum mengubah keadaan, sehingga penghapusan bersamaan tidak dapat membuang berkas yang baru dihubungkan sebagai kontrak. Berkas yang masih dirujuk tidak dapat ditandai terhapus melalui API atau dihapus langsung melalui foreign key baru. Setelah penggantian, berkas sebelumnya tidak lagi dibagikan melalui kontrak tersebut; akses masih mungkin berasal dari pengajuan/lampiran lain, hak pengunggah/admin, atau URL yang sebelumnya diterbitkan endpoint URL dokumen dan belum kedaluwarsa.

Migrasi down menolak menghapus kolom baru selama masih berisi referensi kontrak. Selesaikan pemindahan referensi secara sengaja sebelum melakukan rollback. Pembaruan biasa hanya menjalankan migrasi up.

## Pengujian regresi

```bash
npm --prefix frontend run test:contracts
bash tests/stack/run.sh
```

Suite frontend memeriksa tindakan pengaju/penerima, kontrak tertutup yang hanya dapat dibaca, penolakan akses, percobaan ulang unggahan, validasi berkas, unduhan biner berdasarkan pengajuan, serta batas waktu respons tertunda/sebagian. Perintah frontend `check` mencakup suite ini beserta pengujian login/proxy/halaman sebelumnya.

Stack terisolasi menjalankan suite Newman dan otorisasi sebelumnya, ditambah `tests/stack/contracts.py`. Pengujian kontrak mencakup unggahan dan isi unduhan nyata, penolakan akun lain, ID dokumen yang tidak sesuai, penggantian/penghapusan, kedua peran pengaju, benturan ID lama, serta penyimpanan/penghapusan bersamaan. Runner kemudian memeriksa ulang isi berkas dan hak akses kontrak baru/lama setelah migrasi diulang dan container dibuat ulang.

Fixture kontrak lama memakai berkas nyata yang diunggah saat `stack-check prepare`; fixture tidak menganggap metadata saja sudah menyediakan berkas tersimpan. Skrip fixture menolak basis data di luar lingkup pengujian terisolasi.

Pengujian lengkap yang berhasil diakhiri dengan:

```text
Stage 1 stack checks passed.
Stage 2 authorization checks passed.
Stage 3 contract document checks passed.
```

Newman menulis `tests/postman/reports/newman.xml`. Pengujian otorisasi dan kontrak menulis `tests/stack/reports/authorization.txt` dan `tests/stack/reports/contracts.txt`. CI mengunggah semua laporan yang tersedia sebagai `api-contract-results`, termasuk saat gagal. Laporan diabaikan Git.

CI juga menjalankan pemeriksaan format, vet, pengujian dengan deteksi race, dan build document-service. Jika Go 1.26.3 dan compiler C tersedia, jalankan suite Go yang terdampak secara lokal:

```bash
(cd services/partnerships-service && go test -race ./...)
(cd services/document-service && go test -race ./...)
```
