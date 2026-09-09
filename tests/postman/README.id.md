# Koleksi Postman dan Newman

[English](README.md) | **Bahasa Indonesia**

Direktori ini berisi koleksi API dan konfigurasi lingkungan lokal yang sudah ada. Untuk pemeriksaan infrastruktur Stage 1 saat ini, jalankan `bash tests/stack/run.sh` dari direktori utama repositori; lihat [panduan lokal](../../docs/README_LOCAL_DEV.id.md).

## Cakupan dan keterbatasan saat ini

`umkm-tumbuh-backend.postman_collection.json` berisi 35 permintaan yang mencakup pemeriksaan layanan, login, registrasi UMKM/Mitra, peninjauan admin, dan kasus negatif. Koleksi dibuat sebelum alur verifikasi email saat ini dan tidak memiliki langkah permintaan/konfirmasi verifikasi. Karena itu, sebagian pemeriksaan login dan registrasi perlu diperbarui sebelum koleksi dapat menjadi pemeriksaan regresi yang andal.

Keberhasilan Stage 1 tidak berarti koleksi lama ini juga berhasil. Saat memeliharanya, bandingkan skrip permintaan dan status yang diharapkan dengan handler saat ini. Koleksi lain dalam direktori ini memiliki skenario dan konfigurasi lingkungannya sendiri.

Permintaan dapat membuat akun dan mengubah status registrasi. Jalankan pada basis data pengembangan yang datanya boleh diubah.

## Menjalankan koleksi backend yang tersedia

Jalankan aplikasi dari direktori utama repositori:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait --wait-timeout 180
npm install -g newman newman-reporter-htmlextra
mkdir -p tests/postman/reports
newman run tests/postman/umkm-tumbuh-backend.postman_collection.json \
  -e tests/postman/local.postman_environment.json \
  -r cli,htmlextra \
  --reporter-htmlextra-export tests/postman/reports/backend-report.html
```

Laporan HTML disimpan di `tests/postman/reports/backend-report.html`. Perintah tetap mengembalikan exit status gagal dari Newman jika pemeriksaan tidak sesuai.

## Variabel lingkungan

Lingkungan bawaan menggunakan `auth_base_url=http://localhost:8080` dan `user_base_url=http://localhost:8081`. Nilai ini tidak menyertakan `/api/v1` karena lokasi permintaan dalam koleksi sudah memuatnya. Jika port berbeda, ganti melalui opsi `--env-var` Newman atau gunakan salinan konfigurasi lingkungan lokal.

`admin_email` dan `admin_password` harus sesuai dengan admin yang sudah ada pada basis data tujuan. Periksa nilai akun UMKM/Mitra dan skrip permintaan sebelum menjalankan koleksi; jangan menganggap seed CSV besar menyediakan kredensial yang dapat dipakai. Jangan sertakan token pribadi, ekspor konfigurasi lingkungan, atau laporan hasil pengujian dalam commit.
