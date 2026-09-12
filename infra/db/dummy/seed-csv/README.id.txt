UMKM Tumbuh - Catatan seed CSV

English: README.txt | Bahasa Indonesia

Ini adalah dataset lama yang dibuat oleh generator. Dataset ini terpisah
dari enam akun Stage 1 terisolasi pada tests/stack/fixtures.sql.

Berkas csv/master_akunpengguna.csv yang tersimpan berisi 6.250 baris akun
dengan hash kata sandi SHA-256. Auth service memverifikasi hash bcrypt,
sehingga baris tersebut belum dapat digunakan untuk login aplikasi. Jangan
menganggap kata sandi bersama seperti password123 akan berfungsi.
manifest.json menjelaskan proses pembuatan dataset lama; nilai bawaan
generator saat ini dapat berbeda dari manifest tersebut.

Generator saat ini berada di ../generate_umkm_tumbuh.py. Opsi
--password-hash-algo mendukung:
- bcrypt: nilai bawaan saat ini; kompatibel dengan layanan autentikasi Go.
  Memerlukan paket Python bcrypt.
- sha256: hash sintetis; tidak kompatibel dengan pemeriksa login saat ini.
- pbkdf2: hash berformat PBKDF2; tidak kompatibel dengan pemeriksa login saat ini.
- constant: mode placeholder lama; periksa nilai hasilnya sebelum digunakan.

Generator dapat menulis kredensial uji dalam bentuk plaintext ke berkas
metadata. Jangan sertakan hasil tersebut dalam commit. Membuat ulang dan
mengimpor dataset bersifat opsional; startup biasa dan pengujian Stage 1
tidak memerlukannya.

import_order.txt mencantumkan urutan impor yang disarankan. Layanan Compose
db-seed menyediakan direktori kerja yang dibutuhkan load_generated_csv.sql.
Loader mengosongkan tabel referensi dengan CASCADE, sehingga data aplikasi
yang bergantung padanya ikut terhapus. Gunakan hanya basis data pengembangan
yang seluruh isinya boleh dibuang, dengan layanan aplikasi dihentikan.
Lihat ../../README.id.md untuk perintah basis data.
