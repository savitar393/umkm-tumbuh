#!/bin/sh
# Hanya dijalankan di proyek Compose uji, sebelum aplikasi dimulai.
set -eu
[ "$(psql "$DATABASE_URL" -Atc 'SELECT current_database()')" = umkm_tumbuh_test ] || exit 1
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atc "SELECT 1 FROM app_private.schema_migrations WHERE migration_name = '033_partnership_application_numbers.up.sql'" | grep -qx 1

# Rollback tanpa konfirmasi harus gagal, bahkan saat sequence belum dipakai.
if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/033.down.sql >/tmp/rollback.log 2>&1; then
    echo 'ERROR: rollback tanpa konfirmasi diterima'; exit 1
fi
grep -q 'Rollback 033 ditolak' /tmp/rollback.log
# Rollback kosong yang eksplisit, kemudian pulihkan migrasi untuk uji berikutnya.
PGOPTIONS='-c app.partnership_allocator_retired=on' psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/033.down.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/033.up.sql

# Jalankan blok impor kemitraan ASLI dengan dua baris CSV, bukan seluruh seed.
mkdir -p /tmp/csv
cp /app/partnership-import.csv /tmp/csv/transaksi_pengajuankerjasama.csv
cp /app/loaders/sync_partnership_numbers.sql /tmp/sync_partnership_numbers.sql
sed -n '/^CREATE TEMP TABLE _tpks AS SELECT/,/^\\ir sync_partnership_numbers.sql/p' /app/loaders/load_generated_csv.sql > /tmp/import.sql
grep -q '^\\ir sync_partnership_numbers.sql' /tmp/import.sql
cd /tmp
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/import.sql

# Nomor yang dipesan tetapi belum menjadi baris tidak boleh digunakan kembali.
reserved=$(psql "$DATABASE_URL" -Atc "SELECT nextval('partnership.application_number_seq')")
[ "$reserved" -gt 910000 ]
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/loaders/sync_partnership_numbers.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/loaders/sync_partnership_numbers.sql
next=$(psql "$DATABASE_URL" -Atc "SELECT nextval('partnership.application_number_seq')")
[ "$next" -gt "$reserved" ]
# Sekalipun konfirmasi diberikan, state yang sudah dipakai harus dipertahankan.
if PGOPTIONS='-c app.partnership_allocator_retired=on' psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/033.down.sql >/tmp/rollback.log 2>&1; then
    echo 'ERROR: rollback menghapus state allocator'; exit 1
fi
grep -q 'state allocator sudah dipakai' /tmp/rollback.log
[ "$(psql "$DATABASE_URL" -Atc 'SELECT last_value FROM partnership.application_number_seq')" = "$next" ]
[ "$(psql "$DATABASE_URL" -Atc "SELECT count(*) FROM partnership.transaksi_pengajuankerjasama WHERE pengajuan_id IN ('PGJ900000','PGJ900002')")" = 2 ]
echo 'PASS: impor setelah migrasi, sinkronisasi berulang, dan kebijakan rollback allocator'
