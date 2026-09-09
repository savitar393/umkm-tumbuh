UMKM Tumbuh - CSV seed notes

English | Bahasa Indonesia: README.id.txt

This is the older generated dataset. It is separate from the six isolated
Stage 1 accounts in tests/stack/fixtures.sql.

The committed csv/master_akunpengguna.csv contains 6,250 account rows with
SHA-256 password hashes. The auth service verifies bcrypt hashes, so these
rows are not ready for application login. Do not assume a shared password
such as password123 will work. manifest.json describes the older generation;
the current generator's defaults can differ from it.

The current generator is ../generate_umkm_tumbuh.py. Its
--password-hash-algo option supports:
- bcrypt: the current default; compatible with the Go authentication service.
  Requires the Python bcrypt package.
- sha256: synthetic hashes; incompatible with the current login verifier.
- pbkdf2: PBKDF2-format hashes; incompatible with the current login verifier.
- constant: legacy placeholder mode; inspect the generated value before use.

The generator can write plaintext test credentials to a metadata file.
Keep that output out of commits. Regenerating and importing the dataset
is optional; normal startup and Stage 1 checks do not require it.

import_order.txt lists the suggested import order. The Compose db-seed
service supplies the working directory expected by load_generated_csv.sql.
The loader truncates reference tables with CASCADE, which removes dependent
application data. Use only a disposable development database, with the
application services stopped. See ../../README.md for database commands.
