#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required."
  exit 1
fi

MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/migrations}"

echo "Waiting for PostgreSQL..."
until psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT 1;" >/dev/null 2>&1; do
  sleep 2
done

echo "Preparing migration history table..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE TABLE IF NOT EXISTS app_private.schema_migrations (
    migration_name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL

echo "Running migrations from $MIGRATIONS_DIR"

for file in $(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.up.sql' | sort); do
  name="$(basename "$file")"

  already_applied="$(
    psql "$DATABASE_URL" -tAc \
      "SELECT 1 FROM app_private.schema_migrations WHERE migration_name = '$name' LIMIT 1;"
  )"

  if [ "$already_applied" = "1" ]; then
    echo "Skipping already applied migration: $name"
    continue
  fi

  echo "Applying migration: $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO app_private.schema_migrations (migration_name) VALUES ('$name');"

  echo "Applied migration: $name"
done

echo "All migrations applied successfully."
