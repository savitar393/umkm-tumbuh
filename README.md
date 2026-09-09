# UMKM Tumbuh Platform

Platform manajemen UMKM dengan fitur monitoring perkembangan, partnership, dan dashboard analytics.

---

## Local development

Requirements: Docker Desktop/Engine with Compose 2.24.4+, Node.js 22, and npm. In WSL, enable Docker Desktop integration for your distribution.

Run from the repository root for a new checkout:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait --wait-timeout 180
```

Keep existing environment files when upgrading. The stack runs all five APIs, PostgreSQL, Garage, Mailpit, migrations, and the admin seed. Garage credentials are generated and shared automatically.

Start the frontend in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The default local admin is `admin@example.com` / `admin12345`.

Run the isolated Stage 1 integration check:

```bash
bash tests/stack/run.sh
```

See [the local development guide](docs/README_LOCAL_DEV.md) for service addresses, port configuration, persistent volumes, six isolated test fixtures, and troubleshooting. The large CSV seed is optional and replaces application data; it is not needed for Stage 1 checks.

---

## 🏗️ Arsitektur

| Component | Port | Purpose |
| --- | --- | --- |
| Frontend | 5173 | React application |
| Auth service | 8080 | Authentication and admin API |
| User service | 8081 | Profiles, products, sales, dashboards |
| Partnerships service | 8082 | Partnerships API |
| Document service | 8083 | Document uploads and downloads |
| Training service | 8084 | Training and certificates |
| PostgreSQL | 5432 | Shared database |
| Garage | 3900 / 3903 | S3 storage / admin API |
| Mailpit | 1025 / 8025 | Local SMTP / inbox |

### Tech Stack

**Backend:**
- Go (Docker builds use 1.26.3)
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

## Managing the local stack

Run these commands from the repository root:

```bash
# Stop containers and preserve data
docker compose --env-file .env -f infra/docker-compose.yml down

# Inspect services and logs
docker compose --env-file .env -f infra/docker-compose.yml ps -a
docker compose --env-file .env -f infra/docker-compose.yml logs --tail 80
```

For port conflicts, Garage setup failures, and fixture details, see [the local development guide](docs/README_LOCAL_DEV.md). Keep the root `.env` and `frontend/.env` consistent when changing published ports.

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
docker compose --env-file .env -f infra/docker-compose.yml restart db-migrate
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
docker compose --env-file .env -f infra/docker-compose.yml logs -f
```

---

**Happy Coding! 🚀**
