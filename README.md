# UMKM Tumbuh Platform

Platform manajemen UMKM dengan fitur monitoring perkembangan, partnership, dan dashboard analytics.

---

## 🚀 Quick Start (Windows)

### Prerequisites
- Docker Desktop
- Node.js 18+ & npm
- Git

### Cara Setup Cepat

**Option 1: Manual (Step-by-Step)** - Lihat detail: [RUN_PROJECT.md](./RUN_PROJECT.md)

**Option 2: Auto Script (Windows)**
```powershell
# Clone repository terlebih dahulu
git clone <repository-url>
cd umkm-tumbuh

# Jalankan script auto setup
START_ALL.bat
```

**Option 3: PowerShell**
```powershell
cd infra
docker compose up -d
docker compose --profile seed up db-seed
cd ..\frontend
npm install
npm run dev
```

**Buka browser:** http://localhost:5173
**Login dengan credentials di bawah**

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
└── tests/
    └── postman/              # API tests
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
```
START_ALL.bat           - Start everything (backend + data + frontend)
```

### Status & Troubleshooting
```
CHECK_STATUS.bat        - Check system status
FIX_COMMON.bat          - Fix common issues (menu-based)
```

### Common Commands
```powershell
# Reset database
cd infra
docker compose down -v
docker compose up -d
docker compose --profile seed up db-seed

# Stop everything
docker compose down

# View logs
docker compose logs -f
```

### Frontend Only
```powershell
cd frontend
npm run dev              # Start frontend
npm install              # Install dependencies
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

Jika ada masalah atau pertanyaan, check logs:
```powershell
docker compose logs -f
```

---

**Happy Coding! 🚀**
