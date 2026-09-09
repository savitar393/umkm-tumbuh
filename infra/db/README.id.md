# Basis data dan migrasi

[English](README.md) | **Bahasa Indonesia**

Kelima layanan menggunakan PostgreSQL 16. Migrasi skema bersama disimpan pada [migrations/](migrations/). Migrator menerapkan berkas `*.up.sql` berdasarkan urutan nama berkas dan mencatat nama yang selesai di `app_private.schema_migrations`. Pengulangan migrasi melewati berkas yang sudah tercatat.

## Menjalankan basis data

Untuk pengembangan aplikasi biasa, gunakan [panduan stack lengkap](../../docs/README_LOCAL_DEV.id.md); prosesnya sudah menjalankan migrasi dan membuat akun admin.

Untuk pekerjaan basis data tanpa API, jalankan dari direktori utama repositori:

```bash
[ -f .env ] || cp .env.example .env
docker compose --env-file .env -f infra/docker-compose.db.yml up -d postgres
docker compose --env-file .env -f infra/docker-compose.db.yml run --rm --build db-migrate
```

Pilih konfigurasi stack lengkap atau konfigurasi basis data saja untuk satu sesi. Keduanya menggunakan nama proyek Compose bawaan dan volume PostgreSQL yang sama. Konfigurasi basis data saja tidak menjalankan API, Garage, Mailpit, atau seed admin.

`POSTGRES_USER`, `POSTGRES_PASSWORD`, dan `POSTGRES_DB` berasal dari `.env` utama. `POSTGRES_PORT` menentukan port host yang dipublikasikan; PostgreSQL tetap menggunakan port 5432 di dalam Docker. Kredensial awal diterapkan ketika direktori data masih kosong; mengubah `.env` tidak mengubah pengguna atau basis data PostgreSQL yang sudah ada.

## Menambah atau mengulang migrasi

Simpan migrasi baru di `infra/db/migrations/`, dengan pasangan berkas `*.up.sql` dan `*.down.sql`. Gunakan nama berkas yang belum dipakai dan jangan mengubah migrasi yang sudah diterapkan. Runner saat ini hanya menjalankan berkas up; berkas down bukan perintah rollback otomatis.

Untuk stack lengkap:

```bash
docker compose --env-file .env -f infra/docker-compose.yml run --rm --build db-migrate
docker compose --env-file .env -f infra/docker-compose.yml logs --tail 80 db-migrate
```

Perintah `run` langsung menampilkan hasil migrasi pada eksekusi tersebut. `logs db-migrate` menampilkan log container layanan Compose yang bernama sama. Build ulang memastikan berkas migrasi baru disalin ke image.

Untuk menghentikan konfigurasi basis data saja dengan tetap menyimpan datanya:

```bash
docker compose --env-file .env -f infra/docker-compose.db.yml down
```

## Data uji terisolasi

Jalankan `bash tests/stack/run.sh` dari direktori utama repositori. [fixtures.sql](../../tests/stack/fixtures.sql) membuat enam akun sintetis beserta profilnya hanya pada `umkm_tumbuh_test`. Skrip menggunakan transaksi, mempertahankan baris yang sudah ada saat diulang, dan menolak nama basis data lain. Runner menggunakan volume pengujian terpisah dan membersihkannya saat selesai.

Data uji ini tidak mengisi basis data pengembangan biasa. Lihat [panduan lokal](../../docs/README_LOCAL_DEV.id.md#menjalankan-pengujian-stage-1-terisolasi) untuk daftar akun dan hasil yang diharapkan.

## Seed CSV besar yang opsional

Dataset lama berada di [dummy/seed-csv/](dummy/seed-csv/). Loader menggunakan `TRUNCATE ... CASCADE`, sehingga mengganti data aplikasi yang sudah ada. Gunakan hanya pada basis data pengembangan yang seluruh isinya boleh dibuang, dengan layanan aplikasi dalam keadaan berhenti.

Dari direktori utama repositori, untuk konfigurasi basis data saja:

```bash
docker compose --env-file .env -f infra/docker-compose.db.yml --profile seed run --rm db-seed
```

Layanan Compose memasang berkas yang tersimpan dalam repositori dan mengatur direktori kerja sesuai kebutuhan [loaders/load_generated_csv.sql](loaders/load_generated_csv.sql). Jangan menggunakan lokasi lama `data/UMKM_TUMBUH_csv`.

Dataset CSV terpisah dari data uji Stage 1. Pengaturan generator dan manifest lama dapat berbeda dari berkas akun yang tersimpan; impor yang berhasil belum memastikan kredensial login dapat digunakan. Lihat [catatan CSV](dummy/seed-csv/README.id.txt). Jangan commit kredensial plaintext hasil generator.
