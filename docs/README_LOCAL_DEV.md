# UMKM Tumbuh — Local Development & Testing Guide

This guide explains how to run and test the UMKM Tumbuh web application locally using Docker Compose.

Current local stack:

```text
PostgreSQL
db-migrate
auth-seed-admin
auth-service
user-service
optional db-seed
```

The current backend services are:

```text
auth-service  → http://localhost:8080
user-service  → http://localhost:8081
PostgreSQL    → localhost:5432
```

Frontend is still run separately from `frontend/` during development.

---

## 1. Prerequisites

Install these first:

```text
Docker Desktop / Docker Engine
Docker Compose plugin
Git
Go
Node.js + npm
```

For WSL users, run the project inside WSL, for example:

```bash
cd ~/dev/umkm-tumbuh
```

Make sure Docker is available from WSL:

```bash
docker version
docker compose version
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/savitar393/umkm-tumbuh.git
cd umkm-tumbuh
```

If you are still testing the migration branch before merging:

```bash
git checkout fix/migrations
```

After it is merged:

```bash
git checkout main
git pull origin main
```

---

## 3. Environment File Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and make sure these values exist:

```env
APP_ENV=development

POSTGRES_USER=umkm_user
POSTGRES_PASSWORD=umkm_password
POSTGRES_DB=umkm_tumbuh

JWT_SECRET=change-me
JWT_EXPIRE_MINUTES=60

FRONTEND_URL=http://localhost:5173

ADMIN_ID=AKUNADMIN001
ADMIN_FULL_NAME=Admin Pemerintah
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin12345

USER_SERVICE_HOST=0.0.0.0
USER_SERVICE_PORT=8081
```

For local development, `JWT_SECRET=change-me` is acceptable. For production, it must be changed.

Do not commit `.env`.

---

## 4. Start the Local Backend Stack

From the project root:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
```

This starts:

```text
postgres
db-migrate
auth-seed-admin
auth-service
user-service
```

Check container status:

```bash
docker compose --env-file .env -f infra/docker-compose.yml ps
```

Expected result:

```text
umkm_postgres          healthy/running
umkm_db_migrate        exited 0
umkm_auth_seed_admin   exited 0
umkm_auth_service      running
umkm_user_service      running
```

---

## 5. Check Migration Logs

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs db-migrate
```

Expected result:

```text
All migrations applied successfully.
```

The centralized production migrations are stored in:

```text
infra/db/migrations/
```

The service-local migrations are no longer the source of truth.

---

## 6. Check Service Logs

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs auth-service
docker compose --env-file .env -f infra/docker-compose.yml logs user-service
docker compose --env-file .env -f infra/docker-compose.yml logs auth-seed-admin
```

Expected examples:

```text
auth-service running on 0.0.0.0:8080
user-service running on 0.0.0.0:8081
Admin created: admin@example.com
```

If the admin already exists, that is fine.

---

## 7. Health Check

Test auth-service:

```bash
curl -i http://localhost:8080/api/v1/health
```

Test user-service:

```bash
curl -i http://localhost:8081/api/v1/health
```

Both should return successful responses.

---

## 8. Login as Default Admin

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin12345"
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "$ADMIN_TOKEN"
```

Check current admin:

```bash
curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected role:

```json
"role": "ADMIN"
```

Do not paste real JWT tokens into public issues, commits, or documentation.

---

## 9. Test UMKM Registration, Approval, Login, and Profile

### 9.1 Register UMKM

```bash
curl -i -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sari Wijaya",
    "email": "sari.profile@example.com",
    "phone_number": "081234567894",
    "nik": "3372010101018888",
    "password": "password123",
    "role": "UMKM"
  }'
```

Expected:

```text
201 Created
status: MENUNGGU
```

Copy the returned user `id`.

---

### 9.2 List Pending Registrations

```bash
curl -s "http://localhost:8080/api/v1/admin/registrations?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Find the registered UMKM account ID.

---

### 9.3 Approve UMKM

Replace `USER_ID_HERE` with the real account ID.

```bash
curl -i -X PATCH http://localhost:8080/api/v1/admin/registrations/USER_ID_HERE/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

```text
200 OK
status: DISETUJUI
```

---

### 9.4 Login as UMKM

```bash
UMKM_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sari.profile@example.com",
    "password": "password123"
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "$UMKM_TOKEN"
```

Expected: JWT token is returned.

---

### 9.5 Create UMKM Profile

```bash
curl -i -X PUT http://localhost:8081/api/v1/profiles/me \
  -H "Authorization: Bearer $UMKM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Sari Snack House",
    "business_category": "Makanan",
    "business_description": "UMKM makanan ringan lokal.",
    "owner_name": "Sari Wijaya",
    "nik": "3372010101018888",
    "phone_number": "081234567894",
    "address": "Jl. Melati No. 1",
    "city": "Surakarta",
    "province": "Jawa Tengah",
    "district": "Laweyan",
    "village": "Pajang",
    "postal_code": "57146"
  }'
