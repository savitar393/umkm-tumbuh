# Panduan Testing Training & Certificate Service

Panduan langkah demi langkah untuk mengetes backend Training & Certificate Service.

## Prasyarat

- Semua service sudah running (cek via Docker):
  ```bash
  docker ps
  ```
  Harus ada container: `umkm_postgres`, `umkm_auth_service`, `umkm_user_service`, `umkm_training_service`

## Cepat: Jalankan Semua Test Sekaligus

```bash
cd services\training-service
.\test-api.bat
```

> **Catatan:** `test-api.bat` masih versi sederhana. Untuk testing lengkap (login, enroll, certificate) ikuti langkah manual atau pake Postman.

---

## Langkah Manual (Step-by-Step)

### 1. Health Check

```bash
curl http://localhost:8083/api/v1/health
curl http://localhost:8083/api/v1/health/db
```

### 2. Login Sebagai Admin (Ambil Token)

```bash
# Simpan JSON ke file biar aman dari masalah escaping PowerShell
Write-Output '{"email":"admin@example.com","password":"admin12345"}' | Set-Content login.json -Encoding ASCII
curl -X POST http://localhost:8081/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "@login.json"
```

Simpan `access_token` dari response.

### 3. Lihat Data Pelatihan

```bash
curl http://localhost:8083/api/v1/trainings
```

Ambil `pelatihan_id` dari response (contoh: `PLT000195`).

### 4. Daftar Akun UMKM Baru (Sekali Saja)

```bash
Write-Output '{"email":"umkm@test.com","password":"password123","full_name":"UMKM Test","phone_number":"081234567890","role":"UMKM"}' | Set-Content register.json -Encoding ASCII
curl -X POST http://localhost:8081/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "@register.json"
```

Simpan `id` dari response (contoh: `AKUN376D8B96F8FC4748`).

### 5. Approve Registrasi (Sebagai Admin)

```bash
# Ganti TOKEN_ADMIN dan AKUN_ID sesuai punyamu
curl -X PATCH "http://localhost:8081/api/v1/admin/registrations/AKUN_ID/approve" ^
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### 6. Login Sebagai UMKM

```bash
Write-Output '{"email":"umkm@test.com","password":"password123"}' | Set-Content login_umkm.json -Encoding ASCII
curl -X POST http://localhost:8081/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "@login_umkm.json"
```

Simpan `access_token` UMKM.

### 7. Buat Profil UMKM

```bash
Write-Output '{"business_name":"Toko UMKM Test","owner_name":"UMKM Test","nik":"1234567890123456","phone_number":"081234567890","address":"Jl. Merdeka No. 1","city":"Jakarta","province":"DKI Jakarta","district":"Gambir","village":"Gambir","postal_code":"10110","business_category":"UMUM"}' | Set-Content profile.json -Encoding ASCII
curl -X PUT http://localhost:8082/api/v1/profiles/me ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_UMKM" ^
  -d "@profile.json"
```

Simpan `id` dari response (contoh: `UMKM45E71F87AA744FEC`) — ini `umkm_id`.

### 8. Enroll UMKM ke Pelatihan

```bash
Write-Output '{"umkm_id":"UMKM_ID","pelatihan_id":"PLT000195"}' | Set-Content enroll.json -Encoding ASCII
curl -X POST http://localhost:8083/api/v1/trainings/enroll ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_UMKM" ^
  -d "@enroll.json"
```

Simpan `pendaftaran_pelatihan_id` dari response.

### 9. Update Progress

```bash
Write-Output '{"pendaftaran_pelatihan_id":"PENDAFTARAN_ID","modul_selesai":5,"total_modul":5}' | Set-Content progress.json -Encoding ASCII
curl -X PATCH http://localhost:8083/api/v1/enrollments/progress ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_UMKM" ^
  -d "@progress.json"
```

### 10. Selesaikan Pelatihan

```bash
Write-Output '{"pendaftaran_pelatihan_id":"PENDAFTARAN_ID"}' | Set-Content complete.json -Encoding ASCII
curl -X PATCH http://localhost:8083/api/v1/enrollments/complete ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_UMKM" ^
  -d "@complete.json"
