# UMKM Tumbuh Platform

Platform manajemen UMKM dengan fitur monitoring perkembangan, partnership, dan dashboard analytics.

## 🚀 Quick Start (Windows)

### Prerequisites
- Docker Desktop
- Node.js 18+ & npm
- Git

### Cara Tercepat

```powershell
# Clone repository
git clone <repository-url>
cd umkm-tumbuh

# Start semua service (backend + frontend + data dummy)
.\quick-start.ps1
```

Script ini akan:
1. ✅ Start PostgreSQL, Auth Service, User Service
2. ✅ Load 5000 UMKM + 1000 Mitra dummy data
3. ✅ Install frontend dependencies
4. ✅ Start frontend dev server

Tunggu sampai muncul:
```
→ Local: http://localhost:5173
```

Buka browser ke `http://localhost:5173` dan login!

---

## 📋 Login Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **Admin** | admin@example.com | admin12345 | Peta Indonesia, analytics nasional |
| **UMKM** | rezawahyuni525@umkm.id | password123 | Laba harian, tren, KPI |
| **Mitra** | fauzan.kusuma54@mitra.id | password123 | Pilih UMKM partner |

> **Note:** Ada 5000 akun UMKM dan 1000 akun Mitra lainnya, semua pakai password `password123`

---

## 🔧 Manual Setup

Jika ingin setup manual langkah per langkah:

### 1. Start Backend

```powershell
cd infra
docker compose up -d
```

Tunggu sampai semua service healthy (±30 detik).

### 2. Load Dummy Data

```powershell
docker compose --profile seed up db-seed
```

Tunggu sampai muncul: `"Dummy CSV dataset loaded successfully."`

### 3. Start Frontend

```powershell
cd frontend
npm install
npm run dev
```

---

## 🧪 Verifikasi Integrasi

Jalankan script verifikasi untuk memastikan semua terintegrasi:

```powershell
.\verify-integration.ps1
```

Script ini akan check:
- ✅ Docker services status
- ✅ Database data (UMKM, Mitra, Admin)
- ✅ Backend API health
- ✅ Login & Dashboard API
- ✅ Frontend status

---

## 🏗️ Arsitektur

```
┌─────────────────┐
│   Frontend      │  React + TypeScript (Port 5173)
│   (Vite)        │
└────────┬────────┘
         │
    ┌────┴─────────────────────┐
    │                          │
┌───▼─────────┐      ┌─────────▼────┐
│Auth Service │      │ User Service │
│  (Port 8080)│      │  (Port 8081) │
└──────┬──────┘      └──────┬───────┘
       │                    │
       └──────────┬─────────┘
                  │
         ┌────────▼────────┐
         │   PostgreSQL    │
         │   (Port 5432)   │
         └─────────────────┘
```

### Tech Stack

**Backend:**
- Go 1.23
- PostgreSQL 16
- JWT Authentication
- CORS enabled

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Recharts (charts)
- Leaflet (maps)

---

## 📁 Struktur Project

```
umkm-tumbuh/
├── services/
│   ├── auth-service/         # Auth & Admin API (Port 8080)
│   └── user-service/         # User & Dashboard API (Port 8081)
├── infra/
│   ├── docker-compose.yml    # Orchestration
│   └── db/
│       ├── migrations/       # Database schema
│       ├── loaders/          # Data loaders
│       └── dummy/            # CSV dummy data (5000 UMKM, 1000 Mitra)
├── frontend/
│   └── src/
│       ├── features/         # Feature modules
│       │   ├── admin/        # Admin dashboard
│       │   ├── dashboard/    # UMKM/Mitra dashboard
│       │   └── auth/         # Login/Register
│       └── shared/           # Shared utilities
├── tests/
│   └── postman/              # API tests
├── quick-start.ps1           # 🚀 Quick start script
├── verify-integration.ps1    # 🧪 Verification script
├── stop-all.ps1              # 🛑 Stop all services
└── INTEGRASI_DATA_DUMMY.md   # 📖 Integration guide
```

---

## 🔌 API Endpoints

### Auth Service (http://localhost:8080/api/v1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | - | Register UMKM/Mitra |
| POST | `/auth/login` | - | Login |
| GET | `/dashboard/national` | JWT (Admin) | Dashboard nasional |
| GET | `/admin/registrations` | JWT (Admin) | List pending registrations |
| PATCH | `/admin/registrations/:id/approve` | JWT (Admin) | Approve registration |