```

Expected:

```text
200 OK
profile.business_name = Sari Snack House
profile.status = AKTIF
```

---

### 9.6 Get UMKM Profile

```bash
curl -i http://localhost:8081/api/v1/profiles/me \
  -H "Authorization: Bearer $UMKM_TOKEN"
```

Expected:

```text
200 OK
profile returned
```

---

## 10. Test Mitra Registration, Approval, Login, and Profile

### 10.1 Register Mitra

```bash
curl -i -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Andi Partnership",
    "email": "andi.mitra@example.com",
    "phone_number": "081234567895",
    "password": "password123",
    "role": "MITRA"
  }'
```

Expected:

```text
201 Created
status: MENUNGGU
```

Copy the returned user `id`.

---

### 10.2 Approve Mitra

```bash
curl -i -X PATCH http://localhost:8080/api/v1/admin/registrations/USER_ID_HERE/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

```text
200 OK
status: DISETUJUI
```

---

### 10.3 Login as Mitra

```bash
MITRA_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "andi.mitra@example.com",
    "password": "password123"
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "$MITRA_TOKEN"
```

---

### 10.4 Create Mitra Profile

```bash
curl -i -X PUT http://localhost:8081/api/v1/profiles/me \
  -H "Authorization: Bearer $MITRA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "PT Mitra Sejahtera",
    "organization_type": "Perusahaan",
    "legal_name": "PT Mitra Sejahtera Indonesia",
    "nib": "1234567890123",
    "npwp": "12.345.678.9-012.345",
    "description": "Mitra pendampingan UMKM bidang pemasaran dan distribusi.",
    "contact_person": "Andi Partnership",
    "contact_person_title": "Partnership Manager",
    "phone_number": "081234567895",
    "address": "Jl. Slamet Riyadi No. 10",
    "city": "Surakarta",
    "province": "Jawa Tengah",
    "district": "Laweyan",
    "village": "Pajang",
    "postal_code": "57146",
    "operational_area": "Surakarta dan sekitarnya",
    "cooperation_scale": "Lokal",
    "support_description": "Pendampingan pemasaran, akses distribusi, dan pelatihan branding."
  }'
```

Expected:

```text
200 OK
profile.organization_name = PT Mitra Sejahtera
profile.status = AKTIF
```

---

### 10.5 Get Mitra Profile

```bash
curl -i http://localhost:8081/api/v1/profiles/me \
  -H "Authorization: Bearer $MITRA_TOKEN"
```

Expected:

```text
200 OK
profile returned
```

---

## 11. Verify Database Records

Open PostgreSQL:

```bash
docker compose --env-file .env -f infra/docker-compose.yml exec postgres \
  psql -U "${POSTGRES_USER:-umkm_user}" -d "${POSTGRES_DB:-umkm_tumbuh}"
```

Useful checks:

```sql
SELECT COUNT(*) FROM auth.master_akunpengguna;
SELECT COUNT(*) FROM user_mgmt.master_pelakuumkm;
SELECT COUNT(*) FROM user_mgmt.master_umkm;
SELECT COUNT(*) FROM user_mgmt.master_mitra;

SELECT akun_id, umkm_id, mitra_id, checklist_informasi_lengkap
FROM user_mgmt.transaksi_registrasipengguna
ORDER BY created_at DESC
LIMIT 10;
```

Expected for completed UMKM profile:

```text
umkm_id filled
mitra_id null
checklist_informasi_lengkap = true
```

Expected for completed Mitra profile:

```text
mitra_id filled
umkm_id null
checklist_informasi_lengkap = true
```

Exit psql:

```sql
\q
```

---

## 12. Optional: Load Dummy CSV Data

The dummy dataset is stored under:

```text
infra/db/dummy/seed-csv/
```

The loader expects CSV files under:

```text
infra/db/dummy/seed-csv/csv/
```

Run the optional seed service:

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile seed up --force-recreate db-seed
```

Expected:

```text
Dummy CSV dataset loaded successfully.
```

The seed process is not idempotent. If you want to seed again, reset the database first:

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile seed down -v --remove-orphans
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
docker compose --env-file .env -f infra/docker-compose.yml --profile seed up --force-recreate db-seed
```

