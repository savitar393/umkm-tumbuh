# Frontend UMKM Tumbuh

[English](README.md) | **Bahasa Indonesia**

Aplikasi React 18 dan TypeScript yang dibangun dengan Vite. Modul fitur berada di `src/features/`; utilitas HTTP dan autentikasi bersama berada di `src/shared/`.

## Menjalankan pengembangan

Gunakan Node.js 22 dan npm. Jalankan backend melalui [panduan pengembangan lokal](../docs/README_LOCAL_DEV.id.md), lalu jalankan dari direktori utama repositori:

```bash
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env
cd frontend
npm ci
npm run dev
```

Buka [aplikasi](http://localhost:5173). Pertahankan `.env` yang sudah ada dan bandingkan dengan [.env.example](.env.example) saat memperbarui proyek. `.env` utama mengatur backend dan tidak menggantikan `frontend/.env`.

## Alamat backend

Klien HTTP pada [src/shared/api/http.ts](src/shared/api/http.ts) memilih API untuk setiap permintaan. Atur satu base URL untuk setiap layanan, termasuk bagian `/api/v1`:

| Variabel | Nilai bawaan |
| --- | --- |
| `VITE_AUTH_API_BASE_URL` | `http://localhost:8080/api/v1` |
| `VITE_ADMIN_API_BASE_URL` | `http://localhost:8080/api/v1` |
| `VITE_USER_API_BASE_URL` | `http://localhost:8081/api/v1` |
| `VITE_PARTNERSHIP_API_BASE_URL` | `http://localhost:8082/api/v1` |
| `VITE_DOCUMENT_API_BASE_URL` | `http://localhost:8083/api/v1` |
| `VITE_TRAINING_API_BASE_URL` | `http://localhost:8084/api/v1` |
| `VITE_CERTIFICATE_API_BASE_URL` | `http://localhost:8084/api/v1` |
| `VITE_API_BASE_URL` | `http://localhost:8082/api/v1` |

`VITE_API_BASE_URL` merupakan alamat cadangan untuk permintaan dengan layanan default, bukan gateway bersama bagi kelima layanan. Fitur sertifikat menggunakan training service.

Jika port backend yang dipublikasikan diubah, sesuaikan URL frontend dan jalankan ulang Vite. Jika Vite menggunakan origin lain, misalnya port 5174, ubah `FRONTEND_URL` pada `.env` utama dan buat ulang container backend menggunakan `docker compose ... up -d` dengan perintah lengkap pada panduan lokal.

Nilai `VITE_*` merupakan konfigurasi yang tersedia di browser. Jangan menyimpan kata sandi basis data, `JWT_SECRET`, atau secret key S3 di dalamnya.

## Perintah yang tersedia

Jalankan di dalam `frontend/`:

| Perintah | Fungsi |
| --- | --- |
| `npm ci` | Memasang dependensi sesuai lockfile |
| `npm run dev` | Menjalankan server pengembangan Vite |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Memeriksa TypeScript dan membuat hasil build di `dist/` |
| `npm run preview` | Meninjau hasil build yang sudah ada secara lokal |

Jalankan `npm run build` sebelum preview. Preview biasanya menggunakan port 4173; permintaan ke backend tetap memerlukan `FRONTEND_URL` yang sesuai. Preview tidak menjalankan backend.

## Akun dan pengujian

Stack biasa membuat akun admin sesuai konfigurasi `.env` utama. Daftarkan akun UMKM dan Mitra melalui aplikasi; email lokal dapat dibaca melalui [Mailpit](http://localhost:8025).

Perintah `bash tests/stack/run.sh`, yang dijalankan dari direktori utama repositori, memeriksa integrasi backend dan menghapus enam akun sementaranya setelah selesai. Akun tersebut tidak tersedia untuk sesi browser berikutnya. Pengujian Stage 1 tidak memeriksa tampilan browser atau seluruh fitur aplikasi.

Jika aplikasi gagal berjalan, periksa console dan permintaan jaringan pada browser, lalu baca log backend yang terkait. Lihat [panduan lokal](../docs/README_LOCAL_DEV.id.md) untuk alamat layanan dan perintahnya.