```

> **Error 400** `"pelatihan belum dapat diselesaikan"` berarti masih ada modul yang belum dikerjakan. Lanjutkan update progress sampai semua modul selesai.

### 11. Ajukan Sertifikat

```bash
Write-Output '{"pendaftaran_pelatihan_id":"PENDAFTARAN_ID"}' | Set-Content cert.json -Encoding ASCII
curl -X POST http://localhost:8083/api/v1/certificates/request ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_UMKM" ^
  -d "@cert.json"
```

### 12. Cek Dashboard & Data Sertifikat

```bash
# Dashboard
curl http://localhost:8083/api/v1/certificates/user/UMKM_ID/dashboard ^
  -H "Authorization: Bearer TOKEN_UMKM"

# Daftar sertifikat
curl http://localhost:8083/api/v1/certificates/user/UMKM_ID ^
  -H "Authorization: Bearer TOKEN_UMKM"

# Detail sertifikat (ganti ID_SERTIFIKAT dengan angka dari response)
curl http://localhost:8083/api/v1/certificates/ID_SERTIFIKAT ^
  -H "Authorization: Bearer TOKEN_UMKM"
```

---

## Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `curl` error `Missing mandatory parameters: Uri` | PowerShell `curl` adalah alias untuk `Invoke-WebRequest` | Pakai `curl.exe` bukan `curl` |
| `Request body tidak valid.` | JSON escaping bermasalah di PowerShell | Simpan JSON ke file dulu, pake `-d "@file.json"` |
| `relation "..." does not exist` | Migration views belum di-run | Jalankan ulang docker compose migration |
| `duplicate key value` | Ada data duplicate dari test sebelumnya | Hapus data duplicate atau pake enrollment_id baru |
| `Connection refused` | Service belum running | Cek `docker ps`, pastikan semua container up |
| `Email atau password tidak valid.` | Akun belum terdaftar atau typo | Coba `admin@example.com` / `admin12345` dulu |

## Rebuild Service (Setelah Ada Perubahan Kode)

Kalau ada perubahan kode Go, rebuild & restart service:

```bash
cd infra
docker-compose up -d --build training-service
```

Migrations (020, 021, dst) otomatis jalan ketika `db-migrate` restart.

## Reset Data Testing

Kalau mau test dari awal lagi (data bersih):

### Opsi 1: Rollback & Re-run Migrations

```bash
cd infra
# Rollback training-related migrations
docker exec umkm_postgres psql -U umkm_user -d umkm_tumbuh -c "DELETE FROM training.transaksi_sertifikatpelatihan;"
docker exec umkm_postgres psql -U umkm_user -d umkm_tumbuh -c "DELETE FROM training.transaksi_pendaftaranpelatihan;"
```

### Opsi 2: Reset Total (Hapus Semua Data)

```bash
cd infra
docker-compose down
docker-compose up -d postgres
docker-compose up -d db-migrate
docker-compose up -d auth-service user-service training-service
```

---

## Referensi Cepat: Port & Service

| Service | URL | Docker Container |
|---------|-----|-----------------|
| Auth Service | `http://localhost:8081/api/v1` | `umkm_auth_service` |
| User Service | `http://localhost:8082/api/v1` | `umkm_user_service` |
| Training Service | `http://localhost:8083/api/v1` | `umkm_training_service` |
| PostgreSQL | `localhost:5433` | `umkm_postgres` |

### Default Akun

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin12345` |
| UMKM (daftar dulu) | `umkm@test.com` | `password123` |

---

## Postman

Import file `UMKM-Tumbuh-Training-Certificate.postman_collection.json` di root project.

Cara pakai:
1. Import ke Postman
2. Set variable `baseUrl` = `http://localhost:8083/api/v1`
3. Login via Auth Service dulu, copy token ke variable `token`
4. Jalankan urut: **Health → Trainings → Enrollments → Certificates**
