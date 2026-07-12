#!/usr/bin/env python3
r"""
UMKM TUMBUH Mandat CSV dataset generator.

Target schema: current UMKM Tumbuh PostgreSQL schema used by dev/feat-deploy (service schemas with master_* and transaksi_* tables)

This generator focuses on realistic and varied synthetic data, not merely random values.
It creates one CSV per table in the Mandat schema and keeps relationships coherent across:
- accounts, UMKM, mitra, products, locations, documents
- registration review lifecycle
- free training programs, modules, project/file-upload assignments
- enrollment progress, submissions, certificates
- partnership proposal lifecycle
- UMKM monitoring trends
- product stock, sales transactions, sales items, and stock mutation transactions

Important business rules implemented:
- master_programpelatihan.harga is always "0".
- Assignments are file-upload/project/report/presentation based only; no quiz data is generated.
- Notification, audit, blacklist, remember-token, and verification-code tables are generated only if they exist in the current SQL schema; this version keeps them out because they are not present in the current migrated service schema.
- Product stock, sales, stock mutation, assignment submission, certificate, and dashboard monitoring CSVs are generated schema-first; loader scripts can be updated later to import them.

Usage examples:
    python generate_umkm_tumbuh_mandat.py --transaction-rows 5000 --out-dir ./sample_csv
    python generate_umkm_tumbuh_mandat.py --transaction-rows 2000000 --zip UMKM_TUMBUH_Mandat_full.zip --compresslevel 1

    # PowerShell multiline uses backtick (`), not caret (^):
    python generate_umkm_tumbuh_mandat.py `
        --transaction-rows 2000000 `
        --out-dir D:\Downloads\UMKM_TUMBUH_Mandat_full `
        --password-mode shared `
        --shared-password Password123! `
        --password-hash-algo bcrypt `
        --overwrite

No external packages required for the default sha256/pbkdf2 modes.
For --password-hash-algo bcrypt, install the optional dependency: pip install bcrypt
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import io
import json
import math
import os
import random
import shutil
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional, Sequence, Tuple, Union, TextIO

SCHEMA_NAME = "STAGING_SQLSERVER_Mandat.sql"
GENERATOR_VERSION = "1"
DEFAULT_SEED = 20260602
TODAY = datetime(2026, 6, 2, 10, 0, 0)
START = datetime(2024, 1, 1, 8, 0, 0)

# -----------------------------------------------------------------------------
# CLI-size defaults. These are intentionally larger than the bare requirement
# for richer joins and less repetitive transaction data, but still manageable.
# -----------------------------------------------------------------------------
DEFAULT_ADMIN_ROWS = 250
DEFAULT_UMKM_ROWS = 5_000
DEFAULT_MITRA_ROWS = 1_000
DEFAULT_PELATIHAN_ROWS = 420
DEFAULT_LOKASI_ROWS = 6_500
DEFAULT_MIN_PRODUCTS_PER_UMKM = 2
DEFAULT_MAX_PRODUCTS_PER_UMKM = 6

# -----------------------------------------------------------------------------
# Indonesian-ish dictionaries and domain vocabularies.
# -----------------------------------------------------------------------------
FIRST_NAMES = [
    "Ahmad", "Budi", "Siti", "Nur", "Dewi", "Agus", "Rina", "Hendra", "Fitri", "Yusuf",
    "Putri", "Wahyu", "Tri", "Dian", "Fajar", "Nadia", "Rizky", "Aulia", "Farhan", "Intan",
    "Bayu", "Lestari", "Arif", "Maya", "Teguh", "Salsa", "Nugroho", "Kartika", "Andi", "Rahayu",
    "Rafi", "Kirana", "Bagus", "Sekar", "Galih", "Hana", "Rifqi", "Mila", "Dimas", "Niken",
    "Ilham", "Miftah", "Vina", "Citra", "Rangga", "Aditya", "Dinda", "Ari", "Fauzan", "Mega",
    "Rizka", "Hanif", "Naila", "Pram", "Suryo", "Annisa", "Fikri", "Dwi", "Nisa", "Reza", "Adeliya",
    "Darel", "Lois", "Rambat", "Rasyid", "Yoeke", "Raihan", "Jonnathan", "Rexy", "Satria", "Fatih",
    "Prayuda", "Anindya", "Lolo", "Viola", "Meiva", "Prabowo", "Bahlil", "Dhea", "Angelina", "Najma",
    "Gloria"
]
LAST_NAMES = [
    "Prasetyo", "Santoso", "Wibowo", "Utami", "Kurniawan", "Lestari", "Saputra", "Handayani",
    "Nugroho", "Wahyuni", "Hidayat", "Purnomo", "Sari", "Rahmawati", "Setiawan", "Firmansyah",
    "Maulana", "Permata", "Wijaya", "Ningsih", "Pramono", "Cahyani", "Anwar", "Puspita", "Harlitasari",
    "Suryani", "Fauzi", "Ramadhan", "Mulyani", "Haunan", "Amalia", "Fitriani", "Amin", "Basuki", "Astuti",
    "Aryati", "Hapsari", "Pertiwi", "Ryannareta", "Ungu", "Hylmi", "Ade", "Azarel", "Mahardika", "Manggala",
    "Meidiyana", "Artanti", "Afifan", "Akmalin", "Herfina", "Yusnita", "Subianto", "Dzaki", "Syakira",
    "Lahadalia", "Praisylia"
]

PROVINCE_CITY_DATA = [
    ("Jawa Tengah", "Surakarta", "Laweyan", ["Pajang", "Sondakan", "Kerten"], "57146", -7.5666, 110.7890, 0.20),
    ("Jawa Tengah", "Surakarta", "Banjarsari", ["Nusukan", "Kadipiro", "Gilingan"], "57135", -7.5487, 110.8214, 0.15),
    ("Jawa Tengah", "Sukoharjo", "Kartasura", ["Pabelan", "Gonilan", "Ngadirejo"], "57169", -7.5571, 110.7712, 0.16),
    ("Jawa Tengah", "Sukoharjo", "Grogol", ["Madegondo", "Langenharjo", "Telukan"], "57552", -7.6019, 110.8156, 0.10),
    ("Jawa Tengah", "Boyolali", "Boyolali", ["Pulisen", "Banaran", "Siswodipuran"], "57316", -7.5331, 110.5957, 0.06),
    ("Jawa Tengah", "Karanganyar", "Colomadu", ["Malangjiwan", "Gajahan", "Bolon"], "57177", -7.5335, 110.7566, 0.07),
    ("Jawa Tengah", "Klaten", "Klaten Tengah", ["Bareng", "Tonggalan", "Mojayan"], "57414", -7.7050, 110.6060, 0.05),
    ("DI Yogyakarta", "Sleman", "Depok", ["Caturtunggal", "Maguwoharjo", "Condongcatur"], "55281", -7.7765, 110.3842, 0.07),
    ("Jawa Timur", "Madiun", "Taman", ["Mojorejo", "Banjarejo", "Kejuron"], "63139", -7.6420, 111.5231, 0.03),
    ("Jawa Barat", "Bandung", "Coblong", ["Dago", "Lebakgede", "Sekeloa"], "40135", -6.8885, 107.6139, 0.04),
    ("DKI Jakarta", "Jakarta Selatan", "Kebayoran Baru", ["Senayan", "Melawai", "Gandaria Utara"], "12190", -6.2297, 106.8018, 0.04),
    ("Jawa Timur", "Surabaya", "Wonokromo", ["Darmo", "Jagir", "Sawunggaling"], "60241", -7.2872, 112.7394, 0.03),
]
STREETS = [
    "Jl. Melati", "Jl. Kenanga", "Jl. Slamet Riyadi", "Jl. Adi Sucipto", "Jl. Veteran", "Jl. Merpati",
    "Jl. Mawar", "Jl. Cendana", "Jl. Diponegoro", "Jl. Kartini", "Jl. Ahmad Yani", "Jl. Dr. Rajiman",
    "Jl. Pemuda", "Jl. Gatot Subroto", "Jl. Ki Hajar Dewantara", "Jl. Sawo", "Jl. Wijaya Kusuma", "Jl. Adi Sumarmo"
]

# -----------------------------------------------------------------------------
# Additional realism pack v2.1.
# These are additive vocabularies; the original lists remain in use.
# -----------------------------------------------------------------------------
FIRST_NAMES.extend([
    "Aisyah", "Zahra", "Khairunnisa", "Rizal", "Yoga", "Rama", "Taufik", "Sofyan", "Irfan", "Hafizh",
    "Gilang", "Yuni", "Eka", "Ratna", "Sri", "Retno", "Nurul", "Ayu", "Febri", "Rizqi",
    "Salma", "Tania", "Naufal", "Naufan", "Rendra", "Adit", "Lukman", "Sulastri", "Suhartini",
    "Joko", "Sriyono", "Titin", "Endang", "Dewanto", "Mardiyah", "Rois", "Halimah", "Latifah",
    "Khusnul", "Mujiono", "Slamet", "Suyatno", "Darsih", "Yuliana", "Krisna", "Wulan", "Devi",
    "Rengga", "Puspita", "Gita", "Nuraini", "Novi", "Mursid", "Syifa", "Rohman", "Anisa"
])
LAST_NAMES.extend([
    "Pangestu", "Nugraha", "Kusuma", "Cahyono", "Wicaksono", "Sulistyo", "Hermawan", "Fadhilah",
    "Ramdani", "Syahputra", "Fauziah", "Maryati", "Rohmah", "Azzahra", "Mutmainah", "Herlambang",
    "Gunawan", "Hakim", "Ramadhani", "Wulandari", "Susanti", "Widodo", "Sutrisno", "Pratiwi",
    "Anggraini", "Kusumawati", "Setyowati", "Prabawa", "Maharani", "Anjani", "Pawestri",
    "Rachman", "Haryanto", "Prakoso", "Kusnadi", "Wijayanti", "Nuraini", "Asih", "Rahman"
])

PROVINCE_CITY_DATA.extend([
    ("Jawa Tengah", "Semarang", "Tembalang", ["Tembalang", "Sendangmulyo", "Kedungmundu"], "50275", -7.0560, 110.4381, 0.04),
    ("Jawa Tengah", "Semarang", "Banyumanik", ["Srondol Wetan", "Padangsari", "Ngesrep"], "50263", -7.0686, 110.4158, 0.03),
    ("Jawa Tengah", "Magelang", "Magelang Tengah", ["Kemirirejo", "Cacaban", "Gelangan"], "56122", -7.4706, 110.2177, 0.025),
    ("Jawa Tengah", "Salatiga", "Sidorejo", ["Salatiga", "Bugel", "Kauman Kidul"], "50714", -7.3305, 110.5084, 0.025),
    ("Jawa Tengah", "Banyumas", "Purwokerto Timur", ["Sokanegara", "Arcawinangun", "Kranji"], "53116", -7.4243, 109.2396, 0.025),
    ("Jawa Tengah", "Pekalongan", "Pekalongan Barat", ["Medono", "Tirto", "Pringrejo"], "51116", -6.8886, 109.6644, 0.02),
    ("DI Yogyakarta", "Yogyakarta", "Umbulharjo", ["Warungboto", "Pandeyan", "Tahunan"], "55164", -7.8159, 110.3880, 0.03),
    ("DI Yogyakarta", "Bantul", "Banguntapan", ["Banguntapan", "Potorono", "Jambidan"], "55198", -7.8267, 110.4250, 0.025),
    ("Jawa Barat", "Bogor", "Tanah Sareal", ["Kedungbadak", "Kebon Pedes", "Kayumanis"], "16161", -6.5649, 106.7951, 0.02),
    ("Jawa Barat", "Bekasi", "Bekasi Selatan", ["Kayuringin Jaya", "Pekayon Jaya", "Marga Jaya"], "17148", -6.2383, 106.9924, 0.02),
    ("Jawa Timur", "Malang", "Lowokwaru", ["Tulusrejo", "Dinoyo", "Mojolangu"], "65141", -7.9410, 112.6204, 0.025),
    ("Jawa Timur", "Sidoarjo", "Waru", ["Pepelegi", "Tropodo", "Wadungasri"], "61256", -7.3524, 112.7531, 0.02),
    ("Bali", "Denpasar", "Denpasar Selatan", ["Sanur", "Renon", "Sesetan"], "80227", -8.6890, 115.2268, 0.015),
    ("Sumatera Selatan", "Palembang", "Ilir Timur II", ["2 Ilir", "Duku", "Lawang Kidul"], "30118", -2.9761, 104.7754, 0.015),
    ("Sumatera Utara", "Medan", "Medan Kota", ["Teladan Barat", "Pusat Pasar", "Siti Rejo"], "20216", 3.5753, 98.6751, 0.015),
    ("Sulawesi Selatan", "Makassar", "Panakkukang", ["Masale", "Pandang", "Karuwisi"], "90231", -5.1576, 119.4384, 0.015),
])

STREETS.extend([
    "Jl. Mangga", "Jl. Nangka", "Jl. Anggrek", "Jl. Flamboyan", "Jl. Cemara", "Jl. Jambu",
    "Jl. Pahlawan", "Jl. M.H. Thamrin", "Jl. Jenderal Sudirman", "Jl. S. Parman", "Jl. Imam Bonjol",
    "Jl. Letjen Suprapto", "Jl. Tentara Pelajar", "Jl. Ir. Soekarno", "Jl. KH Ahmad Dahlan",
    "Jl. KH Hasyim Asy'ari", "Jl. Perintis Kemerdekaan", "Jl. Kapten Mulyadi", "Jl. Brigjen Katamso",
    "Jl. Kyai Mojo", "Jl. Sultan Agung", "Jl. Pangeran Diponegoro", "Jl. Raden Saleh",
    "Jl. Industri Kecil", "Jl. Pasar Kliwon", "Jl. Raya Solo-Jogja", "Jl. Raya Kartasura",
    "Jl. Lingkar Utara", "Jl. Tanjung", "Jl. Pandanaran", "Jl. Setiabudi", "Jl. Kaliurang",
])

ADDRESS_PATTERNS = [
    "{street} No. {number} RT {rt}/RW {rw}",
    "{street} Gang {gang} No. {number}",
    "{street} Kav. {number} Blok {block}",
    "{street} KM {km}, RT {rt}/RW {rw}",
    "Kompleks Ruko {ruko} Blok {block} No. {number}",
    "Pasar {market} Los {block}-{number}",
    "Sentra UMKM {market}, Kios {block}{number}",
]
GANG_NAMES = ["Melati", "Mawar", "Kenanga", "Sawo", "Cempaka", "Anggrek", "Srikandi", "Werkudara", "Arjuna", "Pandan"]
RUKO_NAMES = ["Mutiara", "Sumber Rejeki", "Niaga Kartasura", "Solo Baru", "Cemara", "Griya Usaha", "Pasar Modern"]
MARKET_NAMES = ["Kartasura", "Gede", "Klewer", "Nusukan", "Grogol", "Colomadu", "Tembalang", "Beringharjo", "Pucangsawit"]

EMAIL_DOMAINS_UMKM = ["gmail.com", "yahoo.co.id", "outlook.com", "mail.com", "bisnis.id", "umkm.id", "icloud.com"]
EMAIL_DOMAINS_MITRA = ["mitra.id", "corp.id", "co.id", "or.id", "ac.id", "go.id", "gmail.com"]
BUSINESS_EMAIL_PREFIXES = ["kontak", "admin", "halo", "info", "order", "cs", "sales", "usaha", "kemitraan"]

OPERATIONAL_HOURS = [
    "Senin-Jumat 08.00-16.00", "Senin-Sabtu 08.00-17.00", "Setiap hari 08.00-21.00",
    "Selasa-Minggu 09.00-20.00", "Senin-Jumat 09.00-17.00; Sabtu 09.00-13.00",
    "Setiap hari 10.00-22.00", "Senin-Sabtu 07.30-16.30", "By appointment melalui WhatsApp",
    "Produksi 08.00-15.00; pemesanan online 24 jam", "Toko 09.00-18.00; online 24 jam"
]
MARKETPLACE_CHANNELS = [
    "WhatsApp Business", "Instagram", "Facebook Marketplace", "Shopee", "Tokopedia", "TikTok Shop",
    "Instagram;WhatsApp Business", "Shopee;Tokopedia", "Instagram;Shopee;TikTok Shop",
    "Website katalog;WhatsApp Business", "Google Business Profile;Instagram", "Belum aktif online",
    "GrabFood;GoFood", "ShopeeFood;WhatsApp Business", "Tokopedia;Website katalog"
]

BUSINESS_DESCRIPTION_TEMPLATES = [
    "{name} bergerak di bidang {label} dengan produk utama {main}. Usaha ini fokus pada kualitas produksi, pelayanan pelanggan, dan penguatan pemasaran digital.",
    "{name} merupakan UMKM {label} yang mengembangkan {main}. Kegiatan usaha diarahkan pada peningkatan kapasitas produksi, kemasan, dan penjualan online.",
    "{name} memproduksi dan memasarkan {main} untuk pelanggan lokal serta kanal digital. Pengembangan usaha difokuskan pada legalitas, branding, dan konsistensi kualitas.",
    "{name} menjalankan usaha {label} berbasis pesanan dan penjualan rutin. Produk unggulan {main} dikembangkan agar lebih siap masuk marketplace dan kemitraan.",
    "{name} adalah usaha keluarga di sektor {label}. Produk utama {main} dipasarkan melalui jaringan pelanggan lokal, reseller, dan kanal promosi digital.",
]
PARTNERSHIP_MESSAGE_TEMPLATES = [
    "{opener} mengajukan kerja sama berfokus pada {need} untuk memperluas pasar {product} dan memperkuat kapasitas usaha.",
    "{opener} membutuhkan dukungan {need} agar produk {product} lebih siap masuk kanal distribusi dan promosi digital.",
    "{opener} menawarkan kolaborasi pengembangan {product} melalui program {need}, dengan target peningkatan penjualan dan kualitas layanan.",
    "{opener} ingin menjajaki kemitraan pada aspek {need} untuk mendukung pengembangan usaha, dokumentasi legalitas, dan akses pasar.",
]
DOCUMENT_CAPTIONS = [
    "Dokumen pendukung kegiatan UMKM Tumbuh",
    "Lampiran administrasi untuk proses verifikasi",
    "Bukti pendukung aktivitas program",
    "File unggahan untuk kebutuhan validasi data",
    "Dokumen pelengkap profil dan proses layanan",
]
ASSIGNMENT_INSTRUCTION_VARIANTS = [
    "Unggah file hasil proyek dalam format PDF/DOCX/XLSX/PPTX. File harus memuat identitas UMKM, kondisi awal, langkah pengerjaan, hasil akhir, dan bukti pendukung.",
    "Kumpulkan satu file utama berisi laporan praktik, dokumentasi foto/screenshot, dan refleksi singkat hasil implementasi pada usaha masing-masing.",
    "Upload dokumen proyek yang menjelaskan masalah usaha, solusi yang diterapkan, output akhir, dan tautan/foto pendukung bila tersedia.",
    "Peserta wajib mengunggah file proyek final. Lampirkan data usaha seperlunya, contoh implementasi, dan rencana tindak lanjut setelah pelatihan.",
]
TRAINING_DESC_TEMPLATES = [
    "Program gratis untuk membantu UMKM menyusun proyek nyata terkait {title}. Peserta mengunggah tugas berbasis file seperti laporan, template, presentasi, atau dokumen praktik.",
    "Kelas gratis berbasis praktik untuk memperkuat kemampuan UMKM dalam {title}. Setiap peserta diarahkan membuat output yang langsung dapat dipakai pada usahanya.",
    "Pelatihan gratis dengan pendekatan studi kasus dan proyek. Materi {title} disusun agar peserta dapat menghasilkan dokumen kerja, portofolio, atau rencana implementasi.",
    "Program pendampingan singkat untuk UMKM yang ingin menerapkan {title} secara praktis melalui modul bertahap dan unggahan tugas proyek.",
]
TRAINING_REQUIREMENT_VARIANTS = [
    "Peserta merupakan UMKM terdaftar, mengikuti modul sesuai urutan, dan mengunggah tugas proyek dalam format PDF/DOCX/XLSX/PPTX sesuai instruksi.",
    "Peserta wajib memiliki akun aktif, menyelesaikan modul inti, dan mengirimkan file proyek sesuai batas waktu yang ditentukan.",
    "Peserta disarankan menyiapkan data usaha sederhana, foto produk, dan dokumen pendukung agar output pelatihan lebih aplikatif.",
    "Sertifikat diterbitkan setelah peserta menyelesaikan modul dan tugas file-upload yang telah direview.",
]

BUSINESS_PREFIX = ["Warung", "Kedai", "Dapur", "Rumah Produksi", "Sentra", "Galeri", "Studio", "Bengkel", "Toko", "Koperasi", "Sanggar", "Kios", "Workshop", "Pawon", "Karya", "Rumah Kemasan", "Depot", "Lapak"]
BUSINESS_CORE = ["Berkah", "Makmur", "Sejahtera", "Maju Jaya", "Sinar Baru", "Mandiri", "Rasa Nusantara", "Kriya Indah", "Kopi Kartasura", "Snack Ceria", "Batik Lestari", "Tani Muda", "Digital Kreatif", "Herbal Alami", "Roti Hangat", "Catering Barokah", "Rajut Cantik", "Oleh-Oleh Solo", "Tempe Murni", "Kue Tradisi", "Rempah Nusantara", "Susu Segar", "Eco Craft", "Karya Ibu", "Pasar Rakyat", "Bumi Pangan"]

CATEGORY_PROFILES = {
    "KULINER": {
        "kategori_usaha_id": "KATU01", "jenis_umkm_id": "KULINER", "produk_label": "kuliner",
        "products": ["Keripik Singkong", "Sambal Bawang", "Abon Sapi", "Kue Kering", "Frozen Food", "Bakpia Mini", "Bumbu Pecel", "Krupuk Ikan", "Aneka Donat", "Roti Pisang", "Snack Mix", "Nasi Box", "Pempek Frozen", "Dimsum Ayam", "Brownies Kukus"],
        "price_range": (8_000, 150_000), "legalitas": ["PIRT", "Halal", "NIB", "BPOM proses", "Komposisi produk tercantum"],
        "common_trainings": ["JP02", "JP03", "JP05", "JP06", "JP07", "JP09"],
        "support_needs": ["Sertifikasi Produk", "Desain Kemasan", "Akses Marketplace", "Distribusi", "Promosi Digital"]
    },
    "FASHION": {
        "kategori_usaha_id": "KATU02", "jenis_umkm_id": "FASHION", "produk_label": "fashion",
        "products": ["Batik Tulis", "Kemeja Batik", "Hijab Motif", "Tas Rajut", "Kaos Sablon", "Kain Tenun", "Sepatu Kulit", "Dompet Kulit", "Outer Tenun", "Mukena Travel", "Dress Casual"],
        "price_range": (35_000, 450_000), "legalitas": ["NIB", "Merek dagang proses", "Label ukuran", "Foto katalog"],
        "common_trainings": ["JP02", "JP03", "JP07", "JP09", "JP12"],
        "support_needs": ["Pemasaran", "Digitalisasi", "Akses Marketplace", "Desain Kemasan", "Akses Pameran"]
    },
    "KRIYA": {
        "kategori_usaha_id": "KATU03", "jenis_umkm_id": "KRIYA", "produk_label": "kriya",
        "products": ["Kerajinan Kayu", "Hampers UMKM", "Anyaman Bambu", "Souvenir Pernikahan", "Dekorasi Rumah", "Miniatur Wayang", "Produk Rajut", "Lilin Aromaterapi", "Gantungan Kunci", "Frame Foto Kayu"],
        "price_range": (12_000, 650_000), "legalitas": ["NIB", "Katalog produk", "Merek dagang proses", "Manual perawatan"],
        "common_trainings": ["JP02", "JP03", "JP07", "JP09", "JP12"],
        "support_needs": ["Akses Pameran", "Desain Kemasan", "Ekspor", "Promosi Digital", "Distribusi"]
    },
    "AGRIBISNIS": {
        "kategori_usaha_id": "KATU04", "jenis_umkm_id": "AGRIBISNIS", "produk_label": "agribisnis",
        "products": ["Beras Organik", "Madu Hutan", "Kopi Robusta", "Gula Aren", "Sayur Hidroponik", "Pupuk Organik", "Bibit Cabai", "Telur Asin", "Jamur Tiram", "Teh Herbal"],
        "price_range": (10_000, 250_000), "legalitas": ["NIB", "Sertifikat organik proses", "Halal", "Label panen"],
        "common_trainings": ["JP01", "JP02", "JP05", "JP06", "JP08", "JP11"],
        "support_needs": ["Permodalan", "Distribusi", "Sertifikasi Produk", "Ekspor", "Pendampingan Bisnis"]
    },
    "JASA": {
        "kategori_usaha_id": "KATU05", "jenis_umkm_id": "JASA", "produk_label": "jasa",
        "products": ["Paket Foto Produk", "Jasa Desain Logo", "Laundry Kiloan", "Servis Elektronik", "Konsultasi Pembukuan", "Kursus Privat", "Jasa Cleaning", "Jasa Reparasi Tas", "Paket Catering Event"],
        "price_range": (25_000, 1_200_000), "legalitas": ["NIB", "Portofolio layanan", "Invoice standar", "SOP layanan"],
        "common_trainings": ["JP01", "JP02", "JP06", "JP10", "JP12"],
        "support_needs": ["Digitalisasi", "Pemasaran", "Pendampingan Bisnis", "Promosi Digital", "Akses Marketplace"]
    },
    "KECANTIKAN": {
        "kategori_usaha_id": "KATU06", "jenis_umkm_id": "KECANTIKAN", "produk_label": "kecantikan",
        "products": ["Sabun Herbal", "Lulur Tradisional", "Minyak Rambut", "Body Scrub", "Masker Wajah", "Serum Herbal", "Aromaterapi", "Lip Balm Natural"],
        "price_range": (15_000, 180_000), "legalitas": ["NIB", "BPOM proses", "Halal", "Komposisi produk tercantum"],
        "common_trainings": ["JP02", "JP03", "JP04", "JP05", "JP09"],
        "support_needs": ["Sertifikasi Produk", "Legalitas Usaha", "Desain Kemasan", "Promosi Digital", "Akses Marketplace"]
    },
    "DIGITAL": {
        "kategori_usaha_id": "KATU08", "jenis_umkm_id": "DIGITAL", "produk_label": "digital",
        "products": ["Template Konten", "Jasa Kelola Instagram", "Landing Page UMKM", "Desain Feed", "Aplikasi Kasir Sederhana", "Paket Foto Katalog", "Video Promosi", "Desain Marketplace"],
        "price_range": (50_000, 2_500_000), "legalitas": ["NIB", "Portofolio digital", "Kontrak layanan", "Invoice standar"],
        "common_trainings": ["JP02", "JP03", "JP07", "JP10", "JP12"],
        "support_needs": ["Digitalisasi", "Pemasaran", "Riset Produk", "Promosi Digital", "Marketplace"]
    },
    "PERDAGANGAN": {
        "kategori_usaha_id": "KATU11", "jenis_umkm_id": "PERDAGANGAN", "produk_label": "ritel",
        "products": ["Paket Sembako", "Aneka ATK", "Peralatan Dapur", "Produk Reseller", "Minuman Kemasan", "Paket Hampers", "Perlengkapan Rumah", "Aksesori HP"],
        "price_range": (5_000, 750_000), "legalitas": ["NIB", "NPWP", "Katalog produk", "Invoice standar"],
        "common_trainings": ["JP01", "JP02", "JP06", "JP07", "JP11"],
        "support_needs": ["Permodalan", "Distribusi", "Akses Marketplace", "Pendampingan Bisnis", "Pemasaran"]
    },
}
# Additive product/support/legalitas variants for category-aware realism.
CATEGORY_PROFILES["KULINER"]["products"].extend(["Rengginang Gurih", "Kacang Bawang", "Serundeng Kelapa", "Peyek Kacang", "Sirup Jahe", "Wedang Uwuh", "Kopi Susu Botol", "Lumpia Frozen", "Pastel Frozen"])
CATEGORY_PROFILES["FASHION"]["products"].extend(["Blouse Batik", "Kemeja Linen", "Scarf Motif", "Totebag Kanvas", "Seragam Komunitas", "Pouch Batik", "Sandal Kulit"])
CATEGORY_PROFILES["KRIYA"]["products"].extend(["Tempat Tisu Kayu", "Kotak Hampers", "Vas Anyaman", "Macrame Wall Hanging", "Tas Ecoprint", "Hiasan Meja Resin"])
CATEGORY_PROFILES["AGRIBISNIS"]["products"].extend(["Keripik Pisang", "Sari Lemon", "Susu Kambing Bubuk", "Sambal Cabai Kering", "Minyak Kelapa", "Jahe Merah Instan"])
CATEGORY_PROFILES["JASA"]["products"].extend(["Paket Dokumentasi Produk", "Jasa Admin Marketplace", "Servis AC Rumahan", "Jasa Jahit Permak", "Konsultasi UMKM", "Desain Label Produk"])
CATEGORY_PROFILES["KECANTIKAN"]["products"].extend(["Hair Tonic Herbal", "Face Mist Mawar", "Balm Aromaterapi", "Krim Tangan Natural", "Shampoo Herbal"])
CATEGORY_PROFILES["DIGITAL"]["products"].extend(["Template Invoice Digital", "Jasa Optimasi Google Business", "Paket Reels Produk", "Desain Banner Online", "Katalog Interaktif"])
CATEGORY_PROFILES["PERDAGANGAN"]["products"].extend(["Paket Snack Kantor", "Perlengkapan Warung", "Paket Alat Kebersihan", "Produk Konsinyasi Lokal", "Bundling Produk Rumah Tangga"])
for _cat, _prof in CATEGORY_PROFILES.items():
    _prof["legalitas"] = list(dict.fromkeys(_prof["legalitas"] + ["NIB terdaftar", "Foto produk tersedia", "Data usaha lengkap"]))
    _prof["support_needs"] = list(dict.fromkeys(_prof["support_needs"] + ["Kurasi Produk", "Pendampingan Konten", "Penguatan Branding"]))

CATEGORY_KEYS = list(CATEGORY_PROFILES.keys())
CATEGORY_WEIGHTS = [0.28, 0.13, 0.11, 0.10, 0.12, 0.07, 0.09, 0.10]

MITRA_TYPE_PROFILES = {
    "JM01": {"name": "Pemerintah Daerah", "prefixes": ["Dinas", "UPT", "Badan"], "fields": ["Legalitas Usaha", "Pelatihan", "Sertifikasi Produk", "Pendampingan Bisnis"], "supports": ["Fasilitasi Sertifikasi", "Kelas Pelatihan", "Konsultasi Legal", "Kurasi Produk"]},
    "JM02": {"name": "BUMN", "prefixes": ["PT", "Rumah BUMN"], "fields": ["Permodalan", "Pemasaran", "Pelatihan", "Distribusi"], "supports": ["Dana Hibah", "Mentoring", "Akses Pameran", "Promosi Digital"]},
    "JM03": {"name": "Perusahaan Swasta", "prefixes": ["PT", "CV"], "fields": ["Distribusi", "Pemasaran", "Digitalisasi", "Desain Kemasan"], "supports": ["Kemitraan Penjualan", "Promosi Digital", "Bantuan Alat", "Akses Gudang"]},
    "JM04": {"name": "Perguruan Tinggi", "prefixes": ["Universitas", "Institut", "Politeknik"], "fields": ["Riset Produk", "Pelatihan", "Digitalisasi", "Pendampingan Bisnis"], "supports": ["Mentoring", "Kelas Pelatihan", "Kurasi Produk", "Konsultasi Legal"]},
    "JM05": {"name": "Komunitas Bisnis", "prefixes": ["Komunitas", "Asosiasi"], "fields": ["Pemasaran", "Pelatihan", "Akses Marketplace", "Pendampingan Bisnis"], "supports": ["Mentoring", "Akses Pameran", "Promosi Digital", "Kemitraan Penjualan"]},
    "JM06": {"name": "Lembaga Keuangan", "prefixes": ["Bank", "BPR", "Koperasi"], "fields": ["Permodalan", "Pendampingan Bisnis", "Legalitas Usaha"], "supports": ["Pinjaman Lunak", "Konsultasi Legal", "Mentoring"]},
    "JM07": {"name": "Marketplace", "prefixes": ["Marketplace", "PT"], "fields": ["Akses Marketplace", "Pemasaran", "Digitalisasi", "Promosi Digital"], "supports": ["Akses Marketplace", "Promosi Digital", "Kurasi Produk", "Kemitraan Penjualan"]},
    "JM08": {"name": "Logistik", "prefixes": ["PT", "CV", "Layanan"], "fields": ["Distribusi", "Ekspor", "Logistik"], "supports": ["Akses Gudang", "Kemitraan Penjualan", "Konsultasi Ekspor"]},
    "JM09": {"name": "Inkubator Bisnis", "prefixes": ["Inkubator", "Lembaga", "Akselerator"], "fields": ["Pendampingan Bisnis", "Digitalisasi", "Riset Produk", "Pemasaran"], "supports": ["Mentoring", "Kelas Pelatihan", "Kurasi Produk", "Promosi Digital"]},
    "JM10": {"name": "Media Promosi", "prefixes": ["Media", "Studio", "Agensi"], "fields": ["Promosi Digital", "Pemasaran", "Digitalisasi"], "supports": ["Promosi Digital", "Kurasi Produk", "Kemitraan Penjualan"]},
    "JM11": {"name": "Koperasi", "prefixes": ["Koperasi"], "fields": ["Permodalan", "Pemasaran", "Distribusi"], "supports": ["Pinjaman Lunak", "Akses Pameran", "Kemitraan Penjualan"]},
    "JM12": {"name": "Lembaga Pelatihan", "prefixes": ["Balai", "Lembaga", "Pusat"], "fields": ["Pelatihan", "Pembukuan", "Digitalisasi", "Legalitas Usaha"], "supports": ["Kelas Pelatihan", "Mentoring", "Konsultasi Legal"]},
}
MITRA_TYPE_IDS = list(MITRA_TYPE_PROFILES.keys())
MITRA_TYPE_WEIGHTS = [0.12, 0.08, 0.13, 0.10, 0.09, 0.12, 0.10, 0.06, 0.08, 0.05, 0.04, 0.03]
MITRA_CORES = ["Sinergi Nusantara", "Mandiri Sejahtera", "Sahabat UMKM", "Akselerasi Digital", "Kreasi Muda", "Bina Usaha", "Ekspor Mandiri", "Keuangan Rakyat", "Pasar Online Indonesia", "Logistik Prima", "Riset dan Inovasi", "Pelatihan Wirausaha", "Pangan Berdaya", "Kemasan Kreatif", "Karya Bersama", "Pasar Rakyat", "Tumbuh Bersama", "Digital Niaga"]

MITRA_CORES.extend([
    "UMKM Naik Kelas", "Klinik Bisnis Rakyat", "Gerai Kurasi Produk", "Sentra Pendampingan",
    "Nusantara Berdaya", "Kampus Wirausaha", "Akses Modal Mandiri", "Kemitraan Lokal",
    "Pusat Ekspor Pemula", "Akselerator Pasar Digital", "Rumah Kemasan", "Sahabat Produk Lokal",
    "Kolaborasi Karya", "Konsultan Legal UMKM", "Logistik Rakyat", "Sentra Pameran"
])
for _mid, _prof in MITRA_TYPE_PROFILES.items():
    _prof["supports"] = list(dict.fromkeys(_prof["supports"] + ["Klinik Konsultasi", "Kurasi Produk", "Pendampingan Konten"]))

TRAINING_TOPICS = [
    ("JP01", "Pembukuan Praktis untuk UMKM", ["Dasar arus kas", "Pencatatan transaksi harian", "Laporan laba rugi sederhana", "Evaluasi margin usaha"], ["Template pembukuan sederhana", "Analisis laba rugi satu bulan"]),
    ("JP02", "Strategi Pemasaran Digital", ["Segmentasi pelanggan", "Konten Instagram dan TikTok", "Kalender promosi", "Evaluasi metrik kampanye"], ["Rencana konten 14 hari", "Laporan evaluasi kampanye digital"]),
    ("JP03", "Foto Produk dan Katalog Online", ["Pencahayaan dasar", "Angle foto produk", "Editing ringan", "Katalog marketplace"], ["Portofolio foto produk", "Katalog digital siap unggah"]),
    ("JP04", "Legalitas dan Dokumen Usaha", ["NIB dan OSS", "NPWP usaha", "Merek dagang", "Dokumen administrasi"], ["Checklist legalitas usaha", "Draft dokumen administrasi"]),
    ("JP05", "Persiapan Sertifikasi Halal", ["Kebijakan halal", "Alur produksi", "Bahan dan pemasok", "Dokumen SJPH"], ["Dokumen bahan dan pemasok", "Draft manual halal sederhana"]),
    ("JP06", "Pembukuan dan Harga Pokok Produksi", ["Biaya bahan baku", "Biaya tenaga kerja", "Overhead", "Penentuan harga jual"], ["Perhitungan HPP produk utama", "Simulasi harga jual dan margin"]),
    ("JP07", "Optimasi Marketplace", ["Judul produk", "Deskripsi SEO", "Voucher dan promosi", "Manajemen rating"], ["Audit toko marketplace", "Rencana optimasi listing produk"]),
    ("JP08", "Ekspor Pemula untuk Produk Lokal", ["Kurasi produk ekspor", "Dokumen ekspor", "Kemasan pengiriman", "Riset negara tujuan"], ["Pitch deck produk ekspor", "Rencana ekspor pemula"]),
    ("JP09", "Desain Kemasan dan Branding", ["Identitas merek", "Label produk", "Informasi kemasan", "Mockup kemasan"], ["Mockup desain kemasan", "Brand guideline sederhana"]),
    ("JP10", "Customer Service dan Retensi Pelanggan", ["SOP respon pelanggan", "Komplain pelanggan", "Database pelanggan", "Program loyalitas"], ["SOP customer service", "Simulasi penanganan komplain"]),
    ("JP11", "Operasional Produksi Efisien", ["SOP produksi", "Kontrol kualitas", "Stok bahan baku", "Pengurangan waste"], ["SOP produksi harian", "Laporan perbaikan proses"]),
    ("JP12", "Branding UMKM dan Pitching", ["Storytelling usaha", "Unique selling point", "Pitch deck", "Simulasi presentasi"], ["Pitch deck UMKM", "Video pendek pitching usaha"]),
]

REFERENCE_TABLES: Dict[str, Tuple[List[str], List[List[str]]]] = {
    "ref_peranpengguna": (["peran_id", "nama_peran"], [["ADMIN", "Admin"], ["UMKM", "Pelaku UMKM"], ["MITRA", "Mitra"]]),
    "ref_jenisumkm": (["jenis_umkm_id", "nama_jenis_umkm"], [[x, x.title().replace("_", " ")] for x in ["KULINER", "FASHION", "KRIYA", "AGRIBISNIS", "JASA", "KECANTIKAN", "OTOMOTIF", "DIGITAL", "EDUKASI", "KESEHATAN", "PERDAGANGAN", "KERAJINAN"]]),
    "ref_skalausaha": (["skala_usaha_id", "nama_skala_usaha"], [["MIKRO", "Mikro"], ["KECIL", "Kecil"], ["MENENGAH", "Menengah"]]),
    "ref_kategoriusaha": (["kategori_usaha_id", "nama_kategori_usaha"], [[f"KATU{i:02d}", n] for i, n in enumerate(["Makanan dan Minuman", "Fashion dan Tekstil", "Kerajinan Tangan", "Pertanian Olahan", "Jasa Kreatif", "Kecantikan dan Perawatan", "Otomotif Ringan", "Produk Digital", "Pendidikan dan Kursus", "Kesehatan Tradisional", "Perdagangan Eceran", "Peralatan Rumah Tangga"], 1)]),
    "ref_kategoriproduk": (["kategori_produk_id", "nama_kategori_produk"], [[f"KATP{i:02d}", n] for i, n in enumerate(["Snack Kemasan", "Minuman Herbal", "Batik dan Tenun", "Aksesori Fashion", "Produk Rajut", "Makanan Beku", "Bumbu Instan", "Kerajinan Kayu", "Kopi dan Teh", "Roti dan Kue", "Produk Kecantikan", "Produk Digital", "Pertanian Organik", "Oleh-Oleh Daerah", "Perlengkapan Rumah", "Kulit dan Sepatu"], 1)]),
    "ref_statusumkm": (["status_umkm_id", "nama_status_umkm"], [["AKTIF", "Aktif"], ["MENUNGGU_VERIFIKASI", "Menunggu Verifikasi"], ["DITOLAK", "Ditolak"], ["NONAKTIF", "Nonaktif"], ["SUSPEND", "Suspend"], ["ARSIP", "Arsip"]]),
    "ref_jenismitra": (["jenis_mitra_id", "nama_jenis_mitra"], [[f"JM{i:02d}", n] for i, n in enumerate(["Pemerintah Daerah", "BUMN", "Perusahaan Swasta", "Perguruan Tinggi", "Komunitas Bisnis", "Lembaga Keuangan", "Marketplace", "Logistik", "Inkubator Bisnis", "Media Promosi", "Koperasi", "Lembaga Pelatihan"], 1)]),
    "ref_statusmitra": (["status_mitra_id", "nama_status_mitra"], [["AKTIF", "Aktif"], ["MENUNGGU_VERIFIKASI", "Menunggu Verifikasi"], ["DITOLAK", "Ditolak"], ["NONAKTIF", "Nonaktif"], ["SUSPEND", "Suspend"], ["ARSIP", "Arsip"]]),
    "ref_bidangkemitraan": (["bidang_kemitraan_id", "nama_bidang_kemitraan"], [[f"BK{i:02d}", n] for i, n in enumerate(["Permodalan", "Pemasaran", "Pelatihan", "Digitalisasi", "Sertifikasi Produk", "Legalitas Usaha", "Distribusi", "Ekspor", "Desain Kemasan", "Pendampingan Bisnis", "Riset Produk", "Akses Marketplace"], 1)]),
    "ref_bentukdukungan": (["bentuk_dukungan_id", "nama_bentuk_dukungan"], [[f"BD{i:02d}", n] for i, n in enumerate(["Dana Hibah", "Pinjaman Lunak", "Mentoring", "Kelas Pelatihan", "Akses Pameran", "Promosi Digital", "Bantuan Alat", "Konsultasi Legal", "Kurasi Produk", "Akses Gudang", "Kemitraan Penjualan", "Fasilitasi Sertifikasi"], 1)]),
    "ref_skalakerjasama": (["skala_kerjasama_id", "nama_skala_kerjasama"], [["LOKAL", "Lokal"], ["KABUPATEN", "Kabupaten/Kota"], ["PROVINSI", "Provinsi"], ["NASIONAL", "Nasional"], ["EKSPOR", "Ekspor"]]),
    "ref_jenispelatihan": (["jenis_pelatihan_id", "nama_jenis_pelatihan"], [[f"JP{i:02d}", n] for i, n in enumerate(["Manajemen Keuangan", "Pemasaran Digital", "Foto Produk", "Legalitas Usaha", "Sertifikasi Halal", "Pembukuan Sederhana", "Marketplace", "Ekspor Pemula", "Desain Kemasan", "Customer Service", "Operasional Produksi", "Branding UMKM"], 1)]),
    "ref_statuspelatihan": (["status_pelatihan_id", "nama_status_pelatihan"], [["DRAFT", "Draft"], ["PUBLISHED", "Dipublikasikan"], ["ONGOING", "Sedang Berjalan"], ["ARCHIVED", "Diarsipkan"], ["CANCELLED", "Dibatalkan"]]),
    "ref_statuspendaftaranpelatihan": (["status_pendaftaran_pelatihan_id", "nama_status_pendaftaran"], [["TERDAFTAR", "Terdaftar"], ["AKTIF", "Aktif Mengikuti"], ["SELESAI", "Selesai"], ["TIDAK_SELESAI", "Tidak Selesai"], ["DIBATALKAN", "Dibatalkan"], ["KADALUARSA", "Kedaluwarsa"]]),
    "ref_statussubmission": (["status_submission_id", "nama_status_submission"], [["BELUM_SUBMIT", "Belum Submit"], ["SUBMITTED", "Submitted"], ["REVIEW", "Dalam Review"], ["REVISI", "Perlu Revisi"], ["DITERIMA", "Diterima"], ["DITOLAK", "Ditolak"]]),
    "ref_statussertifikat": (["status_sertifikat_id", "nama_status_sertifikat"], [["BELUM_TERBIT", "Belum Terbit"], ["DIAJUKAN", "Diajukan"], ["TERBIT", "Terbit"], ["DITOLAK", "Ditolak"], ["DIBATALKAN", "Dibatalkan"]]),
    "ref_statuspengajuan": (["status_pengajuan_id", "nama_status_pengajuan"], [["DIAJUKAN", "Diajukan"], ["DITINJAU", "Ditinjau"], ["DITOLAK", "Ditolak"], ["MENUNGGU_DOKUMEN_TTD", "Menunggu Dokumen Ditandatangani"], ["AKTIF", "Aktif"], ["SELESAI", "Selesai"], ["DIBATALKAN", "Dibatalkan"]]),
    "ref_statusperkembangan": (["status_perkembangan_id", "nama_status_perkembangan"], [["NAIK", "Naik"], ["STABIL", "Stabil"], ["TURUN", "Turun"], ["BARU", "Baru Mulai"], ["EKSPANSI", "Ekspansi"], ["RESTRUKTUR", "Restrukturisasi"], ["PASIF", "Pasif"], ["BERISIKO", "Berisiko"]]),
    "ref_statusverifikasi": (["status_verifikasi_id", "nama_status_verifikasi"], [["MENUNGGU", "Menunggu Review"], ["DISETUJUI", "Disetujui"], ["DITOLAK", "Ditolak"], ["REVISI", "Perlu Revisi"], ["AKTIF", "Aktif"], ["DINONAKTIFKAN", "Dinonaktifkan"]]),
    "ref_statusdokumen": (["status_dokumen_id", "nama_status_dokumen"], [["UPLOADED", "Terunggah"], ["VALID", "Valid"], ["INVALID", "Tidak Valid"], ["EXPIRED", "Kedaluwarsa"], ["REPLACED", "Diganti"], ["DELETED", "Dihapus"]]),
    "ref_jenisdokumen": (["jenis_dokumen_id", "nama_jenis_dokumen", "deskripsi", "allowed_extensions", "max_size_mb", "wajib_umkm", "wajib_mitra", "wajib_pengajuan_kemitraan"], [
        ["KTP", "Kartu Tanda Penduduk", "Identitas pemilik UMKM atau PIC mitra", "pdf,jpg,jpeg,png", "5", "true", "true", "false"],
        ["NIB", "Nomor Induk Berusaha", "Dokumen legalitas usaha", "pdf,jpg,jpeg,png", "5", "true", "true", "false"],
        ["NPWP", "NPWP", "Dokumen wajib pajak", "pdf,jpg,jpeg,png", "5", "false", "true", "false"],
        ["FOTO_PRODUK", "Foto Produk", "Dokumentasi produk UMKM", "jpg,jpeg,png,webp", "3", "false", "false", "false"],
        ["LOGO", "Logo Usaha", "Logo profil usaha atau mitra", "jpg,jpeg,png,webp", "2", "false", "false", "false"],
        ["SERTIFIKAT_HALAL", "Sertifikat Halal", "Legalitas halal produk", "pdf,jpg,jpeg,png", "8", "false", "false", "false"],
        ["PIRT", "Sertifikat PIRT", "Izin produksi pangan rumah tangga", "pdf,jpg,jpeg,png", "8", "false", "false", "false"],
        ["PROPOSAL_KERJASAMA", "Proposal Kerja Sama", "Proposal awal kemitraan", "pdf,doc,docx", "10", "false", "false", "true"],
        ["PERJANJIAN_KERJASAMA", "Perjanjian Kerja Sama", "Dokumen perjanjian bertanda tangan", "pdf", "15", "false", "false", "true"],
        ["TUGAS_PELATIHAN", "Tugas Pelatihan", "File submission assignment", "pdf,doc,docx,xlsx,pptx", "20", "false", "false", "false"],
        ["SERTIFIKAT_PELATIHAN", "Sertifikat Pelatihan", "Sertifikat digital peserta", "pdf", "10", "false", "false", "false"],
        ["DOKUMEN_PENDUKUNG", "Dokumen Pendukung", "Lampiran tambahan", "pdf,jpg,jpeg,png,doc,docx", "10", "false", "false", "false"],
    ]),
}

TABLE_HEADERS: Dict[str, List[str]] = {
    "ref_dimwaktu": ["tanggal", "hari", "minggu_ke", "minggu_bulan", "tanggal_awal_minggu", "tanggal_akhir_minggu", "bulan", "nama_bulan", "kuartal", "tahun", "is_weekend"],
    "master_akunpengguna": ["akun_id", "peran_id", "nama_lengkap", "email", "no_hp", "password_hash", "status_aktif", "email_verified_at", "last_login_at", "created_at", "updated_at"],
    "master_lokasi": ["lokasi_id", "provinsi", "kabupaten_kota", "kecamatan", "kelurahan", "kode_pos", "alamat_detail", "latitude", "longitude", "created_at", "updated_at"],
    "master_pelakuumkm": ["pelaku_umkm_id", "akun_id", "nama_pelaku", "nik", "no_hp", "email", "alamat", "status_aktif", "is_deleted", "deleted_at", "archived_at", "created_at", "updated_at"],
    "master_umkm": ["umkm_id", "kode_umkm", "pelaku_umkm_id", "diverifikasi_oleh_admin_id", "lokasi_id", "jenis_umkm_id", "skala_usaha_id", "kategori_usaha_id", "status_umkm_id", "nama_umkm", "nib", "deskripsi_usaha", "produk_utama", "tahun_berdiri", "nomor_whatsapp", "email_bisnis", "jam_operasional", "media_sosial_marketplace", "logo_url", "foto_cover_url", "status_verified", "tanggal_terdaftar", "is_deleted", "deleted_at", "archived_at", "created_at", "updated_at"],
    "master_produkumkm": ["produk_id", "umkm_id", "kategori_produk_id", "nama_produk", "deskripsi_produk", "harga", "stok_saat_ini", "status_produk", "legalitas_produk", "is_deleted", "deleted_at", "archived_at", "created_at", "updated_at"],
    "master_mitra": ["mitra_id", "kode_mitra", "akun_id", "diverifikasi_oleh_admin_id", "lokasi_id", "jenis_mitra_id", "status_mitra_id", "skala_kerjasama_id", "nama_mitra", "nama_badan_hukum", "nib", "npwp", "nama_pic", "jabatan_pic", "kontak_pic", "email_pic", "alamat_mitra", "wilayah_operasional", "deskripsi_dukungan", "logo_url", "foto_cover_url", "status_verified", "is_deleted", "deleted_at", "archived_at", "created_at", "updated_at"],
    "master_mitrabidangkemitraan": ["mitra_id", "bidang_kemitraan_id", "created_at"],
    "master_mitrabentukdukungan": ["mitra_id", "bentuk_dukungan_id", "created_at"],
    "master_programpelatihan": ["pelatihan_id", "kode_pelatihan", "dibuat_oleh_admin_id", "jenis_pelatihan_id", "status_pelatihan_id", "judul_pelatihan", "deskripsi_pelatihan", "mentor_nama", "durasi_jam", "total_modul", "harga", "akses_seumur_hidup", "masa_akses_hari", "rating_rata_rata", "jumlah_alumni", "thumbnail_url", "syarat_ketentuan", "tanggal_publish", "is_deleted", "deleted_at", "archived_at", "created_at", "updated_at"],
    "master_modulpelatihan": ["modul_id", "pelatihan_id", "urutan_modul", "judul_modul", "deskripsi_modul", "durasi_menit", "materi_url", "is_preview", "status_aktif", "created_at"],
    "master_assignmentpelatihan": ["assignment_id", "pelatihan_id", "judul_assignment", "deskripsi_assignment", "instruksi_submission", "due_days_after_enroll", "status_aktif", "created_at"],
    "master_admin": ["admin_id", "akun_id", "kode_admin", "is_active", "created_at", "updated_at"],
    "transaksi_dokumenterunggah": ["dokumen_id", "jenis_dokumen_id", "status_dokumen_id", "uploader_akun_id", "owner_type", "owner_id", "context_type", "context_id", "original_file_name", "stored_file_name", "file_extension", "mime_type", "file_size_bytes", "bucket_name", "object_key", "storage_path", "public_url", "checksum_sha256", "version_id", "is_public", "display_order", "caption", "uploaded_at", "verified_at", "expired_at", "metadata_json"],
    "transaksi_registrasipengguna": ["akun_id", "umkm_id", "diverifikasi_oleh_admin_id", "mitra_id", "status_verifikasi_id", "kode_registrasi", "tanggal_submit", "tanggal_review", "tanggal_aktivasi", "catatan_validasi", "checklist_informasi_lengkap", "created_at"],
    "transaksi_pendaftaranpelatihan": ["pendaftaran_pelatihan_id", "umkm_id", "pelatihan_id", "status_pendaftaran_pelatihan_id", "tanggal_daftar", "akses_mulai_at", "akses_berakhir_at", "terakhir_diakses_at", "progress_persen", "modul_selesai", "total_modul_snapshot", "tanggal_selesai"],
    "transaksi_submissionassignment": ["pendaftaran_pelatihan_id", "assignment_id", "status_submission_id", "dokumen_id", "submission_link", "submitted_at", "reviewed_at"],
    "transaksi_sertifikatpelatihan": ["pendaftaran_pelatihan_id", "status_sertifikat_id", "dokumen_id", "nomor_sertifikat", "tanggal_pengajuan", "tanggal_terbit", "diverifikasi_oleh_admin_id", "catatan_validasi"],
    "transaksi_pengajuankerjasama": ["pengajuan_id", "kode_pengajuan", "umkm_id", "mitra_id", "pengaju_akun_id", "penerima_akun_id", "status_pengajuan_id", "pesan_pengajuan", "catatan_keputusan", "dokumen_perjanjian_id", "tanggal_pengajuan", "tanggal_keputusan", "tanggal_upload_dokumen", "tanggal_mulai_kerjasama", "tanggal_selesai_kerjasama", "created_at", "updated_at"],
    "transaksi_penjualan": ["penjualan_id", "umkm_id", "tanggal_transaksi", "nomor_transaksi", "total_omzet", "total_laba", "total_item", "catatan", "status_transaksi", "created_by_akun_id", "created_at", "updated_at"],
    "transaksi_penjualan_item": ["penjualan_item_id", "penjualan_id", "produk_id", "nama_produk_snapshot", "harga_satuan_snapshot", "jumlah", "created_at"],
    "transaksi_stokproduk": ["stok_mutasi_id", "produk_id", "umkm_id", "tipe_mutasi", "jumlah_perubahan", "stok_sebelum", "stok_sesudah", "referensi_tipe", "referensi_id", "catatan", "created_by_akun_id", "created_at"],
    "transaksi_monitoringperkembangan": ["umkm_id", "status_perkembangan_id", "laba_harian", "jumlah_produk", "created_at"],
}

IMPORT_ORDER = [
    "ref_peranpengguna", "ref_jenisumkm", "ref_skalausaha", "ref_kategoriusaha", "ref_kategoriproduk", "ref_statusumkm",
    "ref_jenismitra", "ref_statusmitra", "ref_bidangkemitraan", "ref_bentukdukungan", "ref_skalakerjasama",
    "ref_jenispelatihan", "ref_statuspelatihan", "ref_statuspendaftaranpelatihan", "ref_statussubmission",
    "ref_statussertifikat", "ref_statuspengajuan", "ref_statusperkembangan", "ref_statusverifikasi", "ref_statusdokumen",
    "ref_jenisdokumen", "ref_dimwaktu", "master_akunpengguna", "master_lokasi", "master_pelakuumkm", "master_umkm",
    "master_produkumkm", "master_mitra", "master_mitrabidangkemitraan", "master_mitrabentukdukungan",
    "master_programpelatihan", "master_modulpelatihan", "master_assignmentpelatihan", "master_admin",
    "transaksi_dokumenterunggah", "transaksi_registrasipengguna", "transaksi_pendaftaranpelatihan",
    "transaksi_submissionassignment", "transaksi_sertifikatpelatihan", "transaksi_pengajuankerjasama",
    "transaksi_penjualan", "transaksi_penjualan_item", "transaksi_stokproduk", "transaksi_monitoringperkembangan",
]

# -----------------------------------------------------------------------------
# Data model used internally for coherent row generation.
# -----------------------------------------------------------------------------
@dataclass
class UmkmProfile:
    umkm_id: str
    akun_id: str
    pelaku_umkm_id: str
    lokasi_id: str
    category: str
    skala_usaha_id: str
    kategori_usaha_id: str
    status_umkm_id: str
    nama_umkm: str
    produk_utama: str
    tahun_berdiri: int
    created_at: datetime
    verified: bool
    base_daily_profit: int
    product_count: int

@dataclass
class MitraProfile:
    mitra_id: str
    akun_id: str
    lokasi_id: str
    jenis_mitra_id: str
    status_mitra_id: str
    skala_kerjasama_id: str
    nama_mitra: str
    fields: List[str]
    supports: List[str]
    created_at: datetime
    verified: bool

@dataclass
class TrainingProfile:
    pelatihan_id: str
    jenis_pelatihan_id: str
    status_pelatihan_id: str
    title: str
    topic_index: int
    total_modul: int
    total_assignments: int
    publish_dt: datetime

@dataclass
class AssignmentProfile:
    assignment_id: str
    pelatihan_id: str
    title: str
    topic_index: int
    due_days: int

@dataclass
class RuntimeData:
    rng: random.Random
    manifest: List[Dict[str, Union[str, int]]]
    admin_ids: List[str]
    admin_account_ids: List[str]
    umkm: List[UmkmProfile]
    mitra: List[MitraProfile]
    trainings: List[TrainingProfile]
    assignments: List[AssignmentProfile]
    assignments_by_training: Dict[str, List[AssignmentProfile]]
    modules_by_training: Dict[str, int]
    product_rows: List[List[str]]

# -----------------------------------------------------------------------------
# Utility helpers.
# -----------------------------------------------------------------------------
def str_bool(v: bool) -> str:
    return "true" if v else "false"


def idf(prefix: str, i: int, width: int = 6) -> str:
    return f"{prefix}{i:0{width}d}"


def rand_from_seed(seed: int, *parts: object) -> random.Random:
    h = hashlib.sha256((str(seed) + "|" + "|".join(map(str, parts))).encode("utf-8")).hexdigest()
    return random.Random(int(h[:16], 16))


def weighted_choice(rng: random.Random, items: Sequence, weights: Sequence[float]):
    return rng.choices(list(items), weights=list(weights), k=1)[0]


def dt_fmt(dt: Optional[datetime]) -> str:
    return "" if dt is None else dt.strftime("%Y-%m-%d %H:%M:%S")


def date_fmt(d: Optional[Union[date, datetime]]) -> str:
    if d is None:
        return ""
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    return d.isoformat()


def dt_between(rng: random.Random, start: datetime, end: datetime) -> datetime:
    if end <= start:
        return start
    seconds = int((end - start).total_seconds())
    return start + timedelta(seconds=rng.randint(0, seconds))


def dt_offset(base: datetime, days: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    return base + timedelta(days=days, hours=hours, minutes=minutes)


def safe_slug(text: str, max_len: int = 80) -> str:
    out = []
    for ch in text.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in " -_/":
            out.append("-")
    s = "".join(out)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")[:max_len] or "file"


def make_name(i: int) -> str:
    return f"{FIRST_NAMES[(i * 7) % len(FIRST_NAMES)]} {LAST_NAMES[(i * 11) % len(LAST_NAMES)]}"


def phone(i: int) -> str:
    """Return an Indonesian mobile number as text-like digits.

    It intentionally starts with 0. Excel may hide this if opened directly as CSV,
    but the generated CSV value itself is still correct for database import.
    """
    rr = rand_from_seed(DEFAULT_SEED, "phone", i)
    prefixes = [
        "0811", "0812", "0813", "0821", "0822", "0823", "0851", "0852", "0853",
        "0855", "0856", "0857", "0858", "0877", "0878", "0881", "0882", "0888", "0895", "0896", "0897", "0898", "0899"
    ]
    prefix = prefixes[(i * 7 + rr.randint(0, len(prefixes) - 1)) % len(prefixes)]
    # Most Indonesian mobile numbers are 11-13 digits including leading zero.
    suffix_len = rr.choice([7, 8, 8, 8, 9])
    low = 10 ** (suffix_len - 1)
    high = (10 ** suffix_len) - 1
    suffix = (low + ((i * 7919 + rr.randint(0, high)) % (high - low + 1)))
    return prefix + f"{suffix:0{suffix_len}d}"


def nik(i: int) -> str:
    """Generate a 16-digit synthetic Indonesian-style NIK as a string."""
    rr = rand_from_seed(DEFAULT_SEED, "nik", i)
    area_codes = [
        "337201", "337202", "337203", "337204", "337205", "331101", "331201", "331301",
        "331401", "331501", "331601", "331701", "347101", "347102", "327301", "327302",
        "317101", "317102", "357801", "357802", "332201", "332301", "332501", "332701"
    ]
    area = area_codes[(i * 5 + rr.randint(0, len(area_codes) - 1)) % len(area_codes)]
    year = rr.randint(1968, 2005)
    month = rr.randint(1, 12)
    # Keep the date plausible without depending on calendar month length too much.
    day = rr.randint(1, 28)
    if rr.random() < 0.48:
        day += 40  # common female encoding convention in NIK.
    dob = f"{day:02d}{month:02d}{year % 100:02d}"
    seq = 1000 + ((i * 37 + rr.randint(0, 7999)) % 9000)
    return area + dob + f"{seq:04d}"


def nib(i: int) -> str:
    """Generate a unique 13-digit synthetic NIB as a string."""
    rr = rand_from_seed(DEFAULT_SEED, "nib", i)
    prefixes = ["12", "13", "14", "18", "21", "22", "31", "33", "91"]
    prefix = prefixes[(i * 3 + rr.randint(0, len(prefixes) - 1)) % len(prefixes)]
    body = (i * 987_654_321 + rr.randint(100_000_000, 999_999_999)) % 10_000_000_000
    check = (sum(int(d) for d in prefix + f"{body:010d}") + i) % 10
    return prefix + f"{body:010d}" + str(check)


def npwp(i: int) -> str:
    rr = rand_from_seed(DEFAULT_SEED, "npwp", i)
    return f"{(10 + (i * 3 + rr.randint(0, 80)) % 89):02d}.{(100 + i * 7 + rr.randint(0, 400)) % 899:03d}.{(100 + i * 13 + rr.randint(0, 400)) % 899:03d}.{1 + i % 9}-{(100 + i * 19 + rr.randint(0, 500)) % 899:03d}.{(100 + i * 23 + rr.randint(0, 500)) % 899:03d}"


def email_from_name(name: str, i: int, domain: str) -> str:
    """Generate varied but deterministic email formats."""
    rr = rand_from_seed(DEFAULT_SEED, "email", name, i, domain)
    parts = [p for p in safe_slug(name, 60).split("-") if p]
    first = parts[0] if parts else "user"
    last = parts[-1] if len(parts) > 1 else "usaha"
    initials = "".join(p[0] for p in parts[:3]) or "u"
    if domain in {"gmail.com", "yahoo.co.id", "outlook.com", "mail.com"} and rr.random() < 0.38:
        domain = rr.choice(EMAIL_DOMAINS_UMKM)
    patterns = [
        f"{first}.{last}{i % 97}",
        f"{first}{last}{i % 1000}",
        f"{first}_{last}.{i:03d}",
        f"{initials}{i:05d}",
        f"{first}.{i:05d}",
        f"{first}-{last}-{(i * 17) % 10000:04d}",
    ]
    return f"{rr.choice(patterns)}@{domain}"


PASSWORD_WORDS = [
    "Berkah", "Tumbuh", "Mandiri", "Digital", "Kemitraan", "Usaha", "Produk", "Pasar",
    "Maju", "Kreatif", "Sejahtera", "Nusantara", "Katalog", "Modal", "Pelatihan", "UMKM"
]


def account_role_and_domain(i: int, args) -> Tuple[str, str]:
    """Return the same role/domain logic used by account_rows and credentials output."""
    rr = rand_from_seed(args.seed, "account", i)
    if i <= args.admin_rows:
        return "ADMIN", "umkmtumbuh.go.id"
    if i <= args.admin_rows + args.umkm_rows:
        return "UMKM", rr.choice(["gmail.com", "yahoo.co.id", "outlook.com", "mail.com"])
    return "MITRA", rr.choice(["mitra.id", "gmail.com", "corp.id", "mail.com"])


def plaintext_password_for_account(i: int, role: str, args) -> str:
    """Generate a deterministic but varied plaintext password for staging credentials.

    The plaintext is written only to metadata/generated_credentials.csv so testers can
    log in during staging. Do not use that metadata file in production-like datasets.
    """
    if getattr(args, "password_mode", "random") == "shared":
        return args.shared_password
    rr = rand_from_seed(args.seed, "plaintext-password", i, role)
    left = rr.choice(PASSWORD_WORDS)
    right = rr.choice(PASSWORD_WORDS)
    number = rr.randint(1000, 9999)
    symbol = rr.choice(["!", "@", "#", "$", "%"])
    # Example: TumbuhPasar4821!
    return f"{left}{right}{number}{symbol}"


def sha256_password_hash(password: str, i: int, args) -> str:
    """Fast synthetic hash. Good for data realism; not a production password algorithm."""
    salt_raw = hashlib.sha256(f"{args.seed}|password-salt|{i}".encode("utf-8")).digest()[:16]
    salt = base64.urlsafe_b64encode(salt_raw).decode("ascii").rstrip("=")
    digest = hashlib.sha256(salt_raw + password.encode("utf-8")).hexdigest()
    return f"sha256${salt}${digest}"


def pbkdf2_password_hash(password: str, i: int, args) -> str:
    """Standard-library PBKDF2 hash format for staging datasets."""
    salt_raw = hashlib.sha256(f"{args.seed}|pbkdf2-salt|{i}".encode("utf-8")).digest()[:16]
    salt = base64.urlsafe_b64encode(salt_raw).decode("ascii").rstrip("=")
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_raw,
        args.pbkdf2_iterations,
    )
    encoded = base64.urlsafe_b64encode(derived).decode("ascii").rstrip("=")
    return f"pbkdf2_sha256${args.pbkdf2_iterations}${salt}${encoded}"


def bcrypt_password_hash(password: str, args) -> str:
    """Generate a real bcrypt hash if the optional bcrypt package is installed."""
    try:
        import bcrypt  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "bcrypt package is required for --password-hash-algo bcrypt. "
            "Install it with: pip install bcrypt"
        ) from exc
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=args.bcrypt_rounds)).decode("utf-8")


def password_hash_for_account(i: int, role: str, args) -> str:
    password = plaintext_password_for_account(i, role, args)
    algo = getattr(args, "password_hash_algo", "sha256")
    if algo == "constant":
        return "$2a$10$syntheticBcryptHashForStagingOnly"
    if algo == "sha256":
        return sha256_password_hash(password, i, args)
    if algo == "pbkdf2":
        return pbkdf2_password_hash(password, i, args)
    if algo == "bcrypt":
        return bcrypt_password_hash(password, args)
    raise ValueError(f"Unsupported password hash algorithm: {algo}")


def credential_rows(args) -> Iterator[List[object]]:
    """Extra non-schema CSV for staging testers.

    This file is intentionally outside csv/*.csv because it is not a database table.
    """
    total_accounts = args.admin_rows + args.umkm_rows + args.mitra_rows
    for i in range(1, total_accounts + 1):
        role, domain = account_role_and_domain(i, args)
        name = make_name(i)
        email = email_from_name(name, i, domain)
        yield [
            idf("AKUN", i),
            role,
            name,
            email,
            plaintext_password_for_account(i, role, args),
            args.password_hash_algo,
        ]


EXCEL_SAFE_IDENTIFIERS = False
EXCEL_SENSITIVE_COLUMNS = {
    "nik", "nib", "npwp", "no_hp", "nomor_whatsapp", "kontak_pic", "email", "email_bisnis",
    "email_pic", "public_url", "storage_path", "object_key", "submission_link", "checksum_sha256"
}


def excel_safe(value: object) -> str:
    """Formula-style CSV cell for Excel preview only. Do not use for DB COPY import."""
    s = "" if value is None else str(value)
    if s == "":
        return ""
    # Escape double quotes for Excel formula.
    return '="' + s.replace('"', '""') + '"'


def format_csv_cell(table: str, column: str, value: object) -> str:
    s = clean_csv_value(value)
    if EXCEL_SAFE_IDENTIFIERS and column in EXCEL_SENSITIVE_COLUMNS:
        return excel_safe(s)
    return s


def make_address(rr: random.Random) -> str:
    pattern = rr.choice(ADDRESS_PATTERNS)
    return pattern.format(
        street=rr.choice(STREETS),
        number=rr.randint(1, 240),
        rt=f"{rr.randint(1, 14):02d}",
        rw=f"{rr.randint(1, 12):02d}",
        gang=rr.choice(GANG_NAMES),
        block=rr.choice(list("ABCDEFGH")),
        km=f"{rr.randint(1, 18)}.{rr.randint(0, 9)}",
        ruko=rr.choice(RUKO_NAMES),
        market=rr.choice(MARKET_NAMES),
    )


def business_email(name: str, i: int, rr: random.Random, role: str = "umkm") -> str:
    domain_pool = EMAIL_DOMAINS_MITRA if role == "mitra" else EMAIL_DOMAINS_UMKM
    slug = safe_slug(name, 50)
    prefix = rr.choice(BUSINESS_EMAIL_PREFIXES)
    pattern = rr.choice([
        f"{prefix}.{slug}",
        f"{prefix}-{slug}",
        f"{slug}.{prefix}",
        f"{slug}{i % 1000:03d}",
        f"{prefix}{i % 100:02d}.{slug}",
    ])
    return f"{pattern}@{rr.choice(domain_pool)}"


def realistic_operational_hours(rr: random.Random, category: Optional[str] = None) -> str:
    if category == "KULINER" and rr.random() < 0.45:
        return rr.choice(["Setiap hari 07.00-21.00", "Senin-Sabtu 06.30-16.00", "Produksi 05.00-11.00; order online 24 jam", "Selasa-Minggu 10.00-22.00"])
    if category == "DIGITAL" and rr.random() < 0.55:
        return rr.choice(["Senin-Jumat 09.00-17.00; layanan online 24 jam", "Remote by appointment", "Senin-Sabtu 10.00-18.00"])
    return rr.choice(OPERATIONAL_HOURS)


def marketplace_channels(rr: random.Random, category: Optional[str] = None) -> str:
    if category == "KULINER" and rr.random() < 0.35:
        return rr.choice(["GrabFood;GoFood", "ShopeeFood;WhatsApp Business", "Instagram;WhatsApp Business;GoFood"])
    if category in {"FASHION", "KRIYA", "KECANTIKAN"} and rr.random() < 0.45:
        return rr.choice(["Instagram;Shopee;TikTok Shop", "Shopee;Tokopedia;Instagram", "Website katalog;Instagram"])
    if category == "DIGITAL":
        return rr.choice(["Website katalog;Instagram", "LinkedIn;Website katalog", "Instagram;WhatsApp Business", "Google Business Profile;Website katalog"])
    return rr.choice(MARKETPLACE_CHANNELS)


def business_description(name: str, label: str, main: str, rr: random.Random) -> str:
    return rr.choice(BUSINESS_DESCRIPTION_TEMPLATES).format(name=name, label=label, main=main)


def money_round(value: float, base: int = 500) -> int:
    return int(round(value / base) * base)


def clean_csv_value(v):
    if v is None:
        return ""
    return str(v)

# -----------------------------------------------------------------------------
# Output writers. Supports directory or zip target with one CSV per table.
# -----------------------------------------------------------------------------
class CsvSink:
    def __init__(self, out_dir: Optional[Path], zip_path: Optional[Path], compresslevel: int):
        self.out_dir = out_dir
        self.zip_path = zip_path
        self.compresslevel = compresslevel
        self.zf: Optional[zipfile.ZipFile] = None
        if out_dir:
            out_dir.mkdir(parents=True, exist_ok=True)
        if zip_path:
            zip_path.parent.mkdir(parents=True, exist_ok=True)
            compression = zipfile.ZIP_DEFLATED if compresslevel > 0 else zipfile.ZIP_STORED
            self.zf = zipfile.ZipFile(zip_path, "w", compression=compression, compresslevel=compresslevel if compresslevel > 0 else None, allowZip64=True)

    def close(self):
        if self.zf:
            self.zf.close()

    def write_text(self, rel_path: str, content: str):
        if self.zf:
            self.zf.writestr(rel_path, content)
        if self.out_dir:
            path = self.out_dir / rel_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")

    def open_csv(self, table: str) -> Tuple[TextIO, Optional[io.BufferedWriter]]:
        rel_path = f"csv/{table}.csv"
        if self.zf:
            bf = self.zf.open(rel_path, "w", force_zip64=True)
            return io.TextIOWrapper(bf, encoding="utf-8", newline=""), bf
        assert self.out_dir is not None
        path = self.out_dir / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        return path.open("w", encoding="utf-8", newline=""), None


def write_table(sink: CsvSink, rt: RuntimeData, table: str, header: List[str], rows: Iterable[Sequence[object]], progress_every: int = 500_000):
    f, bf = sink.open_csv(table)
    try:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(header)
        count = 0
        for row in rows:
            writer.writerow([format_csv_cell(table, header[idx], v) for idx, v in enumerate(row)])
            count += 1
            if progress_every and count % progress_every == 0:
                print(f"{table}: {count:,} rows", flush=True)
        f.flush()
    finally:
        f.close()
    rt.manifest.append({"table": table, "rows": count, "file": f"csv/{table}.csv"})
    print(f"DONE {table}: {count:,} rows", flush=True)

# -----------------------------------------------------------------------------
# Reference/dimension rows.
# -----------------------------------------------------------------------------
def ref_dimwaktu_rows() -> Iterator[List[object]]:
    cur = date(2024, 1, 1)
    end = date(2026, 12, 31)
    bulan_names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    while cur <= end:
        week_start = cur - timedelta(days=cur.weekday())
        week_end = week_start + timedelta(days=6)
        yield [cur.isoformat(), cur.day, cur.isocalendar().week, (cur.day - 1) // 7 + 1, week_start.isoformat(), week_end.isoformat(), cur.month, bulan_names[cur.month - 1], (cur.month - 1) // 3 + 1, cur.year, str_bool(cur.weekday() >= 5)]
        cur += timedelta(days=1)

def initial_stock_for_product(rr: random.Random, category: str, scale: str, status_produk: str) -> int:
    """Generate plausible current stock for BI-oriented stock analysis."""
    if status_produk == "NONAKTIF":
        return rr.randint(0, 12)
    if status_produk == "DRAFT":
        return rr.randint(0, 35)
    base_by_category = {
        "KULINER": (8, 180),
        "FASHION": (5, 90),
        "KRIYA": (3, 70),
        "AGRIBISNIS": (10, 220),
        "JASA": (0, 25),
        "KECANTIKAN": (8, 160),
        "DIGITAL": (0, 30),
        "PERDAGANGAN": (20, 450),
    }
    lo, hi = base_by_category.get(category, (5, 120))
    multiplier = {"MIKRO": 1.0, "KECIL": 1.8, "MENENGAH": 3.2}.get(scale, 1.0)
    return max(0, int(rr.triangular(lo, hi * multiplier, lo + (hi * multiplier - lo) * 0.35)))


# -----------------------------------------------------------------------------
# Runtime data construction.
# -----------------------------------------------------------------------------
def build_runtime(args) -> RuntimeData:
    rng = random.Random(args.seed)
    admin_ids = [idf("ADM", i) for i in range(1, args.admin_rows + 1)]
    admin_account_ids = [idf("AKUN", i) for i in range(1, args.admin_rows + 1)]
    umkm_profiles: List[UmkmProfile] = []
    mitra_profiles: List[MitraProfile] = []
    training_profiles: List[TrainingProfile] = []
    assignment_profiles: List[AssignmentProfile] = []
    assignments_by_training: Dict[str, List[AssignmentProfile]] = {}
    modules_by_training: Dict[str, int] = {}
    product_rows: List[List[str]] = []

    # UMKM profiles are strongly category-linked.
    for i in range(1, args.umkm_rows + 1):
        rr = rand_from_seed(args.seed, "umkm", i)
        category = weighted_choice(rr, CATEGORY_KEYS, CATEGORY_WEIGHTS)
        profile = CATEGORY_PROFILES[category]
        akun_id = idf("AKUN", args.admin_rows + i)
        pelaku_umkm_id = idf("PLK", i)
        lokasi_id = idf("LOK", 1 + ((i * 13) % args.lokasi_rows))
        scale = weighted_choice(rr, ["MIKRO", "KECIL", "MENENGAH"], [0.67, 0.27, 0.06])
        if i % 41 == 0:
            status = "MENUNGGU_VERIFIKASI"
        elif i % 97 == 0:
            status = "NONAKTIF"
        elif i % 173 == 0:
            status = "SUSPEND"
        else:
            status = "AKTIF"
        core = BUSINESS_CORE[(i * 5 + len(category)) % len(BUSINESS_CORE)]
        prefix = BUSINESS_PREFIX[(i * 7) % len(BUSINESS_PREFIX)]
        product_main = rr.choice(profile["products"])
        name = f"{prefix} {core} {product_main.split()[0]}"
        established = rr.randint(2012, 2025)
        created_at = dt_between(rr, START, min(TODAY, datetime(established if established >= 2024 else 2024, 1, 5, 8, 0, 0) + timedelta(days=860)))
        product_count = rr.randint(args.min_products_per_umkm, args.max_products_per_umkm)
        scale_multiplier = {"MIKRO": 1.0, "KECIL": 2.4, "MENENGAH": 5.5}[scale]
        category_multiplier = {"KULINER": 1.1, "FASHION": 1.5, "KRIYA": 1.3, "AGRIBISNIS": 1.2, "JASA": 1.6, "KECANTIKAN": 1.4, "DIGITAL": 2.2, "PERDAGANGAN": 1.7}[category]
        base_profit = int(rr.uniform(45_000, 270_000) * scale_multiplier * category_multiplier)
        umkm_profiles.append(UmkmProfile(
            umkm_id=idf("UMK", i), akun_id=akun_id, pelaku_umkm_id=pelaku_umkm_id, lokasi_id=lokasi_id,
            category=category, skala_usaha_id=scale, kategori_usaha_id=profile["kategori_usaha_id"], status_umkm_id=status,
            nama_umkm=name, produk_utama=product_main, tahun_berdiri=established, created_at=created_at,
            verified=status == "AKTIF", base_daily_profit=base_profit, product_count=product_count,
        ))

    # Product master rows are generated from UMKM category; prices match product category and scale.
    produk_i = 0
    for u in umkm_profiles:
        rr = rand_from_seed(args.seed, "produk-set", u.umkm_id)
        profile = CATEGORY_PROFILES[u.category]
        for j in range(1, u.product_count + 1):
            produk_i += 1
            product_name = rr.choice(profile["products"])
            if j == 1:
                product_name = u.produk_utama
            lo, hi = profile["price_range"]
            scale_factor = {"MIKRO": 0.9, "KECIL": 1.15, "MENENGAH": 1.45}[u.skala_usaha_id]
            price = money_round(rr.uniform(lo, hi) * scale_factor, 500)
            legalitas = ", ".join(rr.sample(profile["legalitas"], k=min(len(profile["legalitas"]), rr.randint(1, 3))))
            status_produk = weighted_choice(rr, ["AKTIF", "DRAFT", "NONAKTIF"], [0.88, 0.08, 0.04])
            stok_saat_ini = initial_stock_for_product(rr, u.category, u.skala_usaha_id, status_produk)
            created = u.created_at + timedelta(days=rr.randint(0, 180), hours=rr.randint(0, 8))
            is_deleted = status_produk == "NONAKTIF" and rr.random() < 0.2
            deleted_at = created + timedelta(days=rr.randint(60, 520)) if is_deleted else None
            product_rows.append([
                idf("PRD", produk_i), u.umkm_id, f"KATP{1 + (produk_i % 16):02d}", product_name,
                f"{product_name} dari {u.nama_umkm}, dikemas untuk penjualan lokal dan online dengan fokus kualitas dan konsistensi.",
                price, stok_saat_ini, status_produk, legalitas, str_bool(is_deleted), dt_fmt(deleted_at), "", dt_fmt(created), dt_fmt(created + timedelta(days=rr.randint(0, 90)))
            ])

    # Mitra profiles: type controls fields/supports.
    for i in range(1, args.mitra_rows + 1):
        rr = rand_from_seed(args.seed, "mitra", i)
        jenis = weighted_choice(rr, MITRA_TYPE_IDS, MITRA_TYPE_WEIGHTS)
        prof = MITRA_TYPE_PROFILES[jenis]
        akun_id = idf("AKUN", args.admin_rows + args.umkm_rows + i)
        lokasi_id = idf("LOK", 1 + ((i * 23) % args.lokasi_rows))
        status = weighted_choice(rr, ["AKTIF", "MENUNGGU_VERIFIKASI", "DITOLAK", "NONAKTIF"], [0.83, 0.10, 0.03, 0.04])
        scale = weighted_choice(rr, ["LOKAL", "KABUPATEN", "PROVINSI", "NASIONAL", "EKSPOR"], [0.32, 0.26, 0.19, 0.17, 0.06])
        prefix = rr.choice(prof["prefixes"])
        core = MITRA_CORES[(i * 7) % len(MITRA_CORES)]
        name = f"{prefix} {core}"
        fields = rr.sample(prof["fields"], k=min(len(prof["fields"]), rr.randint(2, min(4, len(prof["fields"])))))
        supports = rr.sample(prof["supports"], k=min(len(prof["supports"]), rr.randint(2, min(4, len(prof["supports"])))))
        created_at = dt_between(rr, START, TODAY - timedelta(days=10))
        mitra_profiles.append(MitraProfile(
            mitra_id=idf("MTR", i), akun_id=akun_id, lokasi_id=lokasi_id, jenis_mitra_id=jenis,
            status_mitra_id=status, skala_kerjasama_id=scale, nama_mitra=name, fields=fields, supports=supports,
            created_at=created_at, verified=status == "AKTIF",
        ))

    # Training programs: topic-linked modules and file-upload assignments.
    assignment_counter = 0
    for i in range(1, args.pelatihan_rows + 1):
        rr = rand_from_seed(args.seed, "pelatihan", i)
        topic_idx = (i - 1) % len(TRAINING_TOPICS)
        jenis_id, base_title, modules, assignment_templates = TRAINING_TOPICS[topic_idx]
        pelatihan_id = idf("PLT", i)
        status = weighted_choice(rr, ["PUBLISHED", "ONGOING", "DRAFT", "ARCHIVED", "CANCELLED"], [0.52, 0.25, 0.08, 0.12, 0.03])
        total_modul = rr.randint(4, 8)
        total_assignments = rr.randint(1, 3)
        publish_dt = dt_between(rr, datetime(2024, 2, 1, 9, 0, 0), TODAY - timedelta(days=14))
        suffix = rr.choice(["Pemula", "Praktis", "Intensif", "Mandiri", "Terapan", "Kelas Proyek", "Batch UMKM"])
        training_profiles.append(TrainingProfile(
            pelatihan_id=pelatihan_id, jenis_pelatihan_id=jenis_id, status_pelatihan_id=status,
            title=f"{base_title} - {suffix}", topic_index=topic_idx, total_modul=total_modul,
            total_assignments=total_assignments, publish_dt=publish_dt,
        ))
        modules_by_training[pelatihan_id] = total_modul
        assignments_by_training[pelatihan_id] = []
        for a in range(1, total_assignments + 1):
            assignment_counter += 1
            assignment_id = idf("ASN", assignment_counter)
            title = assignment_templates[(a - 1) % len(assignment_templates)]
            ap = AssignmentProfile(assignment_id=assignment_id, pelatihan_id=pelatihan_id, title=title, topic_index=topic_idx, due_days=7 + a * 5 + rr.randint(0, 7))
            assignment_profiles.append(ap)
            assignments_by_training[pelatihan_id].append(ap)

    return RuntimeData(
        rng=rng,
        manifest=[],
        admin_ids=admin_ids,
        admin_account_ids=admin_account_ids,
        umkm=umkm_profiles,
        mitra=mitra_profiles,
        trainings=training_profiles,
        assignments=assignment_profiles,
        assignments_by_training=assignments_by_training,
        modules_by_training=modules_by_training,
        product_rows=product_rows,
    )

# -----------------------------------------------------------------------------
# Master table row generators.
# -----------------------------------------------------------------------------
def account_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    total_accounts = args.admin_rows + args.umkm_rows + args.mitra_rows
    for i in range(1, total_accounts + 1):
        rr = rand_from_seed(args.seed, "account", i)
        role, domain = account_role_and_domain(i, args)
        name = make_name(i)
        created = dt_between(rr, START, TODAY - timedelta(days=2))
        verified = created + timedelta(hours=rr.randint(1, 96)) if rr.random() < (0.94 if role != "ADMIN" else 1.0) else None
        last_login = dt_between(rr, created, TODAY) if rr.random() < 0.78 else None
        if role == "ADMIN":
            active = True
        else:
            active = rr.random() > 0.035
        password_hash = password_hash_for_account(i, role, args)
        yield [
            idf("AKUN", i),
            role,
            name,
            email_from_name(name, i, domain),
            phone(i),
            password_hash,
            str_bool(active),
            dt_fmt(verified),
            dt_fmt(last_login),
            dt_fmt(created),
            dt_fmt(max(created, last_login or created)),
        ]


def location_rows(args) -> Iterator[List[object]]:
    weights = [x[7] for x in PROVINCE_CITY_DATA]
    for i in range(1, args.lokasi_rows + 1):
        rr = rand_from_seed(args.seed, "lokasi", i)
        prov, kab, kec, kels, kpos, lat, lng, _ = weighted_choice(rr, PROVINCE_CITY_DATA, weights)
        kel = rr.choice(kels)
        alamat = make_address(rr)
        jitter_lat = lat + rr.uniform(-0.025, 0.025)
        jitter_lng = lng + rr.uniform(-0.025, 0.025)
        created = dt_between(rr, START, TODAY)
        yield [idf("LOK", i), prov, kab, kec, kel, kpos, alamat, f"{jitter_lat:.6f}", f"{jitter_lng:.6f}", dt_fmt(created), dt_fmt(created + timedelta(days=rr.randint(0, 60)))]


def pelaku_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for idx, u in enumerate(rt.umkm, 1):
        name = make_name(args.admin_rows + idx)
        email = email_from_name(name, args.admin_rows + idx, "gmail.com")
        active = u.status_umkm_id not in {"NONAKTIF", "SUSPEND"}
        deleted = u.status_umkm_id == "NONAKTIF" and idx % 11 == 0
        deleted_at = u.created_at + timedelta(days=600) if deleted else None
        yield [u.pelaku_umkm_id, u.akun_id, name, nik(idx), phone(args.admin_rows + idx), email, f"Alamat sesuai lokasi usaha {u.nama_umkm}", str_bool(active), str_bool(deleted), dt_fmt(deleted_at), "", dt_fmt(u.created_at), dt_fmt(u.created_at + timedelta(days=idx % 97))]


def umkm_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for idx, u in enumerate(rt.umkm, 1):
        rr = rand_from_seed(args.seed, "umkm-row", idx)
        admin_id = rr.choice(rt.admin_ids)
        profile = CATEGORY_PROFILES[u.category]
        deskripsi = business_description(u.nama_umkm, profile["produk_label"], u.produk_utama, rr)
        marketplace = marketplace_channels(rr, u.category)
        logo = f"https://cdn.umkmtumbuh.local/logo/{u.umkm_id.lower()}.webp"
        cover = f"https://cdn.umkmtumbuh.local/cover/{u.umkm_id.lower()}.webp"
        is_deleted = u.status_umkm_id == "NONAKTIF" and rr.random() < 0.25
        deleted_at = u.created_at + timedelta(days=rr.randint(200, 700)) if is_deleted else None
        yield [
            u.umkm_id, f"UMKM-2026-{idx:06d}", u.pelaku_umkm_id, admin_id if u.verified else "", u.lokasi_id,
            u.category, u.skala_usaha_id, u.kategori_usaha_id, u.status_umkm_id, u.nama_umkm, nib(idx) if rr.random() < 0.82 else "",
            deskripsi, u.produk_utama, u.tahun_berdiri, phone(args.admin_rows + idx), business_email(u.nama_umkm, idx, rr, "umkm"),
            realistic_operational_hours(rr, u.category),
            marketplace, logo, cover, str_bool(u.verified), date_fmt(u.created_at), str_bool(is_deleted), dt_fmt(deleted_at), "",
            dt_fmt(u.created_at), dt_fmt(u.created_at + timedelta(days=rr.randint(0, 120))),
        ]


def product_rows(rt: RuntimeData) -> Iterator[List[object]]:
    yield from rt.product_rows


def mitra_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for idx, m in enumerate(rt.mitra, 1):
        rr = rand_from_seed(args.seed, "mitra-row", idx)
        admin_id = rr.choice(rt.admin_ids)
        pic_name = make_name(args.admin_rows + args.umkm_rows + idx)
        badan_hukum = m.nama_mitra if m.nama_mitra.startswith(("PT", "CV", "Koperasi", "Yayasan")) else f"{m.nama_mitra} Mandiri"
        deskripsi = rr.choice([
            f"{m.nama_mitra} mendukung UMKM melalui {', '.join(m.supports).lower()} pada bidang {', '.join(m.fields).lower()}. Fokus program disesuaikan dengan kebutuhan legalitas, pemasaran, dan peningkatan kapasitas usaha.",
            f"{m.nama_mitra} membuka program kolaborasi untuk UMKM pada bidang {', '.join(m.fields).lower()} dengan bentuk dukungan {', '.join(m.supports).lower()}.",
            f"{m.nama_mitra} berperan sebagai mitra pendamping yang menyediakan {', '.join(m.supports[:3]).lower()} bagi UMKM terkurasi.",
        ])
        is_deleted = m.status_mitra_id == "NONAKTIF" and rr.random() < 0.20
        deleted_at = m.created_at + timedelta(days=rr.randint(180, 720)) if is_deleted else None
        yield [
            m.mitra_id, f"MITRA-2026-{idx:05d}", m.akun_id, admin_id if m.verified else "", m.lokasi_id, m.jenis_mitra_id,
            m.status_mitra_id, m.skala_kerjasama_id, m.nama_mitra, badan_hukum, nib(args.umkm_rows + idx) if rr.random() < 0.70 else "",
            npwp(idx) if rr.random() < 0.75 else "", pic_name, rr.choice(["Manajer Program", "Koordinator Kemitraan", "Kepala Divisi UMKM", "PIC CSR", "Business Development"]),
            phone(args.admin_rows + args.umkm_rows + idx), business_email(m.nama_mitra, idx, rr, "mitra"),
            f"{make_address(rr)}, kantor operasional {m.nama_mitra}", rr.choice(["Solo Raya", "Jawa Tengah", "Nasional", "Jawa-Bali", "Kabupaten/Kota", "Online Nasional"]),
            deskripsi, f"https://cdn.umkmtumbuh.local/mitra/logo/{m.mitra_id.lower()}.webp", f"https://cdn.umkmtumbuh.local/mitra/cover/{m.mitra_id.lower()}.webp",
            str_bool(m.verified), str_bool(is_deleted), dt_fmt(deleted_at), "", dt_fmt(m.created_at), dt_fmt(m.created_at + timedelta(days=rr.randint(0, 80))),
        ]


def mitra_bidang_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    bidang_map = {name: f"BK{i:02d}" for i, name in enumerate(["Permodalan", "Pemasaran", "Pelatihan", "Digitalisasi", "Sertifikasi Produk", "Legalitas Usaha", "Distribusi", "Ekspor", "Desain Kemasan", "Pendampingan Bisnis", "Riset Produk", "Akses Marketplace"], 1)}
    for idx, m in enumerate(rt.mitra, 1):
        for field in m.fields:
            yield [m.mitra_id, bidang_map.get(field, "BK10"), dt_fmt(m.created_at + timedelta(days=idx % 10))]


def mitra_bentuk_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    support_map = {name: f"BD{i:02d}" for i, name in enumerate(["Dana Hibah", "Pinjaman Lunak", "Mentoring", "Kelas Pelatihan", "Akses Pameran", "Promosi Digital", "Bantuan Alat", "Konsultasi Legal", "Kurasi Produk", "Akses Gudang", "Kemitraan Penjualan", "Fasilitasi Sertifikasi"], 1)}
    alias = {"Akses Marketplace": "Kemitraan Penjualan", "Konsultasi Ekspor": "Konsultasi Legal"}
    for idx, m in enumerate(rt.mitra, 1):
        for sup in m.supports:
            yield [m.mitra_id, support_map.get(alias.get(sup, sup), "BD03"), dt_fmt(m.created_at + timedelta(days=idx % 13))]


def training_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for idx, t in enumerate(rt.trainings, 1):
        rr = rand_from_seed(args.seed, "training-row", idx)
        mentor = make_name(5000 + idx)
        durasi_jam = max(2, int(t.total_modul * rr.uniform(0.75, 1.8)))
        alumni_base = 0 if t.status_pelatihan_id == "DRAFT" else int(rr.triangular(20, 1200, 280))
        rating = "" if alumni_base < 10 else f"{rr.uniform(4.1, 4.95):.2f}"
        desc = rr.choice(TRAINING_DESC_TEMPLATES).format(title=t.title.lower())
        syarat = rr.choice(TRAINING_REQUIREMENT_VARIANTS)
        is_deleted = t.status_pelatihan_id == "CANCELLED"
        archived_at = t.publish_dt + timedelta(days=rr.randint(180, 650)) if t.status_pelatihan_id == "ARCHIVED" else None
        yield [
            t.pelatihan_id, f"PLT-2026-{idx:05d}", rr.choice(rt.admin_ids), t.jenis_pelatihan_id, t.status_pelatihan_id,
            t.title, desc, mentor, durasi_jam, t.total_modul, "0", str_bool(rr.random() < 0.62), rr.choice(["30", "60", "90", "180", "365"]),
            rating, alumni_base, f"https://cdn.umkmtumbuh.local/training/{t.pelatihan_id.lower()}.webp", syarat,
            dt_fmt(t.publish_dt if t.status_pelatihan_id != "DRAFT" else None), str_bool(is_deleted), dt_fmt(t.publish_dt + timedelta(days=30) if is_deleted else None), dt_fmt(archived_at),
            dt_fmt(t.publish_dt - timedelta(days=rr.randint(5, 40))), dt_fmt(t.publish_dt + timedelta(days=rr.randint(0, 90))),
        ]


def module_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    module_counter = 0
    for t in rt.trainings:
        topic = TRAINING_TOPICS[t.topic_index]
        base_modules = topic[2]
        for order in range(1, t.total_modul + 1):
            module_counter += 1
            rr = rand_from_seed(args.seed, "module-row", t.pelatihan_id, order)
            title = base_modules[(order - 1) % len(base_modules)]
            yield [
                idf("MOD", module_counter), t.pelatihan_id, order,
                f"{order}. {title}", rr.choice([
                    f"Materi praktik tentang {title.lower()} dengan contoh penerapan langsung pada UMKM.",
                    f"Pembahasan {title.lower()} menggunakan studi kasus usaha kecil dan template kerja sederhana.",
                    f"Modul {title.lower()} berisi panduan langkah demi langkah dan contoh output yang bisa diadaptasi peserta.",
                ]),
                20 + ((module_counter * 7) % 55), f"https://cdn.umkmtumbuh.local/materi/{t.pelatihan_id.lower()}/modul-{order}.pdf",
                str_bool(order == 1), str_bool(t.status_pelatihan_id != "CANCELLED"), dt_fmt(t.publish_dt - timedelta(days=3)),
            ]


def assignment_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    # No quiz. All are project/file upload style.
    for ap in rt.assignments:
        topic = TRAINING_TOPICS[ap.topic_index]
        rr = rand_from_seed(DEFAULT_SEED, "assignment-row", ap.assignment_id)
        desc = rr.choice([
            f"Tugas proyek: {ap.title}. Peserta diminta membuat bukti praktik yang relevan dengan usaha masing-masing.",
            f"Project file-upload: {ap.title}. Output harus menunjukkan proses dan hasil penerapan pada UMKM peserta.",
            f"Studi kasus terapan: {ap.title}. Peserta menyiapkan dokumen kerja, bukti pendukung, dan rencana tindak lanjut.",
        ])
        instruksi = rr.choice(ASSIGNMENT_INSTRUCTION_VARIANTS)
        yield [ap.assignment_id, ap.pelatihan_id, ap.title, desc, instruksi, ap.due_days, "true", dt_fmt(START + timedelta(days=ap.due_days))]


def admin_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for i, admin_id in enumerate(rt.admin_ids, 1):
        created = dt_between(rand_from_seed(args.seed, "admin", i), START, TODAY - timedelta(days=30))
        yield [admin_id, idf("AKUN", i), f"ADM-2026-{i:04d}", "active" if i % 23 else "inactive", dt_fmt(created), dt_fmt(created + timedelta(days=i % 30))]

# -----------------------------------------------------------------------------
# Transaction generators.
# -----------------------------------------------------------------------------
def document_id_for(row_num: int, kind: str, args) -> str:
    # Reuses ranges in the single 2M document table so referenced documents exist and mostly match context.
    # The ranges are fractions, but the IDs remain DOK000001 style to match schema simplicity.
    n = args.transaction_rows
    if n <= 0:
        return ""
    ranges = {
        "TASK": (1, max(1, int(n * 0.38))),
        "CERT": (max(1, int(n * 0.38)) + 1, max(1, int(n * 0.53))),
        "AGREEMENT": (max(1, int(n * 0.53)) + 1, max(1, int(n * 0.65))),
        "UMKM": (max(1, int(n * 0.65)) + 1, max(1, int(n * 0.80))),
        "MITRA": (max(1, int(n * 0.80)) + 1, max(1, int(n * 0.90))),
        "SUPPORT": (max(1, int(n * 0.90)) + 1, n),
    }
    start, end = ranges.get(kind, (1, n))
    if end < start:
        start, end = 1, n
    return idf("DOK", start + ((row_num - 1) % (end - start + 1)))


def document_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    n = args.transaction_rows
    for i in range(1, n + 1):
        rr = rand_from_seed(args.seed, "dok", i)
        frac = i / max(n, 1)
        if frac <= 0.38:
            kind, jenis, owner_type = "TASK", "TUGAS_PELATIHAN", "UMKM"
            u = rt.umkm[(i * 17) % len(rt.umkm)]
            owner_id, uploader = u.umkm_id, u.akun_id
            context_type, context_id = "SUBMISSION_ASSIGNMENT", idf("PDF", 1 + ((i - 1) % n))
            ext = weighted_choice(rr, ["pdf", "docx", "xlsx", "pptx"], [0.55, 0.24, 0.14, 0.07])
            caption = rr.choice(["Laporan proyek pelatihan", "Template tugas yang sudah diisi", "Presentasi hasil praktik", "Dokumen pendukung tugas"])
        elif frac <= 0.53:
            kind, jenis, owner_type = "CERT", "SERTIFIKAT_PELATIHAN", "UMKM"
            u = rt.umkm[(i * 19) % len(rt.umkm)]
            owner_id, uploader = u.umkm_id, rr.choice(rt.admin_account_ids)
            context_type, context_id = "SERTIFIKAT_PELATIHAN", idf("PDF", 1 + ((i - 1) % n))
            ext, caption = "pdf", "Sertifikat pelatihan digital"
        elif frac <= 0.65:
            kind, jenis, owner_type = "AGREEMENT", "PERJANJIAN_KERJASAMA", "PENGAJUAN_KERJASAMA"
            u = rt.umkm[(i * 23) % len(rt.umkm)]
            owner_id, uploader = idf("PGJ", 1 + ((i - 1) % n)), u.akun_id
            context_type, context_id = "PENGAJUAN_KERJASAMA", owner_id
            ext, caption = "pdf", "Dokumen perjanjian kerja sama bertanda tangan"
        elif frac <= 0.80:
            jenis = weighted_choice(rr, ["KTP", "NIB", "FOTO_PRODUK", "SERTIFIKAT_HALAL", "PIRT", "LOGO"], [0.22, 0.20, 0.25, 0.10, 0.09, 0.14])
            owner_type = "UMKM"
            u = rt.umkm[(i * 29) % len(rt.umkm)]
            owner_id, uploader = u.umkm_id, u.akun_id
            context_type, context_id = "PROFIL_UMKM", owner_id
            ext = "pdf" if jenis in {"KTP", "NIB", "SERTIFIKAT_HALAL", "PIRT"} else rr.choice(["jpg", "jpeg", "png", "webp"])
            caption = rr.choice([f"Dokumen {jenis} untuk profil UMKM", f"Lampiran {jenis} milik UMKM", f"Berkas verifikasi {jenis} untuk usaha"])
        elif frac <= 0.90:
            jenis = weighted_choice(rr, ["KTP", "NIB", "NPWP", "LOGO", "DOKUMEN_PENDUKUNG"], [0.18, 0.22, 0.22, 0.15, 0.23])
            owner_type = "MITRA"
            m = rt.mitra[(i * 31) % len(rt.mitra)]
            owner_id, uploader = m.mitra_id, m.akun_id
            context_type, context_id = "PROFIL_MITRA", owner_id
            ext = "pdf" if jenis in {"KTP", "NIB", "NPWP", "DOKUMEN_PENDUKUNG"} else rr.choice(["jpg", "jpeg", "png", "webp"])
            caption = rr.choice([f"Dokumen {jenis} untuk profil mitra", f"Lampiran {jenis} milik mitra", f"Berkas verifikasi {jenis} untuk mitra"])
        else:
            jenis = weighted_choice(rr, ["PROPOSAL_KERJASAMA", "DOKUMEN_PENDUKUNG", "FOTO_PRODUK", "LOGO"], [0.35, 0.35, 0.20, 0.10])
            owner_type = weighted_choice(rr, ["UMKM", "MITRA", "PENGAJUAN_KERJASAMA"], [0.45, 0.25, 0.30])
            if owner_type == "MITRA":
                m = rt.mitra[(i * 37) % len(rt.mitra)]
                owner_id, uploader = m.mitra_id, m.akun_id
            elif owner_type == "PENGAJUAN_KERJASAMA":
                owner_id, uploader = idf("PGJ", 1 + ((i - 1) % n)), rt.umkm[(i * 41) % len(rt.umkm)].akun_id
            else:
                u = rt.umkm[(i * 43) % len(rt.umkm)]
                owner_id, uploader = u.umkm_id, u.akun_id
            context_type, context_id = owner_type, owner_id
            ext = weighted_choice(rr, ["pdf", "docx", "jpg", "png"], [0.55, 0.18, 0.15, 0.12])
            caption = rr.choice(DOCUMENT_CAPTIONS)

        mime = {
            "pdf": "application/pdf", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp",
        }.get(ext, "application/octet-stream")
        status = weighted_choice(rr, ["UPLOADED", "VALID", "INVALID", "EXPIRED", "REPLACED"], [0.25, 0.58, 0.06, 0.04, 0.07])
        uploaded = dt_between(rr, START, TODAY)
        verified = uploaded + timedelta(days=rr.randint(0, 14), hours=rr.randint(0, 7)) if status in {"VALID", "INVALID"} else None
        expired = uploaded + timedelta(days=365 + rr.randint(0, 365)) if status == "EXPIRED" or jenis in {"KTP", "NIB", "NPWP", "SERTIFIKAT_HALAL", "PIRT"} and rr.random() < 0.07 else None
        slug = safe_slug(caption)
        stored = f"{idf('DOK', i)}_{slug}.{ext}"
        object_key = f"{owner_type.lower()}/{owner_id.lower()}/{stored}"
        checksum = hashlib.sha256(f"{i}|{jenis}|{owner_id}|{uploaded}".encode()).hexdigest()
        size_base = {"pdf": (90_000, 3_800_000), "docx": (45_000, 2_200_000), "xlsx": (30_000, 1_400_000), "pptx": (250_000, 8_000_000), "jpg": (80_000, 2_800_000), "jpeg": (80_000, 2_800_000), "png": (120_000, 3_500_000), "webp": (40_000, 1_400_000)}.get(ext, (40_000, 1_000_000))
        file_size = rr.randint(*size_base)
        metadata = {"source": "synthetic", "generator_version": GENERATOR_VERSION, "doc_kind": jenis}
        yield [idf("DOK", i), jenis, status, uploader, owner_type, owner_id, context_type, context_id, f"{slug}.{ext}", stored, ext, mime, file_size, "umkm-tumbuh-staging", object_key, f"/objects/{object_key}", f"https://storage.umkmtumbuh.local/{object_key}", checksum, f"v{1 + i % 4}", str_bool(jenis in {"LOGO", "FOTO_PRODUK"} and rr.random() < 0.35), str((i % 5) + 1), caption, dt_fmt(uploaded), dt_fmt(verified), dt_fmt(expired), json.dumps(metadata, ensure_ascii=False, separators=(",", ":"))]


def registration_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    """Generate one registration lifecycle row per non-admin account.

    The current schema treats transaksi_registrasipengguna as account-scoped
    registration state. Generating millions of rows here creates duplicate
    akun_id values and can violate a primary/unique key on akun_id. Therefore
    this function intentionally generates exactly:
        len(UMKM accounts) + len(Mitra accounts)
    rows, while large BI volume remains in enrollment, partnership, sales,
    stock, document, and monitoring tables.
    """
    reg_i = 0

    for u in rt.umkm:
        reg_i += 1
        rr = rand_from_seed(args.seed, "registrasi-umkm", reg_i, u.akun_id)
        submit = dt_between(rr, max(START, u.created_at - timedelta(days=15)), min(TODAY - timedelta(days=1), u.created_at + timedelta(days=30)))
        if u.status_umkm_id == "AKTIF":
            status = weighted_choice(rr, ["DISETUJUI", "AKTIF"], [0.55, 0.45])
        elif u.status_umkm_id == "MENUNGGU_VERIFIKASI":
            status = "MENUNGGU"
        elif u.status_umkm_id in {"DITOLAK", "SUSPEND"}:
            status = weighted_choice(rr, ["DITOLAK", "REVISI"], [0.65, 0.35])
        else:
            status = weighted_choice(rr, ["DISETUJUI", "AKTIF", "DINONAKTIFKAN"], [0.30, 0.35, 0.35])
        review = submit + timedelta(hours=rr.randint(4, 96)) if status != "MENUNGGU" else None
        activation = review + timedelta(hours=rr.randint(2, 72)) if status in {"DISETUJUI", "AKTIF"} and review else None
        notes = {
            "MENUNGGU": "Menunggu proses review admin/pemerintah.",
            "DISETUJUI": "Data utama dan dokumen pendukung dinilai memadai.",
            "AKTIF": "Akun sudah aktif setelah verifikasi selesai.",
            "REVISI": rr.choice(["Mohon perbarui dokumen NIB.", "Alamat usaha perlu dilengkapi.", "Foto produk kurang jelas.", "Nomor kontak tidak dapat diverifikasi."]),
            "DITOLAK": rr.choice(["Data tidak sesuai dokumen pendukung.", "Dokumen legalitas tidak valid.", "Profil belum memenuhi kriteria program."]),
            "DINONAKTIFKAN": "Akun dinonaktifkan setelah evaluasi data."
        }[status]
        complete = status in {"DISETUJUI", "AKTIF", "MENUNGGU"} or rr.random() < 0.45
        yield [u.akun_id, u.umkm_id, rr.choice(rt.admin_ids) if review else "", "", status, f"REG-2026-{reg_i:08d}", dt_fmt(submit), dt_fmt(review), dt_fmt(activation), notes, str_bool(complete), dt_fmt(submit - timedelta(minutes=rr.randint(0, 120)))]

    for m in rt.mitra:
        reg_i += 1
        rr = rand_from_seed(args.seed, "registrasi-mitra", reg_i, m.akun_id)
        submit = dt_between(rr, max(START, m.created_at - timedelta(days=15)), min(TODAY - timedelta(days=1), m.created_at + timedelta(days=30)))
        if m.status_mitra_id == "AKTIF":
            status = weighted_choice(rr, ["DISETUJUI", "AKTIF"], [0.52, 0.48])
        elif m.status_mitra_id == "MENUNGGU_VERIFIKASI":
            status = "MENUNGGU"
        elif m.status_mitra_id == "DITOLAK":
            status = "DITOLAK"
        else:
            status = weighted_choice(rr, ["DISETUJUI", "AKTIF", "DINONAKTIFKAN"], [0.30, 0.35, 0.35])
        review = submit + timedelta(hours=rr.randint(4, 96)) if status != "MENUNGGU" else None
        activation = review + timedelta(hours=rr.randint(2, 72)) if status in {"DISETUJUI", "AKTIF"} and review else None
        notes = {
            "MENUNGGU": "Menunggu proses review admin/pemerintah.",
            "DISETUJUI": "Data utama dan dokumen pendukung dinilai memadai.",
            "AKTIF": "Akun sudah aktif setelah verifikasi selesai.",
            "DITOLAK": rr.choice(["Data tidak sesuai dokumen pendukung.", "Dokumen legalitas tidak valid.", "Profil belum memenuhi kriteria program."]),
            "DINONAKTIFKAN": "Akun dinonaktifkan setelah evaluasi data."
        }[status]
        complete = status in {"DISETUJUI", "AKTIF", "MENUNGGU"} or rr.random() < 0.45
        yield [m.akun_id, "", rr.choice(rt.admin_ids) if review else "", m.mitra_id, status, f"REG-2026-{reg_i:08d}", dt_fmt(submit), dt_fmt(review), dt_fmt(activation), notes, str_bool(complete), dt_fmt(submit - timedelta(minutes=rr.randint(0, 120)))]

def enrollment_status_and_progress(rr: random.Random, training: TrainingProfile, date_daftar: datetime) -> Tuple[str, int, int, Optional[datetime], Optional[datetime]]:
    total_modul = training.total_modul
    age_days = max(0, (TODAY - date_daftar).days)
    if training.status_pelatihan_id in {"DRAFT", "CANCELLED"}:
        status = "DIBATALKAN"
        progress = 0
    elif age_days < 2:
        status = weighted_choice(rr, ["TERDAFTAR", "AKTIF"], [0.65, 0.35])
        progress = rr.randint(0, 20)
    else:
        status = weighted_choice(rr, ["AKTIF", "SELESAI", "TIDAK_SELESAI", "KADALUARSA", "DIBATALKAN"], [0.48, 0.34, 0.09, 0.06, 0.03])
        if status == "SELESAI":
            progress = rr.randint(90, 100)
        elif status == "AKTIF":
            progress = min(95, int(rr.triangular(5, 92, min(80, 5 + age_days * 2))))
        elif status == "TIDAK_SELESAI":
            progress = rr.randint(15, 78)
        else:
            progress = rr.randint(0, 45)
    modul_selesai = min(total_modul, int(round(total_modul * progress / 100)))
    selesai_at = date_daftar + timedelta(days=rr.randint(7, 70)) if status == "SELESAI" else None
    last_access = dt_between(rr, date_daftar, TODAY) if status in {"AKTIF", "SELESAI", "TIDAK_SELESAI"} else None
    return status, progress, modul_selesai, selesai_at, last_access



def enrollment_pair_for_index(rt: RuntimeData, args, i: int) -> Tuple[UmkmProfile, TrainingProfile]:
    """Return a unique UMKM-training pair for 1-based enrollment index i.

    This protects schemas that enforce uniqueness on (umkm_id, pelatihan_id).
    The maximum safe enrollment rows are len(rt.umkm) * len(rt.trainings).
    """
    total_capacity = len(rt.umkm) * len(rt.trainings)
    if i < 1 or i > total_capacity:
        raise RuntimeError(
            f"transaction_rows={args.transaction_rows:,} exceeds unique enrollment pair capacity "
            f"{total_capacity:,} (= umkm_rows * pelatihan_rows). Increase --umkm-rows/--pelatihan-rows or lower --transaction-rows."
        )
    idx = i - 1
    batch = idx // len(rt.umkm)
    umkm_idx = (idx + batch * 17) % len(rt.umkm)
    training_idx = batch % len(rt.trainings)
    return rt.umkm[umkm_idx], rt.trainings[training_idx]

def pendaftaran_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for i in range(1, args.transaction_rows + 1):
        rr = rand_from_seed(args.seed, "pendaftaran", i)
        u, training = enrollment_pair_for_index(rt, args, i)
        daftar_upper = max(training.publish_dt + timedelta(days=1), TODAY - timedelta(hours=6))
        daftar = dt_between(rr, max(training.publish_dt, START), daftar_upper)
        status, progress, modul_selesai, selesai_at, last_access = enrollment_status_and_progress(rr, training, daftar)
        akses_mulai = daftar + timedelta(minutes=rr.randint(0, 180))
        akses_akhir = akses_mulai + timedelta(days=rr.choice([30, 60, 90, 180, 365]))
        yield [idf("PDF", i), u.umkm_id, training.pelatihan_id, status, dt_fmt(daftar), dt_fmt(akses_mulai), dt_fmt(akses_akhir), dt_fmt(last_access), progress, modul_selesai, training.total_modul, dt_fmt(selesai_at)]

def submission_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    """Generate assignment submissions linked to the same training as each enrollment.

    This avoids cross-training inconsistencies such as a pendaftaran for PLT001
    referencing an assignment that belongs to PLT099.
    """
    for i in range(1, args.transaction_rows + 1):
        rr = rand_from_seed(args.seed, "submission", i)
        _u, training = enrollment_pair_for_index(rt, args, i)
        assignments = rt.assignments_by_training.get(training.pelatihan_id) or rt.assignments
        assignment = assignments[(i - 1) % len(assignments)]
        pendaftaran_id = idf("PDF", i)
        status = weighted_choice(rr, ["BELUM_SUBMIT", "SUBMITTED", "REVIEW", "REVISI", "DITERIMA", "DITOLAK"], [0.14, 0.24, 0.14, 0.13, 0.30, 0.05])
        submitted = None if status == "BELUM_SUBMIT" else dt_between(rr, START + timedelta(days=3), TODAY)
        reviewed = submitted + timedelta(hours=rr.randint(6, 120)) if submitted and status in {"REVISI", "DITERIMA", "DITOLAK"} else None
        dok = "" if status == "BELUM_SUBMIT" else document_id_for(i, "TASK", args)
        link = ""
        if status != "BELUM_SUBMIT" and rr.random() < 0.28:
            link = rr.choice([
                f"https://drive.google.com/file/d/synthetic-{i:08d}",
                f"https://www.canva.com/design/synthetic-{i:08d}",
                f"https://marketplace.example.com/store/umkm-{(i % len(rt.umkm)) + 1}",
            ])
        yield [pendaftaran_id, assignment.assignment_id, status, dok, link, dt_fmt(submitted), dt_fmt(reviewed)]

def certificate_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for i in range(1, args.transaction_rows + 1):
        rr = rand_from_seed(args.seed, "sertifikat", i)
        status = weighted_choice(rr, ["BELUM_TERBIT", "DIAJUKAN", "TERBIT", "DITOLAK", "DIBATALKAN"], [0.30, 0.16, 0.45, 0.06, 0.03])
        pengajuan = dt_between(rr, START + timedelta(days=20), TODAY) if status != "BELUM_TERBIT" else None
        terbit = pengajuan + timedelta(days=rr.randint(1, 14)) if status == "TERBIT" and pengajuan else None
        dok = document_id_for(i, "CERT", args) if status == "TERBIT" else ""
        nomor = f"SERT/UMKMT/{TODAY.year}/{i:08d}" if status == "TERBIT" else ""
        catatan = {
            "BELUM_TERBIT": "Peserta belum memenuhi seluruh syarat penerbitan sertifikat.",
            "DIAJUKAN": "Sertifikat sedang diajukan untuk verifikasi admin.",
            "TERBIT": "Sertifikat telah diterbitkan secara digital.",
            "DITOLAK": rr.choice(["Progress pelatihan belum mencapai syarat minimal.", "Tugas proyek belum diterima.", "Data peserta perlu diperbaiki."]),
            "DIBATALKAN": "Pengajuan sertifikat dibatalkan oleh sistem atau admin.",
        }[status]
        yield [idf("PDF", 1 + ((i - 1) % args.transaction_rows)), status, dok, nomor, dt_fmt(pengajuan), dt_fmt(terbit), rr.choice(rt.admin_ids) if status in {"TERBIT", "DITOLAK", "DIBATALKAN"} else "", catatan]


def compatible_mitra_for_umkm(rt: RuntimeData, u: UmkmProfile, rr: random.Random) -> MitraProfile:
    needs = CATEGORY_PROFILES[u.category]["support_needs"]
    candidates = [m for m in rt.mitra if m.verified and any(field in m.fields or sup in m.supports for field in needs for sup in [field])]
    if not candidates:
        candidates = [m for m in rt.mitra if m.verified] or rt.mitra
    return rr.choice(candidates)


def partnership_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    """Generate partnership requests with unique UMKM-Mitra pairs.

    This protects schemas that enforce one active/proposal row per pair or have
    unique constraints around pengajuan_id plus pair lifecycle.
    """
    pair_capacity = len(rt.umkm) * len(rt.mitra)
    if args.transaction_rows > pair_capacity:
        raise RuntimeError(
            f"transaction_rows={args.transaction_rows:,} exceeds unique partnership pair capacity "
            f"{pair_capacity:,} (= umkm_rows * mitra_rows). Increase --umkm-rows/--mitra-rows or lower --transaction-rows."
        )

    for i in range(1, args.transaction_rows + 1):
        rr = rand_from_seed(args.seed, "kerjasama", i)
        idx = i - 1
        batch = idx // len(rt.umkm)
        u = rt.umkm[(idx + batch * 17) % len(rt.umkm)]
        m = rt.mitra[batch % len(rt.mitra)]
        direction_umkm_to_mitra = rr.random() < 0.72
        if direction_umkm_to_mitra:
            pengaju_akun, penerima_akun = u.akun_id, m.akun_id
            opener = u.nama_umkm
        else:
            pengaju_akun, penerima_akun = m.akun_id, u.akun_id
            opener = m.nama_mitra
        status = weighted_choice(rr, ["DIAJUKAN", "DITINJAU", "DITOLAK", "MENUNGGU_DOKUMEN_TTD", "AKTIF", "SELESAI", "DIBATALKAN"], [0.16, 0.12, 0.10, 0.08, 0.36, 0.14, 0.04])
        created = dt_between(rr, START + timedelta(days=30), TODAY - timedelta(days=1))
        decision = created + timedelta(days=rr.randint(1, 21)) if status not in {"DIAJUKAN", "DITINJAU"} else None
        upload_doc = decision + timedelta(days=rr.randint(1, 10)) if status in {"AKTIF", "SELESAI", "MENUNGGU_DOKUMEN_TTD"} and decision else None
        start_ks = upload_doc + timedelta(days=rr.randint(0, 14)) if status in {"AKTIF", "SELESAI"} and upload_doc else None
        end_ks = start_ks + timedelta(days=rr.choice([90, 120, 180, 365])) if start_ks else None
        if status == "SELESAI" and end_ks and end_ks > TODAY:
            end_ks = created + timedelta(days=rr.randint(60, 180))
        agreement = document_id_for(i, "AGREEMENT", args) if status in {"AKTIF", "SELESAI", "MENUNGGU_DOKUMEN_TTD"} else ""
        needs = CATEGORY_PROFILES[u.category]["support_needs"]
        need = rr.choice(needs)
        message = rr.choice(PARTNERSHIP_MESSAGE_TEMPLATES).format(opener=opener, need=need.lower(), product=u.produk_utama.lower())
        decision_note = {
            "DIAJUKAN": "",
            "DITINJAU": "Pengajuan sedang ditelaah oleh penerima.",
            "DITOLAK": rr.choice(["Kebutuhan belum sesuai program mitra saat ini.", "Dokumen dan ruang lingkup perlu disesuaikan terlebih dahulu.", "Kuota program kemitraan periode ini sudah terpenuhi."]),
            "MENUNGGU_DOKUMEN_TTD": "Pengajuan disetujui, menunggu dokumen perjanjian ditandatangani.",
            "AKTIF": "Kerja sama aktif berdasarkan dokumen perjanjian yang sudah diunggah.",
            "SELESAI": "Kerja sama telah selesai sesuai periode perjanjian.",
            "DIBATALKAN": "Pengajuan dibatalkan sebelum kerja sama aktif.",
        }[status]
        yield [idf("PGJ", i), f"PKS-2026-{i:08d}", u.umkm_id, m.mitra_id, pengaju_akun, penerima_akun, status, message, decision_note, agreement, dt_fmt(created), dt_fmt(decision), dt_fmt(upload_doc), date_fmt(start_ks), date_fmt(end_ks), dt_fmt(created), dt_fmt(max([d for d in [created, decision, upload_doc] if d is not None]))]

def monitoring_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    for i in range(1, args.transaction_rows + 1):
        # One row per UMKM per synthetic day. This guarantees unique
        # (umkm_id, created_at) if that constraint exists.
        idx = i - 1
        u = rt.umkm[idx % len(rt.umkm)]
        day_index = idx // len(rt.umkm)
        rr = rand_from_seed(args.seed, "monitoring", u.umkm_id, day_index)
        cur_dt = TODAY - timedelta(days=day_index)
        weekday_factor = 1.18 if cur_dt.weekday() >= 5 and u.category in {"KULINER", "PERDAGANGAN", "FASHION"} else 1.0
        seasonal = 1.0 + 0.20 * math.sin((cur_dt.timetuple().tm_yday / 365.0) * 2 * math.pi)
        trend = 1.0 + min(0.55, max(-0.35, ((cur_dt - u.created_at).days / 900) * rr.uniform(0.02, 0.22)))
        noise = rr.lognormvariate(0, 0.22)
        profit = money_round(u.base_daily_profit * weekday_factor * seasonal * trend * noise, 1000)
        if u.status_umkm_id in {"NONAKTIF", "SUSPEND"}:
            profit = int(profit * rr.uniform(0.05, 0.35))
        if profit < 20_000:
            status = "BERISIKO"
        elif profit > u.base_daily_profit * 1.35:
            status = weighted_choice(rr, ["NAIK", "EKSPANSI", "STABIL"], [0.62, 0.18, 0.20])
        elif profit < u.base_daily_profit * 0.72:
            status = weighted_choice(rr, ["TURUN", "BERISIKO", "STABIL"], [0.55, 0.20, 0.25])
        else:
            status = "STABIL"
        product_count = max(1, int(round(u.product_count + rr.choice([-1, 0, 0, 0, 1, 1]) + (0.5 if status == "EKSPANSI" else 0))))
        yield [u.umkm_id, status, profit, product_count, dt_fmt(cur_dt)]


# -----------------------------------------------------------------------------
# Sales and stock transaction generators.
# -----------------------------------------------------------------------------
def _active_product_rows(rt: RuntimeData) -> List[List[str]]:
    # After v2.3 product columns are:
    # 0 produk_id, 1 umkm_id, 2 kategori_produk_id, 3 nama_produk, 4 deskripsi,
    # 5 harga, 6 stok_saat_ini, 7 status_produk, 8 legalitas, ...
    active = [p for p in rt.product_rows if len(p) > 7 and p[7] == "AKTIF"]
    return active or rt.product_rows


def _umkm_account_map(rt: RuntimeData) -> Dict[str, str]:
    return {u.umkm_id: u.akun_id for u in rt.umkm}


def _sale_components(rt: RuntimeData, args, i: int, active_products: Optional[List[List[str]]] = None):
    """Deterministic sale components shared by header and item generators."""
    rr = rand_from_seed(args.seed, "sales", i)
    products = active_products if active_products is not None else _active_product_rows(rt)
    p = products[(i * 37 + rr.randint(0, max(0, len(products) - 1))) % len(products)]
    produk_id = p[0]
    umkm_id = p[1]
    nama_produk = p[3]
    harga = int(float(p[5]))
    # Higher-price goods have lower quantities; low-price retail/snack products can sell more units.
    if harga <= 25_000:
        qty = rr.randint(1, 12)
    elif harga <= 100_000:
        qty = rr.randint(1, 7)
    elif harga <= 500_000:
        qty = rr.randint(1, 4)
    else:
        qty = rr.randint(1, 2)
    # Add occasional wholesale/order quantity, but keep it realistic.
    if rr.random() < 0.045:
        qty *= rr.choice([2, 3, 5])
    subtotal = harga * qty
    margin_rate = rr.uniform(0.18, 0.52)
    laba = money_round(subtotal * margin_rate, 100)
    if laba >= subtotal:
        laba = max(0, subtotal - 100)
    tanggal = dt_between(rr, START + timedelta(days=20), TODAY)
    status = weighted_choice(rr, ["FINAL", "DRAFT", "CANCELLED"], [0.90, 0.04, 0.06])
    return p, produk_id, umkm_id, nama_produk, harga, qty, subtotal, laba, tanggal, status


def sales_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    products = _active_product_rows(rt)
    account_by_umkm = _umkm_account_map(rt)
    notes = [
        "Penjualan harian dari kanal offline dan/atau online.",
        "Transaksi final dari rekap UMKM.",
        "Penjualan produk utama dan produk pendukung.",
        "Rekap transaksi penjualan untuk analisis omzet.",
        "Data penjualan masuk dari pencatatan operasional UMKM.",
    ]
    for i in range(1, args.transaction_rows + 1):
        rr = rand_from_seed(args.seed, "sales-row", i)
        _p, _produk_id, umkm_id, _nama_produk, _harga, qty, omzet, laba, tanggal, status = _sale_components(rt, args, i, products)
        # Keep cancelled transactions analytically visible; values are retained and status marks cancellation.
        created_at = tanggal + timedelta(hours=rr.randint(0, 18), minutes=rr.randint(0, 59))
        updated_at = created_at + timedelta(minutes=rr.randint(0, 240)) if status != "FINAL" else created_at
        yield [
            idf("PJL", i),
            umkm_id,
            date_fmt(tanggal),
            f"SALE-{tanggal.year}-{i:08d}",
            omzet,
            laba,
            qty,
            rr.choice(notes),
            status,
            account_by_umkm.get(umkm_id, ""),
            dt_fmt(created_at),
            dt_fmt(updated_at),
        ]


def sales_item_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    products = _active_product_rows(rt)
    for i in range(1, args.transaction_rows + 1):
        _p, produk_id, _umkm_id, nama_produk, harga, qty, _subtotal, _laba, tanggal, _status = _sale_components(rt, args, i, products)
        created_at = tanggal + timedelta(hours=rand_from_seed(args.seed, "sales-item-created", i).randint(0, 18))
        yield [
            idf("PJI", i),
            idf("PJL", i),
            produk_id,
            nama_produk,
            harga,
            qty,
            dt_fmt(created_at),
        ]


def stock_rows(rt: RuntimeData, args) -> Iterator[List[object]]:
    products = _active_product_rows(rt)
    account_by_umkm = _umkm_account_map(rt)
    for i in range(1, args.transaction_rows + 1):
        rr = rand_from_seed(args.seed, "stock", i)
        tipe = weighted_choice(rr, ["SALE", "RESTOCK", "ADJUSTMENT", "CANCEL_SALE"], [0.58, 0.25, 0.12, 0.05])
        if tipe in {"SALE", "CANCEL_SALE"}:
            p, produk_id, umkm_id, nama_produk, _harga, sale_qty, _subtotal, _laba, sale_dt, _status = _sale_components(rt, args, i, products)
            created_at = sale_dt + timedelta(hours=rr.randint(0, 20), minutes=rr.randint(0, 59))
            referensi_tipe = "PENJUALAN"
            referensi_id = idf("PJL", i)
            qty = max(1, sale_qty)
        else:
            p = products[(i * 41 + rr.randint(0, max(0, len(products) - 1))) % len(products)]
            produk_id = p[0]
            umkm_id = p[1]
            nama_produk = p[3]
            created_at = dt_between(rr, START + timedelta(days=20), TODAY)
            referensi_tipe = "PEMBELIAN_STOK" if tipe == "RESTOCK" else "KOREKSI_STOK"
            referensi_id = "" if tipe == "ADJUSTMENT" else f"RST-{i:08d}"
            qty = rr.randint(4, 180) if tipe == "RESTOCK" else rr.randint(1, 40)
        # Pseudo stock snapshot. It is row-coherent and non-negative, but intentionally not
        # an expensive global cumulative stock simulation for millions of rows.
        product_stock = int(float(p[6])) if len(p) > 6 and str(p[6]).strip() else 0
        base_stock = max(0, int(product_stock + rr.randint(-25, 75)))
        if tipe == "SALE":
            stok_sebelum = max(qty, base_stock)
            jumlah_perubahan = -qty
            stok_sesudah = stok_sebelum - qty
            catatan = f"Pengurangan stok karena penjualan {nama_produk}."
        elif tipe == "CANCEL_SALE":
            stok_sebelum = base_stock
            jumlah_perubahan = qty
            stok_sesudah = stok_sebelum + qty
            catatan = f"Stok kembali karena pembatalan penjualan {nama_produk}."
        elif tipe == "RESTOCK":
            stok_sebelum = base_stock
            jumlah_perubahan = qty
            stok_sesudah = stok_sebelum + qty
            catatan = f"Restock produk {nama_produk} dari produksi/pembelian baru."
        else:
            signed_qty = qty if rr.random() < 0.55 else -qty
            stok_sebelum = max(abs(signed_qty), base_stock)
            jumlah_perubahan = signed_qty
            stok_sesudah = stok_sebelum + signed_qty
            if stok_sesudah < 0:
                stok_sesudah = 0
                jumlah_perubahan = stok_sesudah - stok_sebelum
            catatan = f"Penyesuaian stok hasil stock opname untuk {nama_produk}."
        yield [
            idf("STK", i),
            produk_id,
            umkm_id,
            tipe,
            jumlah_perubahan,
            stok_sebelum,
            stok_sesudah,
            referensi_tipe,
            referensi_id,
            catatan,
            account_by_umkm.get(umkm_id, ""),
            dt_fmt(created_at),
        ]


# -----------------------------------------------------------------------------
# Main generation flow.
# -----------------------------------------------------------------------------
def write_all(sink: CsvSink, rt: RuntimeData, args):
    # Reference tables.
    for table in IMPORT_ORDER:
        if table in REFERENCE_TABLES:
            header, rows = REFERENCE_TABLES[table]
            write_table(sink, rt, table, header, rows, progress_every=0)
        elif table == "ref_dimwaktu":
            write_table(sink, rt, table, TABLE_HEADERS[table], ref_dimwaktu_rows(), progress_every=0)
        elif table == "master_akunpengguna":
            write_table(sink, rt, table, TABLE_HEADERS[table], account_rows(rt, args), progress_every=0)
        elif table == "master_lokasi":
            write_table(sink, rt, table, TABLE_HEADERS[table], location_rows(args), progress_every=0)
        elif table == "master_pelakuumkm":
            write_table(sink, rt, table, TABLE_HEADERS[table], pelaku_rows(rt, args), progress_every=0)
        elif table == "master_umkm":
            write_table(sink, rt, table, TABLE_HEADERS[table], umkm_rows(rt, args), progress_every=0)
        elif table == "master_produkumkm":
            write_table(sink, rt, table, TABLE_HEADERS[table], product_rows(rt), progress_every=0)
        elif table == "master_mitra":
            write_table(sink, rt, table, TABLE_HEADERS[table], mitra_rows(rt, args), progress_every=0)
        elif table == "master_mitrabidangkemitraan":
            write_table(sink, rt, table, TABLE_HEADERS[table], mitra_bidang_rows(rt, args), progress_every=0)
        elif table == "master_mitrabentukdukungan":
            write_table(sink, rt, table, TABLE_HEADERS[table], mitra_bentuk_rows(rt, args), progress_every=0)
        elif table == "master_programpelatihan":
            write_table(sink, rt, table, TABLE_HEADERS[table], training_rows(rt, args), progress_every=0)
        elif table == "master_modulpelatihan":
            write_table(sink, rt, table, TABLE_HEADERS[table], module_rows(rt, args), progress_every=0)
        elif table == "master_assignmentpelatihan":
            write_table(sink, rt, table, TABLE_HEADERS[table], assignment_rows(rt, args), progress_every=0)
        elif table == "master_admin":
            write_table(sink, rt, table, TABLE_HEADERS[table], admin_rows(rt, args), progress_every=0)
        elif table == "transaksi_dokumenterunggah":
            write_table(sink, rt, table, TABLE_HEADERS[table], document_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_registrasipengguna":
            write_table(sink, rt, table, TABLE_HEADERS[table], registration_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_pendaftaranpelatihan":
            write_table(sink, rt, table, TABLE_HEADERS[table], pendaftaran_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_submissionassignment":
            write_table(sink, rt, table, TABLE_HEADERS[table], submission_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_sertifikatpelatihan":
            write_table(sink, rt, table, TABLE_HEADERS[table], certificate_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_pengajuankerjasama":
            write_table(sink, rt, table, TABLE_HEADERS[table], partnership_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_penjualan":
            write_table(sink, rt, table, TABLE_HEADERS[table], sales_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_penjualan_item":
            write_table(sink, rt, table, TABLE_HEADERS[table], sales_item_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_stokproduk":
            write_table(sink, rt, table, TABLE_HEADERS[table], stock_rows(rt, args), progress_every=args.progress_every)
        elif table == "transaksi_monitoringperkembangan":
            write_table(sink, rt, table, TABLE_HEADERS[table], monitoring_rows(rt, args), progress_every=args.progress_every)
        else:
            raise RuntimeError(f"No generator configured for table: {table}")

    if not args.skip_credentials_file:
        # Non-schema helper file for staging login tests. Do not import into PostgreSQL.
        buf = io.StringIO()
        writer = csv.writer(buf, lineterminator="\n")
        writer.writerow(["akun_id", "peran_id", "nama_lengkap", "email", "plaintext_password", "password_hash_algo"])
        for row in credential_rows(args):
            writer.writerow([clean_csv_value(v) for v in row])
        sink.write_text("metadata/generated_credentials.csv", buf.getvalue())

    sink.write_text("import_order.txt", "\n".join(f"csv/{t}.csv" for t in IMPORT_ORDER) + "\n")
    sink.write_text("manifest.json", json.dumps({
        "schema": SCHEMA_NAME,
        "generator_version": GENERATOR_VERSION,
        "seed": args.seed,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_rows_per_transaction_table": args.transaction_rows,
        "master_rows": {
            "admin": args.admin_rows,
            "umkm": args.umkm_rows,
            "mitra": args.mitra_rows,
            "lokasi": args.lokasi_rows,
            "pelatihan": args.pelatihan_rows,
            "produkumkm": len(rt.product_rows),
            "modulpelatihan": sum(rt.modules_by_training.values()),
            "assignmentpelatihan": len(rt.assignments),
        },
        "business_rules": [
            "master_programpelatihan.harga is always 0",
            "master_produkumkm.stok_saat_ini is generated for stock analysis",
            "sales, sales item, and stock mutation transaction tables are generated for BI/warehouse analysis",
            "assignments are file-upload/project/report/presentation based only",
            "status and date fields are lifecycle-aware",
            "UMKM category influences products, prices, documents, training choices, partnerships, and monitoring trends",
            "v2.1 adds wider variation in locations, streets, email patterns, phone/NIK/NIB generation, business descriptions, documents, and training text",
            "v2.2 generates varied per-account plaintext passwords and password_hash values; staging plaintext credentials are written to metadata/generated_credentials.csv unless disabled",
        ],
        "password_generation": {
            "password_mode": args.password_mode,
            "password_hash_algo": args.password_hash_algo,
            "credentials_file": None if args.skip_credentials_file else "metadata/generated_credentials.csv",
            "bcrypt_note": "Use --password-hash-algo bcrypt only if your app expects bcrypt and the Python bcrypt package is installed.",
        },
        "tables": rt.manifest,
    }, ensure_ascii=False, indent=2))
    sink.write_text("README.txt", README_TEXT)

README_TEXT = f"""UMKM TUMBUH Mandat synthetic dataset generator output

Schema target: {SCHEMA_NAME}
Generator version: {GENERATOR_VERSION}

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
"""


def positive_int(value: str) -> int:
    try:
        ivalue = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"invalid int value: {value}") from exc
    if ivalue < 1:
        raise argparse.ArgumentTypeError("value must be positive")
    return ivalue


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate synthetic CSV data for UMKM TUMBUH Mandat schema.")
    p.add_argument("--transaction-rows", type=positive_int, default=2_000_000, help="Rows for each transaction table. Default: 2,000,000")
    p.add_argument("--out-dir", type=Path, default=None, help="Directory output. Creates csv/*.csv plus manifest files.")
    p.add_argument("--zip", dest="zip_path", type=Path, default=None, help="Optional ZIP output path containing csv/*.csv.")
    p.add_argument("--compresslevel", type=int, default=1, choices=range(0, 10), help="ZIP compression level 0-9. Use 1 for speed, 0 for no compression. Default: 1")
    p.add_argument("--seed", type=int, default=DEFAULT_SEED, help=f"Random seed. Default: {DEFAULT_SEED}")
    p.add_argument("--admin-rows", type=positive_int, default=DEFAULT_ADMIN_ROWS, help=f"Number of admin master rows. Default: {DEFAULT_ADMIN_ROWS}")
    p.add_argument("--umkm-rows", type=positive_int, default=DEFAULT_UMKM_ROWS, help=f"Number of UMKM master rows. Default: {DEFAULT_UMKM_ROWS}")
    p.add_argument("--mitra-rows", type=positive_int, default=DEFAULT_MITRA_ROWS, help=f"Number of mitra master rows. Default: {DEFAULT_MITRA_ROWS}")
    p.add_argument("--pelatihan-rows", type=positive_int, default=DEFAULT_PELATIHAN_ROWS, help=f"Number of training program rows. Default: {DEFAULT_PELATIHAN_ROWS}")
    p.add_argument("--lokasi-rows", type=positive_int, default=DEFAULT_LOKASI_ROWS, help=f"Number of location rows. Default: {DEFAULT_LOKASI_ROWS}")
    p.add_argument("--min-products-per-umkm", type=positive_int, default=DEFAULT_MIN_PRODUCTS_PER_UMKM)
    p.add_argument("--max-products-per-umkm", type=positive_int, default=DEFAULT_MAX_PRODUCTS_PER_UMKM)
    p.add_argument("--progress-every", type=positive_int, default=500_000, help="Print progress every N rows for transaction tables.")
    p.add_argument("--excel-safe-identifiers", action="store_true", help="For Excel preview only: wrap NIK/NIB/phone/email-like cells as Excel text formulas. Do not use this for PostgreSQL COPY import.")
    p.add_argument("--password-mode", choices=["random", "shared"], default="shared", help="Password plaintext generation mode. random = unique varied password per account; shared = all accounts use --shared-password. Default: shared")
    p.add_argument("--shared-password", default="password123", help="Used only with --password-mode shared. Default: password123")
    p.add_argument("--password-hash-algo", choices=["sha256", "pbkdf2", "bcrypt", "constant"], default="bcrypt", help="Password hash algorithm for master_akunpengguna.password_hash. Default: bcrypt because current auth-service verifies bcrypt hashes.")
    p.add_argument("--pbkdf2-iterations", type=positive_int, default=50_000, help="Iterations for --password-hash-algo pbkdf2. Default: 50,000")
    p.add_argument("--bcrypt-rounds", type=int, default=10, choices=range(4, 16), help="Cost factor for --password-hash-algo bcrypt. Default: 10")
    p.add_argument("--skip-credentials-file", action="store_true", help="Do not write metadata/generated_credentials.csv with staging plaintext passwords.")
    p.add_argument("--overwrite", action="store_true", help="Allow deleting existing output directory or replacing zip file.")
    args = p.parse_args()
    if args.out_dir is None and args.zip_path is None:
        args.out_dir = Path("UMKM_TUMBUH_Mandat_csv")
    if args.min_products_per_umkm > args.max_products_per_umkm:
        p.error("--min-products-per-umkm must be <= --max-products-per-umkm")
    return args



def validate_generation_plan(rt: RuntimeData, args) -> None:
    """Fail fast before writing large CSVs if requested row counts cannot be key-safe."""
    enrollment_capacity = len(rt.umkm) * len(rt.trainings)
    partnership_capacity = len(rt.umkm) * len(rt.mitra)

    if args.transaction_rows > enrollment_capacity:
        raise SystemExit(
            f"ERROR: --transaction-rows {args.transaction_rows:,} exceeds unique training enrollment capacity "
            f"{enrollment_capacity:,} (= --umkm-rows * --pelatihan-rows)."
        )

    if args.transaction_rows > partnership_capacity:
        raise SystemExit(
            f"ERROR: --transaction-rows {args.transaction_rows:,} exceeds unique UMKM-Mitra partnership pair capacity "
            f"{partnership_capacity:,} (= --umkm-rows * --mitra-rows)."
        )

    if not rt.product_rows:
        raise SystemExit("ERROR: product generation produced zero rows.")

    # Schema-first expectation: master_produkumkm includes stok_saat_ini.
    expected_product_columns = len(TABLE_HEADERS["master_produkumkm"])
    bad_product_rows = [idx for idx, row in enumerate(rt.product_rows[:1000], 1) if len(row) != expected_product_columns]
    if bad_product_rows:
        raise SystemExit(
            f"ERROR: master_produkumkm row has wrong column count. Expected {expected_product_columns}; "
            f"first bad sampled row index: {bad_product_rows[0]}."
        )

    print(
        "Validation ready: "
        f"enrollment capacity={enrollment_capacity:,}, partnership capacity={partnership_capacity:,}, "
        f"transaction_rows={args.transaction_rows:,}.",
        flush=True,
    )

def main():
    args = parse_args()
    global EXCEL_SAFE_IDENTIFIERS
    EXCEL_SAFE_IDENTIFIERS = bool(args.excel_safe_identifiers)
    if args.out_dir and args.out_dir.exists() and args.overwrite:
        shutil.rmtree(args.out_dir)
    elif args.out_dir and args.out_dir.exists() and any(args.out_dir.iterdir()):
        raise SystemExit(f"Output directory already exists and is not empty: {args.out_dir}. Use --overwrite.")
    if args.zip_path and args.zip_path.exists():
        if args.overwrite:
            args.zip_path.unlink()
        else:
            raise SystemExit(f"ZIP already exists: {args.zip_path}. Use --overwrite.")

    print(f"Building runtime data with seed={args.seed}...", flush=True)
    rt = build_runtime(args)
    validate_generation_plan(rt, args)
    print(
        f"Runtime ready: {len(rt.umkm):,} UMKM, {len(rt.mitra):,} mitra, {len(rt.product_rows):,} products, "
        f"{len(rt.trainings):,} trainings, {len(rt.assignments):,} assignments.",
        flush=True,
    )
    sink = CsvSink(args.out_dir, args.zip_path, args.compresslevel)
    try:
        write_all(sink, rt, args)
    finally:
        sink.close()
    print("Generation completed.", flush=True)
    if args.out_dir:
        print(f"Output directory: {args.out_dir.resolve()}", flush=True)
    if args.zip_path:
        print(f"ZIP file: {args.zip_path.resolve()}", flush=True)


if __name__ == "__main__":
    main()
