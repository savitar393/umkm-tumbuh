# Database and migrations

**English** | [Bahasa Indonesia](README.id.md)

All five services use PostgreSQL 16. Shared schema migrations are stored in [migrations/](migrations/). The migrator applies `*.up.sql` files in filename order and records completed filenames in `app_private.schema_migrations`. Repeated runs skip those files.

## Start the database

For normal application development, use the [full-stack setup](../../docs/README_LOCAL_DEV.md); it already runs migrations and seeds the admin.

For database work without the APIs, run from the repository root:

```bash
[ -f .env ] || cp .env.example .env
docker compose --env-file .env -f infra/docker-compose.db.yml up -d postgres
docker compose --env-file .env -f infra/docker-compose.db.yml run --rm --build db-migrate
```

Choose either the full-stack or database-only configuration for a session. They use the same default Compose project and PostgreSQL volume. The database-only configuration does not start the APIs, Garage, Mailpit, or the admin seed.

`POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` come from the root `.env`. `POSTGRES_PORT` controls the published host port; PostgreSQL listens on port 5432 inside Docker. Initial database credentials are applied when the data directory is empty; changing `.env` does not rewrite an existing PostgreSQL user or database.

## Add or rerun migrations

Keep new migrations in `infra/db/migrations/`, with matching `*.up.sql` and `*.down.sql` files. Give new migrations unused filenames and do not rewrite migrations that have already been applied. The current runner executes only the up files; down files are not an automatic rollback command.

For the full stack:

```bash
docker compose --env-file .env -f infra/docker-compose.yml run --rm --build db-migrate
docker compose --env-file .env -f infra/docker-compose.yml logs --tail 80 db-migrate
```

The `run` command prints that run's migration output directly. `logs db-migrate` shows output from the named Compose service container. Rebuilding ensures newly added migration files are copied into the image.

To stop the database-only setup while keeping its data:

```bash
docker compose --env-file .env -f infra/docker-compose.db.yml down
```

## Isolated test fixtures

Run `bash tests/stack/run.sh` from the repository root. [fixtures.sql](../../tests/stack/fixtures.sql) creates six synthetic accounts and their profiles only in `umkm_tumbuh_test`. It uses a transaction, preserves existing fixture rows on rerun, and refuses any other database name. The runner owns separate test volumes and cleans them up when it exits.

These fixtures do not populate the normal development database. See the [local guide](../../docs/README_LOCAL_DEV.md#run-the-isolated-stage-1-check) for accounts and expected output.

## Optional large CSV seed

The older dataset is in [dummy/seed-csv/](dummy/seed-csv/). Its loader uses `TRUNCATE ... CASCADE`, replacing existing application data. Use it only in a development database whose contents may be discarded, with application services stopped.

From the repository root, for the database-only setup:

```bash
docker compose --env-file .env -f infra/docker-compose.db.yml --profile seed run --rm db-seed
```

The Compose service mounts the committed files and sets the working directory expected by [loaders/load_generated_csv.sql](loaders/load_generated_csv.sql). Do not use the old `data/UMKM_TUMBUH_csv` path.

The CSV dataset is separate from the Stage 1 fixtures. Generator settings and older manifests may differ from the committed account file; a successful import does not establish usable login credentials. See the [CSV notes](dummy/seed-csv/README.txt). Do not commit generated plaintext credentials.