### User Service (http://localhost:8081/api/v1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/umkm` | JWT (UMKM) | Dashboard UMKM |
| GET | `/dashboard/mitra` | JWT (Mitra) | Dashboard Mitra |
| GET | `/profiles/me` | JWT | Get user profile |
| PUT | `/profiles/me` | JWT | Update profile |

---

## 🧰 Utility Scripts

### Quick Start
```powershell
.\quick-start.ps1
```
Start semua service + load data + start frontend.

### Verify Integration
```powershell
.\verify-integration.ps1
```
Check status integrasi backend-frontend.

### Stop All
```powershell
.\stop-all.ps1
```
Stop semua Docker containers.

### Reset Database
```powershell
cd infra
docker compose down -v
docker compose up -d
docker compose --profile seed up db-seed
```

---

## 🐛 Troubleshooting

### Port sudah terpakai

```powershell
# Check apa yang pakai port 5432, 8080, 8081, 5173
netstat -ano | findstr "5432 8080 8081 5173"

# Stop service yang konflik atau ubah port di .env
```

### Data tidak muncul di dashboard

```powershell
# Re-load data dummy
cd infra
docker compose --profile seed up db-seed --force-recreate
```

### Login gagal

```powershell
# Reset password semua akun
docker exec -i umkm_postgres psql -U umkm_user -d umkm_tumbuh -c "UPDATE auth.master_akunpengguna SET password_hash = '\$2a\$10\$i4zh4ChkGz83OiOUXt65mOYPYg8GdcLWM9TBW9evmAqXSGcGf6kpm', status_aktif = TRUE WHERE peran_id IN ('UMKM','MITRA');"
```

### CORS error

Check `FRONTEND_URL` di `infra/.env`:
```env
FRONTEND_URL=http://localhost:5173
```

Restart services:
```powershell
cd infra
docker compose restart auth-service user-service
```

---

## 🧪 Testing

### Backend API Tests (Postman/Newman)

```powershell
# Install Newman
npm install -g newman

# Run tests
newman run tests\postman\umkm-tumbuh-backend.postman_collection.json -e tests\postman\local.postman_environment.json
```

### Manual Testing

1. **Admin Dashboard:**
   - Login: admin@example.com / admin12345
   - Should see: Peta Indonesia, charts, top wilayah

2. **UMKM Dashboard:**
   - Login: rezawahyuni525@umkm.id / password123
   - Should see: Laba harian, tren, KPI cards

3. **Mitra Dashboard:**
   - Login: fauzan.kusuma54@mitra.id / password123
   - Should see: Dropdown UMKM, dashboard UMKM partner

---

## 📊 Dummy Data

Data dummy sudah di-commit di folder `infra/db/dummy/seed-csv/`:

- **5000 UMKM** dari berbagai kota di Jawa Tengah
- **1000 Mitra** (Supplier, Distributor, Konsultan, Bank)
- **30,000+ transaksi monitoring** (laba harian)
- **500+ partnership** antar UMKM-Mitra
- **50+ pelatihan** yang sudah diikuti

Password universal: `password123` (hash bcrypt sudah tersimpan)

---

## 📝 Development Guide

### Add New Feature

1. **Backend (Go):**
   - Add handler: `services/*/internal/{feature}/handler.go`
   - Add service: `services/*/internal/{feature}/service.go`
   - Add repository: `services/*/internal/{feature}/repository.go`
   - Register routes di `main.go`

2. **Frontend (React):**
   - Add feature folder: `frontend/src/features/{feature}/`
   - Add pages: `pages/{Feature}Page.tsx`
   - Add API: `api.ts`
   - Add routes: `routes.tsx`

### Database Migration

```powershell
# Add new migration
# Create file: infra/db/migrations/XXX_description.up.sql
# Create file: infra/db/migrations/XXX_description.down.sql

# Apply migration
cd infra
docker compose restart db-migrate
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m 'Add fitur X'`
4. Push branch: `git push origin feature/nama-fitur`
5. Create Pull Request

---

## 📄 License

[Your License Here]

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check `INTEGRASI_DATA_DUMMY.md` untuk panduan detail
2. Run `.\verify-integration.ps1` untuk diagnostics
3. Check logs: `docker compose logs -f`

---

**Happy Coding! 🚀**
