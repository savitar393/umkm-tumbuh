# Training Service

Service untuk mengelola program pelatihan UMKM Tumbuh.

## Fitur

- Daftar semua pelatihan aktif
- Detail pelatihan + modul
- Pendaftaran user ke pelatihan (enrollment)
- Tracking progress pelatihan user
- Update progress dan status selesai

## Endpoints

### Health Check
- `GET /api/v1/health` - Service health
- `GET /api/v1/health/db` - Database connectivity

### Training Management
- `GET /api/v1/trainings` - Daftar semua pelatihan
- `GET /api/v1/trainings/:id` - Detail pelatihan
- `GET /api/v1/trainings/:id/detail` - Detail pelatihan + modul
- `POST /api/v1/trainings/enroll` - Daftar pelatihan

### Enrollment
- `GET /api/v1/enrollments/user/:umkmID` - Daftar enrollment user

## Setup & Run

### Requirements
- Go 1.23+
- PostgreSQL dengan schema `training` dan `ref`
- Migrations sudah dijalankan (006_training_tables.up.sql)

### Installation

```bash
cd services/training-service

# Install dependencies
go mod download

# Copy environment variables
cp .env.example .env

# Edit .env sesuai kebutuhan
# TRAINING_SERVICE_PORT=8083
# DATABASE_URL=postgres://umkm_user:umkm_password@localhost:5432/umkm_tumbuh?sslmode=disable

# Run service
go run cmd/api/main.go
```

Service akan berjalan di `http://localhost:8083`

### Test Endpoints

```bash
# Health check
curl http://localhost:8083/api/v1/health

# Get all trainings
curl http://localhost:8083/api/v1/trainings

# Get training detail
curl http://localhost:8083/api/v1/trainings/{PELATIHAN_ID}/detail

# Enroll user
curl -X POST http://localhost:8083/api/v1/trainings/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "UMKM...",
    "pelatihan_id": "PLT..."
  }'

# Get user enrollments
curl http://localhost:8083/api/v1/enrollments/user/{UMKM_ID}
```

## Database Schema

Service ini menggunakan tabel:
- `training.master_programpelatihan`
- `training.master_modulpelatihan`
- `training.transaksi_pendaftaranpelatihan`
- `ref.ref_jenispelatihan`
- `ref.ref_statuspelatihan`
- `ref.ref_statuspendaftaranpelatihan`

## Port

Default: **8083**
