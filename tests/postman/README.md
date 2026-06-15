# UMKM Tumbuh Backend Newman Tests

Automated Postman/Newman tests for happy path, alternative path, and sad path.

## Run locally

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build

npm install -g newman newman-reporter-htmlextra

newman run tests/postman/umkm-tumbuh-backend.postman_collection.json \
  -e tests/postman/local.postman_environment.json \
  -r cli,htmlextra \
  --reporter-htmlextra-export tests/postman/reports/backend-report.html
```

Open `tests/postman/reports/backend-report.html` and use it as TestScript evidence.

## Coverage

- Happy Path: health checks, admin login, UMKM registration, admin approval, approved UMKM login, current user.
- Alternative Path: Mitra registration, admin rejection with reason, uppercase email login, list registrations.
- Sad Path: duplicate registration, pending login, invalid email, invalid role, rejected login, missing admin token, non-admin admin access, reject without reason.