---

## 13. Copying Dummy CSV From Windows Into WSL

If the generated dataset is in Windows Downloads, copy only the clean CSV dataset.

Example:

```bash
cd ~/dev/umkm-tumbuh

rm -rf infra/db/dummy/seed-csv
mkdir -p infra/db/dummy/seed-csv

cp -r "/mnt/d/Downloads/UMKM_TUMBUH_csv/csv" infra/db/dummy/seed-csv/
cp "/mnt/d/Downloads/UMKM_TUMBUH_csv/import_order.txt" infra/db/dummy/seed-csv/ 2>/dev/null || true
cp "/mnt/d/Downloads/UMKM_TUMBUH_csv/manifest.json" infra/db/dummy/seed-csv/ 2>/dev/null || true
cp "/mnt/d/Downloads/UMKM_TUMBUH_csv/README.txt" infra/db/dummy/seed-csv/ 2>/dev/null || true
```

Do not copy or commit:

```text
metadata/
generated_credentials.csv
infra/db/dummy/generated/
```

---

## 14. Frontend Local Development

Open another terminal:

```bash
cd ~/dev/umkm-tumbuh/frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

Make sure frontend environment uses:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

If frontend needs to call user-service directly, add a separate frontend variable later, for example:

```env
VITE_USER_API_BASE_URL=http://localhost:8081/api/v1
```

---

## 15. Common Docker Commands

Stop containers but keep database volume:

```bash
docker compose --env-file .env -f infra/docker-compose.yml down
```

Stop containers and delete database volume:

```bash
docker compose --env-file .env -f infra/docker-compose.yml down -v --remove-orphans
```

Rebuild everything:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
```

View logs:

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs -f
```

View one service log:

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs -f auth-service
docker compose --env-file .env -f infra/docker-compose.yml logs -f user-service
docker compose --env-file .env -f infra/docker-compose.yml logs -f db-migrate
```

Remove stale seed container:

```bash
docker rm -f umkm_db_seed 2>/dev/null || true
```

---

## 16. Troubleshooting

### `db-migrate` does not finish

Check logs:

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs db-migrate
```

If there is a SQL error, fix the migration and reset the database volume:

```bash
docker compose --env-file .env -f infra/docker-compose.yml down -v --remove-orphans
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
```

---

### `auth-seed-admin` fails with `value too long for varchar(30)`

Check `.env`:

```bash
grep -n "^ADMIN_ID" .env
```

Use this value:

```env
ADMIN_ID=AKUNADMIN001
```

Do not use UUID format for `ADMIN_ID`.

---

### Login returns invalid credentials after registration

Registration accounts are created with status:

```text
MENUNGGU
```

They cannot login until approved by admin.

Approve through:

```bash
PATCH /api/v1/admin/registrations/{id}/approve
```

---

### `PUT /profiles/me` returns unauthorized

Make sure you use the correct token:

```text
UMKM profile → use UMKM_TOKEN
Mitra profile → use MITRA_TOKEN
Admin routes → use ADMIN_TOKEN
```

---

### `db-seed` duplicate key error

The dummy CSV may contain duplicate rows for a unique key.

For many-to-many tables, each composite key must be unique:

```text
master_mitrabentukdukungan.csv
master_mitrabidangkemitraan.csv
```

Resetting the database is also required before reseeding:

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile seed down -v --remove-orphans
```

---

## 17. Development Rules

Do not commit:

```text
.env
infra/db/dummy/generated/
infra/db/dummy/metadata/
generated_credentials.csv
```

Commit:

```text
.env.example
infra/db/migrations/
infra/db/loaders/
infra/db/dummy/seed-csv/
```

The source of truth for schema is:

```text
infra/db/migrations/
```

Do not add new service-local migration folders unless the architecture decision changes.

---

## 18. Minimum Smoke Test Before Pushing

Before pushing backend/database changes, run:

```bash
cd ~/dev/umkm-tumbuh

docker compose --env-file .env -f infra/docker-compose.yml down -v --remove-orphans
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
docker compose --env-file .env -f infra/docker-compose.yml logs db-migrate
```

Confirm:

```text
All migrations applied successfully.
```

Then test:

```bash
curl -i http://localhost:8080/api/v1/health
curl -i http://localhost:8081/api/v1/health
```

Also test at least one full auth/profile flow:

```text
admin login
register UMKM or Mitra
approve registration
login as approved user
PUT /profiles/me
GET /profiles/me
```
