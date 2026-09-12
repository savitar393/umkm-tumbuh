# Training service

**English** | [Bahasa Indonesia](README.id.md)

Manages training programs, modules, enrollments, progress, and certificates. The default port is **8084**. The service uses the shared PostgreSQL schema and generates certificate files locally.

## Run with Docker

Use the [local development guide](../../docs/README_LOCAL_DEV.md) to start the complete application. To build and start only this service and its database dependencies, run from the repository root:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait training-service
```

This command does not start auth-service. Use the full stack when you need to log in and call authenticated endpoints.

Compose sets `CERTIFICATE_DIR=/app/certificates` and mounts the `certificates_data` volume there. Normal container recreation retains these files. Training does not consume Garage credentials.

## Run with Go

Use Go 1.26.3 to match the Docker build. Start PostgreSQL and apply all repository migrations first; see the [database guide](../../infra/db/README.md). Migration 006 alone is not the complete current schema.

If training-service is already running in Docker on port 8084, stop that service before starting a Go process on the same port:

```bash
docker compose --env-file .env -f infra/docker-compose.yml stop training-service
cd services/training-service
[ -f .env ] || cp .env.example .env
```

Review `.env` before running: `DATABASE_URL` must reach the host-published PostgreSQL port and `JWT_SECRET` must match auth-service. The configuration loader reads the root `.env` before the service `.env`; values already present in the environment are preserved. The default certificate directory outside Docker is `./certificates`.

```bash
go mod download
go run ./cmd/api
```

## API routes

All paths below start with `/api/v1`. Authenticated routes require `Authorization: Bearer <access_token>`.

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Service health |
| GET | `/health/db` | Public | Database connectivity |
| GET | `/trainings/` | Public | Training list |
| GET | `/trainings/{id}` | Public | Training record |
| GET | `/trainings/{id}/detail` | Public | Training details and modules |
| POST | `/trainings/enroll` | JWT | Enroll in training |
| GET | `/enrollments/user/{umkmID}` | JWT | User enrollments |
| PATCH | `/enrollments/progress` | JWT | Update progress |
| PATCH | `/enrollments/complete` | JWT | Complete training |
| GET | `/certificates/list`, `/certificates/stats` | JWT | Certificate lists and statistics |
| GET | `/certificates/user/{umkmID}` | JWT | User certificates |
| GET | `/certificates/user/{umkmID}/dashboard` | JWT | User certificate dashboard |
| GET | `/certificates/{id}`, `/certificates/{id}/download` | JWT | Certificate record or file |
| POST | `/certificates/request` | JWT | Request a certificate |
| POST | `/certificates/{id}/approve`, `/certificates/{id}/reject` | JWT | Review a certificate |
| GET | `/admin/training/`, `/admin/training/stats`, `/admin/training/{id}` | JWT | Training management views |
| POST | `/admin/training/` | JWT | Create training |
| PUT / DELETE | `/admin/training/{id}` | JWT | Update or delete training |
| PATCH | `/admin/training/{id}/status` | JWT | Update training status |

The table reflects routes and JWT middleware in [internal/router/router.go](internal/router/router.go); it is not a verification of every role or ownership rule. Request fields and business validation live in the handlers under `internal/trainings/` and `internal/certificates/`.

## Check the service

```bash
curl -fsS http://localhost:8084/api/v1/health
curl -fsS http://localhost:8084/api/v1/health/db
curl -fsS http://localhost:8084/api/v1/trainings/
```

For an authenticated request, set `TOKEN` to a valid login access token and `UMKM_ID` to a real business ID in the current database:

```bash
curl -fsS -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8084/api/v1/enrollments/user/$UMKM_ID"
```

Use the actual published host port if it differs from 8084. The Stage 1 stack check verifies training health and database connectivity; it does not exercise enrollment or certificate workflows.
