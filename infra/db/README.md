## How to test

```bash
docker compose --env-file .env -f infra/docker-compose.db.yml down -v
docker compose --env-file .env -f infra/docker-compose.db.yml up -d --build
docker compose --env-file .env -f infra/docker-compose.db.yml logs db-migrate
```

## Load dummy data

Run from the generated output directory:

```bash
cd data/UMKM_TUMBUH_csv
psql "$DATABASE_URL" -f ../../infra/db/loaders/load_generated_csv.sql
```

If paths differ, adjust the loader path.