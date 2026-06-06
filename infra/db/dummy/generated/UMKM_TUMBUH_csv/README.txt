Password hash modes:
- sha256: fast synthetic hash, default, useful for dataset realism but not for real authentication if your app expects bcrypt.
- pbkdf2: standard-library PBKDF2 format, slower but more realistic than plain SHA-256.
- bcrypt: real bcrypt hash, requires pip install bcrypt, recommended if your Go auth-service verifies bcrypt.
- constant: keeps the old constant placeholder hash.

Suggested PostgreSQL import order is listed in import_order.txt.
