# Postman and Newman collections

**English** | [Bahasa Indonesia](README.id.md)

This directory contains the existing API collections and local environments. For the current Stage 1 infrastructure check, run `bash tests/stack/run.sh` from the repository root; see the [local guide](../../docs/README_LOCAL_DEV.md).

## Scope and current limitations

`umkm-tumbuh-backend.postman_collection.json` contains 35 requests covering health, login, UMKM/Mitra registration, admin review, and negative cases. It predates the current email-verification flow and contains no verification request/confirmation step. Some login and registration assertions therefore need updating before the collection can serve as a reliable regression gate.

A passing Stage 1 run does not imply that this older collection passes. Review the request scripts and expected statuses against the current handlers when maintaining it. Other collections in this directory have their own scenarios and environments.

These requests can create accounts and change registration status. Run them against a development database whose records may be changed.

## Run the existing backend collection

Start the application from the repository root:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait --wait-timeout 180
npm install -g newman newman-reporter-htmlextra
mkdir -p tests/postman/reports
newman run tests/postman/umkm-tumbuh-backend.postman_collection.json \
  -e tests/postman/local.postman_environment.json \
  -r cli,htmlextra \
  --reporter-htmlextra-export tests/postman/reports/backend-report.html
```

The HTML report is written to `tests/postman/reports/backend-report.html`. The command retains Newman's failing exit status when assertions fail.

## Environment variables

The default environment uses `auth_base_url=http://localhost:8080` and `user_base_url=http://localhost:8081`. These values omit `/api/v1` because the collection already includes it in request paths. If ports differ, override them with Newman's `--env-var` option or use a local environment copy.

`admin_email` and `admin_password` must match an existing admin in the target database. Review the UMKM/Mitra account values and request scripts before running; do not assume the large CSV seed supplies working credentials. Keep private tokens, environment exports, and generated reports out of commits.
