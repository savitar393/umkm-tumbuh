# UMKM Tumbuh

UMKM Tumbuh is a microservices-based web application for UMKM registration, profile management, product management, stock management, sales reporting, partnership submissions, and administrative validation.

## Current Local Architecture

| Component | Port | Description |
|---|---:|---|
| Frontend | 5173 | React + Vite web app |
| auth-service | 8080 | Authentication, registration, admin approval |
| user-service | 8081 | UMKM/Mitra profiles, products, stock, sales reporting |
| partnerships-service | 8082 | Partnership request workflow |
| PostgreSQL | 5432 | Main relational database |
| Garage S3 API | 3900 | S3-compatible object storage |
| Garage RPC | 3901 | Garage internal RPC |
| Garage Web | 3902 | Garage web endpoint |
| Garage Admin API | 3903 | Garage admin endpoint |

## Prerequisites

Install these first:

- Docker Desktop with WSL2 integration enabled
- Git
- Go
- Node.js and npm
- curl

## Branch Workflow

Use `dev` as the integration branch and `main` as the stable branch.

    git checkout dev
    git pull origin dev
    git checkout -b feature-or-fix-branch

After testing:

    git checkout dev
    git pull origin dev
    git merge --no-ff feature-or-fix-branch
    git push origin dev

## Environment Setup

Copy root env:

    cp .env.example .env

Copy frontend env:

    cp frontend/.env.example frontend/.env

For local development, `frontend/.env` should contain:

    VITE_API_BASE_URL=http://localhost:8080/api/v1
    VITE_USER_API_BASE_URL=http://localhost:8081/api/v1
    VITE_PARTNERSHIP_API_BASE_URL=http://localhost:8082/api/v1

The root `.env` should include at least:

    APP_ENV=development
    FRONTEND_URL=http://localhost:5173

    POSTGRES_USER=umkm_user
    POSTGRES_PASSWORD=umkm_password
    POSTGRES_DB=umkm_tumbuh

    JWT_SECRET=change-me
    JWT_EXPIRE_MINUTES=1440

    ADMIN_ID=AKUNADMIN001
    ADMIN_FULL_NAME=Admin Pemerintah
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=admin12345

    OBJECT_STORAGE_ENDPOINT=http://garage:3900
    OBJECT_STORAGE_PUBLIC_ENDPOINT=http://localhost:3900
    OBJECT_STORAGE_REGION=garage
    OBJECT_STORAGE_USE_SSL=false
    OBJECT_STORAGE_ACCESS_KEY=
    OBJECT_STORAGE_SECRET_KEY=
    OBJECT_STORAGE_BUCKET_PRODUCT_IMAGES=product-images
    OBJECT_STORAGE_BUCKET_DOCUMENTS=documents
    OBJECT_STORAGE_BUCKET_CERTIFICATES=certificates
    OBJECT_STORAGE_BUCKET_PARTNERSHIP_FILES=partnership-files

Do not commit `.env` or `frontend/.env`.

## Run Full Local Stack

From repo root:

    docker compose --env-file .env -f infra/docker-compose.yml up -d --build

Check containers:

    docker compose --env-file .env -f infra/docker-compose.yml ps

Check logs:

    docker compose --env-file .env -f infra/docker-compose.yml logs --tail=80 auth-service
    docker compose --env-file .env -f infra/docker-compose.yml logs --tail=80 user-service
    docker compose --env-file .env -f infra/docker-compose.yml logs --tail=80 partnerships-service
    docker compose --env-file .env -f infra/docker-compose.yml logs --tail=80 db-migrate
    docker compose --env-file .env -f infra/docker-compose.yml logs --tail=80 partnerships-migrate
    docker compose --env-file .env -f infra/docker-compose.yml logs --tail=80 garage

## Health Checks

    curl -i http://localhost:8080/api/v1/health
    curl -i http://localhost:8081/api/v1/health
    curl -i http://localhost:8082/api/v1/health

Expected result: all services return HTTP 200.

## Garage Object Storage Setup

Garage is used as local S3-compatible object storage for product thumbnails and future binary files.

Start Garage:

    docker compose --env-file .env -f infra/docker-compose.yml up -d garage

Check Garage status:

    docker compose --env-file .env -f infra/docker-compose.yml exec garage /garage status

