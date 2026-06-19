UMKM TUMBUH Mandat synthetic dataset generator output

Schema target: STAGING_SQLSERVER_Mandat.sql
Generator version: 1

This output is generated to match the exact Mandat schema tables/columns.

Realism choices implemented:
1. UMKM category affects product names, product prices, legalitas, business description, training choices, and partnership needs.
2. Mitra type affects fields of partnership and support forms.
3. Training programs are free: master_programpelatihan.harga = 0.
4. Assignments are project/file-upload based only. No quiz-style data.
5. Document rows are context-aware: task uploads, certificates, partnership agreements, UMKM profile docs, mitra profile docs, and support documents.
6. Registration statuses have coherent submit/review/activation dates.
7. Training enrollment progress, module completion, assignment submission, and certificate statuses are correlated.
8. Partnership statuses control decision date, agreement document date, and partnership start/end dates.
9. Product stock, sales, sales items, and stock mutation rows are generated for sales/stock BI analysis.
10. Monitoring rows behave like time-series data with trend, seasonality, weekend effects, category effects, and business scale effects.
11. v2.1 adds wider variation in locations, addresses, emails, phone/NIK/NIB generation, business descriptions, mitra profiles, documents, and training text.
12. NIK, NIB, and phone numbers are generated as string values. Spreadsheet apps may still display them as scientific notation if a CSV is opened directly.
13. v2.2 can generate varied password_hash values for master_akunpengguna. The helper file metadata/generated_credentials.csv contains staging plaintext passwords for login testing unless --skip-credentials-file is used.

v2.3 adds BI-oriented sales and stock transaction tables while still excluding auth/runtime and thumbnail/object-storage metadata.

Password hash modes:
- bcrypt: default for current UMKM Tumbuh auth-service because login uses bcrypt verification.
- pbkdf2: standard-library PBKDF2 format, slower but more realistic than plain SHA-256.
- sha256/pbkdf2/constant: available only for special testing, not recommended for current login flow unless auth-service is changed.
- constant: keeps the old constant placeholder hash.

Suggested PostgreSQL import order is listed in import_order.txt.
