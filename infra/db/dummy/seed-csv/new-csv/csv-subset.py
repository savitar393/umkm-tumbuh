import csv, hashlib, secrets

INPUT = "master_akunpengguna.csv"
OUTPUT = "master_akunpengguna_baru.csv"
PWD = "testaja123"

def hash_pwd(p):
    salt = secrets.token_urlsafe(16)
    return f"sha256${salt}${hashlib.sha256((salt+p).encode()).hexdigest()}"

with open(INPUT) as inf, open(OUTPUT, 'w', newline='') as outf:
    r = csv.DictReader(inf)
    w = csv.DictWriter(outf, r.fieldnames)
    w.writeheader()
    for i, row in enumerate(r, 1):
        row['password_hash'] = hash_pwd(PWD)
        w.writerow(row)
        if i % 100000 == 0: print(f"{i} baris diproses")
print(f"Selesai. File baru: {OUTPUT}")