Copy the node ID from the status output, then assign layout:

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage layout assign -z local -c 1G NODE_ID_HERE

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage layout apply --version 1

Create app key:

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage key create umkm-app-key

Put the generated key values into `.env`:

    OBJECT_STORAGE_ACCESS_KEY=<generated_key_id>
    OBJECT_STORAGE_SECRET_KEY=<generated_secret_key>

Create buckets:

    docker compose --env-file .env -f infra/docker-compose.yml exec garage /garage bucket create product-images
    docker compose --env-file .env -f infra/docker-compose.yml exec garage /garage bucket create documents
    docker compose --env-file .env -f infra/docker-compose.yml exec garage /garage bucket create certificates
    docker compose --env-file .env -f infra/docker-compose.yml exec garage /garage bucket create partnership-files

Grant permissions:

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage bucket allow --read --write --owner product-images --key umkm-app-key

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage bucket allow --read --write --owner documents --key umkm-app-key

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage bucket allow --read --write --owner certificates --key umkm-app-key

    docker compose --env-file .env -f infra/docker-compose.yml exec garage \
      /garage bucket allow --read --write --owner partnership-files --key umkm-app-key

Restart services that use object storage:

    docker compose --env-file .env -f infra/docker-compose.yml up -d --build user-service partnerships-service

## Seed Default Admin

The Compose stack includes `auth-seed-admin`.

Check the seed result:

    docker compose --env-file .env -f infra/docker-compose.yml logs auth-seed-admin

Default local credentials:

    Email: admin@example.com
    Password: admin12345

## Run Dummy CSV Seed

The dummy dataset is committed under:

    infra/db/dummy/seed-csv/csv

Run the database seed profile:

    docker compose --env-file .env -f infra/docker-compose.yml --profile seed up --force-recreate db-seed

Check counts manually:

    docker compose --env-file .env -f infra/docker-compose.yml exec postgres \
      psql -U "${POSTGRES_USER:-umkm_user}" -d "${POSTGRES_DB:-umkm_tumbuh}"

Example SQL:

    SELECT COUNT(*) FROM auth.master_akunpengguna;
    SELECT COUNT(*) FROM user_mgmt.master_umkm;
    SELECT COUNT(*) FROM user_mgmt.master_mitra;
    SELECT COUNT(*) FROM dashboard.transaksi_monitoringperkembangan;
    SELECT * FROM dashboard.vw_dashboard_nasional_summary;

## Run Frontend

    cd frontend
    npm install
    npm run dev

Open:

    http://localhost:5173

If port 5173 is already in use:

    fuser -k 5173/tcp
    npm run dev

## Build and Test

Frontend:

    cd frontend
    npm install
    npm run build

Auth service:

    cd services/auth-service
    go test ./...

User service:

    cd services/user-service
    go test ./...

Partnerships service:

    cd services/partnerships-service
    go test ./...

## Useful API Smoke Tests

Login as admin:

    ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@example.com","password":"admin12345"}' \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

    echo "$ADMIN_TOKEN"

Check current admin:

    curl -i http://localhost:8080/api/v1/auth/me \
      -H "Authorization: Bearer $ADMIN_TOKEN"

Register a UMKM account:

    curl -i -X POST http://localhost:8080/api/v1/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "full_name": "Budi Santoso",
        "email": "budi.approval@example.com",
        "phone_number": "081234567893",
        "nik": "3372010101019999",
        "password": "password123",
        "role": "UMKM"
      }'

List pending registrations:

    curl -s "http://localhost:8080/api/v1/admin/registrations?status=PENDING" \
      -H "Authorization: Bearer $ADMIN_TOKEN"

Approve a registration:

    curl -i -X PATCH http://localhost:8080/api/v1/admin/registrations/USER_ID_HERE/approve \
      -H "Authorization: Bearer $ADMIN_TOKEN"

## Important Development Notes

- `infra/db/migrations` is the main database migration source for the core schema.
- `services/partnerships-service/migrations` is still used by the current partnership-service migrator.
- Garage must be initialized before product thumbnail upload can work.
- Product thumbnails are currently uploaded through `user-service`.
- In the final architecture, shared file uploads should move into `document-service`.
- Do not run `npm audit fix --force` unless the team agrees.
- Do not commit `.env`, `frontend/.env`, generated local volumes, or local Docker data.
