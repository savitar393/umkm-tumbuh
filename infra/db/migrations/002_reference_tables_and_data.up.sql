-- +goose Up

-- Reference tables
-- ============================================================

CREATE TABLE ref.ref_peranpengguna (
    peran_id VARCHAR(30) PRIMARY KEY,
    nama_peran VARCHAR(100) NOT NULL UNIQUE,
    CONSTRAINT ck_ref_peranpengguna_id CHECK (peran_id = upper(peran_id))
);

CREATE TABLE ref.ref_jenisumkm (
    jenis_umkm_id VARCHAR(30) PRIMARY KEY,
    nama_jenis_umkm VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT ck_ref_jenisumkm_id CHECK (jenis_umkm_id = upper(jenis_umkm_id))
);

CREATE TABLE ref.ref_skalausaha (
    skala_usaha_id VARCHAR(30) PRIMARY KEY,
    nama_skala_usaha VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT ck_ref_skalausaha_id CHECK (skala_usaha_id = upper(skala_usaha_id))
);

CREATE TABLE ref.ref_kategoriusaha (
    kategori_usaha_id VARCHAR(30) PRIMARY KEY,
    nama_kategori_usaha VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_kategoriproduk (
    kategori_produk_id VARCHAR(30) PRIMARY KEY,
    nama_kategori_produk VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statusumkm (
    status_umkm_id VARCHAR(30) PRIMARY KEY,
    nama_status_umkm VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_jenismitra (
    jenis_mitra_id VARCHAR(30) PRIMARY KEY,
    nama_jenis_mitra VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statusmitra (
    status_mitra_id VARCHAR(30) PRIMARY KEY,
    nama_status_mitra VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_bidangkemitraan (
    bidang_kemitraan_id VARCHAR(30) PRIMARY KEY,
    nama_bidang_kemitraan VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_bentukdukungan (
    bentuk_dukungan_id VARCHAR(30) PRIMARY KEY,
    nama_bentuk_dukungan VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_skalakerjasama (
    skala_kerjasama_id VARCHAR(30) PRIMARY KEY,
    nama_skala_kerjasama VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_jenispelatihan (
    jenis_pelatihan_id VARCHAR(30) PRIMARY KEY,
    nama_jenis_pelatihan VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statuspelatihan (
    status_pelatihan_id VARCHAR(30) PRIMARY KEY,
    nama_status_pelatihan VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statuspendaftaranpelatihan (
    status_pendaftaran_pelatihan_id VARCHAR(30) PRIMARY KEY,
    nama_status_pendaftaran VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statussubmission (
    status_submission_id VARCHAR(30) PRIMARY KEY,
    nama_status_submission VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statussertifikat (
    status_sertifikat_id VARCHAR(30) PRIMARY KEY,
    nama_status_sertifikat VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statuspengajuan (
    status_pengajuan_id VARCHAR(40) PRIMARY KEY,
    nama_status_pengajuan VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statusperkembangan (
    status_perkembangan_id VARCHAR(30) PRIMARY KEY,
    nama_status_perkembangan VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statusverifikasi (
    status_verifikasi_id VARCHAR(30) PRIMARY KEY,
    nama_status_verifikasi VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_statusdokumen (
    status_dokumen_id VARCHAR(30) PRIMARY KEY,
    nama_status_dokumen VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ref.ref_jenisdokumen (
    jenis_dokumen_id VARCHAR(40) PRIMARY KEY,
    nama_jenis_dokumen VARCHAR(150) NOT NULL UNIQUE,
    deskripsi TEXT,
    allowed_extensions TEXT NOT NULL,
    max_size_mb INTEGER NOT NULL CHECK (max_size_mb > 0),
    wajib_umkm BOOLEAN NOT NULL DEFAULT FALSE,
    wajib_mitra BOOLEAN NOT NULL DEFAULT FALSE,
    wajib_pengajuan_kemitraan BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE ref.ref_dimwaktu (
    tanggal DATE PRIMARY KEY,
    hari SMALLINT NOT NULL CHECK (hari BETWEEN 1 AND 31),
    minggu_ke SMALLINT NOT NULL CHECK (minggu_ke BETWEEN 1 AND 53),
    minggu_bulan SMALLINT NOT NULL CHECK (minggu_bulan BETWEEN 1 AND 6),
    tanggal_awal_minggu DATE NOT NULL,
    tanggal_akhir_minggu DATE NOT NULL,
    bulan SMALLINT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    nama_bulan VARCHAR(20) NOT NULL,
    kuartal SMALLINT NOT NULL CHECK (kuartal BETWEEN 1 AND 4),
    tahun SMALLINT NOT NULL CHECK (tahun BETWEEN 2000 AND 2100),
    is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_ref_dimwaktu_week_range CHECK (tanggal_awal_minggu <= tanggal AND tanggal <= tanggal_akhir_minggu)
);

-- ============================================================
