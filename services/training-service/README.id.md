# Layanan pelatihan

[English](README.md) | **Bahasa Indonesia**

Mengelola program pelatihan, modul, pendaftaran, progres, dan sertifikat. Port bawaan adalah **8084**. Layanan menggunakan skema PostgreSQL bersama dan membuat berkas sertifikat secara lokal.

## Menjalankan dengan Docker

Gunakan [panduan pengembangan lokal](../../docs/README_LOCAL_DEV.id.md) untuk menjalankan aplikasi lengkap. Untuk membangun dan menjalankan layanan ini beserta dependensi basis datanya saja, jalankan dari direktori utama repositori:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait training-service
```

Perintah tersebut tidak menjalankan auth-service. Gunakan stack lengkap jika perlu login dan memanggil endpoint yang memerlukan autentikasi.

Compose mengatur `CERTIFICATE_DIR=/app/certificates` dan memasang volume `certificates_data` pada lokasi tersebut. Pembuatan ulang container secara normal mempertahankan berkasnya. Training tidak menggunakan kredensial Garage.

## Menjalankan dengan Go

Gunakan Go 1.26.3 agar sesuai dengan build Docker. Jalankan PostgreSQL dan terapkan seluruh migrasi repositori terlebih dahulu; lihat [panduan basis data](../../infra/db/README.id.md). Migrasi 006 saja belum mencakup skema lengkap yang digunakan saat ini.

Jika training-service sudah berjalan dalam Docker pada port 8084, hentikan layanan tersebut sebelum menjalankan proses Go pada port yang sama:

```bash
docker compose --env-file .env -f infra/docker-compose.yml stop training-service
cd services/training-service
[ -f .env ] || cp .env.example .env
```

Periksa `.env` sebelum menjalankan layanan: `DATABASE_URL` harus mengarah ke port PostgreSQL yang dipublikasikan pada host, dan `JWT_SECRET` harus sama dengan auth-service. Loader konfigurasi membaca `.env` utama sebelum `.env` layanan; nilai yang sudah ada di lingkungan tetap dipertahankan. Direktori sertifikat bawaan di luar Docker adalah `./certificates`.

```bash
go mod download
go run ./cmd/api
```

## Rute API

Semua lokasi di bawah diawali `/api/v1`. Rute berautentikasi memerlukan `Authorization: Bearer <access_token>`.

| Metode | Lokasi | Autentikasi | Fungsi |
| --- | --- | --- | --- |
| GET | `/health` | Publik | Kondisi layanan |
| GET | `/health/db` | Publik | Koneksi basis data |
| GET | `/trainings/` | Publik | Daftar pelatihan |
| GET | `/trainings/{id}` | Publik | Data pelatihan |
| GET | `/trainings/{id}/detail` | Publik | Detail dan modul pelatihan |
| POST | `/trainings/enroll` | Pemilik UMKM | Mendaftar pelatihan |
| GET | `/enrollments/user/{umkmID}` | Pemilik atau admin | Daftar pendaftaran pengguna |
| PATCH | `/enrollments/progress` | Pemilik UMKM | Memperbarui progres |
| PATCH | `/enrollments/complete` | Pemilik UMKM | Menyelesaikan pelatihan |
| GET | `/certificates/list`, `/certificates/stats` | Admin | Daftar dan statistik sertifikat |
| GET | `/certificates/user/{umkmID}` | Pemilik atau admin | Sertifikat pengguna |
| GET | `/certificates/user/{umkmID}/dashboard` | Pemilik atau admin | Dasbor sertifikat pengguna |
| GET | `/certificates/{id}`, `/certificates/{id}/download` | Pemilik atau admin | Data atau berkas sertifikat |
| POST | `/certificates/request` | Pemilik UMKM | Mengajukan sertifikat |
| POST | `/certificates/{id}/approve`, `/certificates/{id}/reject` | Admin | Meninjau sertifikat |
| GET | `/admin/training/`, `/admin/training/stats`, `/admin/training/{id}` | Admin | Tampilan pengelolaan pelatihan |
| POST | `/admin/training/` | Admin | Membuat pelatihan |
| PUT / DELETE | `/admin/training/{id}` | Admin | Memperbarui atau menghapus pelatihan |
| PATCH | `/admin/training/{id}/status` | Admin | Memperbarui status pelatihan |

Pembatasan peran diterapkan pada router dan service. Kepemilikan diperiksa melalui relasi akun/usaha/pendaftaran di PostgreSQL. Lihat [panduan otorisasi Stage 2](../../docs/README_AUTHORIZATION.id.md) untuk aturan dan batasan lengkap.

## Memeriksa layanan

```bash
curl -fsS http://localhost:8084/api/v1/health
curl -fsS http://localhost:8084/api/v1/health/db
curl -fsS http://localhost:8084/api/v1/trainings/
```

Untuk permintaan berautentikasi, isi `TOKEN` dengan access token login yang valid dan `UMKM_ID` dengan ID usaha yang benar-benar ada pada basis data saat ini:

```bash
curl -fsS -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8084/api/v1/enrollments/user/$UMKM_ID"
```

Gunakan port host yang benar jika berbeda dari 8084. Pengujian stack kini juga memeriksa kepemilikan pendaftaran, progres, pengajuan/peninjauan sertifikat, dan akses PDF. Jalankan `bash tests/stack/run.sh` dari direktori utama repositori; lihat [panduan otorisasi](../../docs/README_AUTHORIZATION.id.md).
