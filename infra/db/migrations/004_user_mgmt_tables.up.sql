-- +goose Up

-- User management service tables
-- ============================================================

CREATE TABLE user_mgmt.master_lokasi (
    lokasi_id VARCHAR(30) PRIMARY KEY,
    provinsi VARCHAR(100) NOT NULL,
    kabupaten_kota VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    kelurahan VARCHAR(100) NOT NULL,
    kode_pos VARCHAR(10),
    alamat_detail TEXT NOT NULL,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_master_lokasi_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_master_lokasi_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE user_mgmt.master_pelakuumkm (
    pelaku_umkm_id VARCHAR(30) PRIMARY KEY,
    akun_id VARCHAR(30) NOT NULL UNIQUE REFERENCES auth.master_akunpengguna(akun_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    nama_pelaku VARCHAR(150) NOT NULL,
    nik VARCHAR(20) NOT NULL UNIQUE,
    no_hp VARCHAR(20) NOT NULL,
    email CITEXT NOT NULL,
    alamat TEXT,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_master_pelakuumkm_nik CHECK (nik ~ '^[0-9]{16}$'),
    CONSTRAINT ck_master_pelakuumkm_deleted CHECK ((is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE))
);

CREATE TABLE user_mgmt.master_umkm (
    umkm_id VARCHAR(30) PRIMARY KEY,
    kode_umkm VARCHAR(50) NOT NULL UNIQUE,
    pelaku_umkm_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_pelakuumkm(pelaku_umkm_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    diverifikasi_oleh_admin_id VARCHAR(30) REFERENCES auth.master_admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE,
    lokasi_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_lokasi(lokasi_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    jenis_umkm_id VARCHAR(30) NOT NULL REFERENCES ref.ref_jenisumkm(jenis_umkm_id) ON UPDATE CASCADE,
    skala_usaha_id VARCHAR(30) NOT NULL REFERENCES ref.ref_skalausaha(skala_usaha_id) ON UPDATE CASCADE,
    kategori_usaha_id VARCHAR(30) NOT NULL REFERENCES ref.ref_kategoriusaha(kategori_usaha_id) ON UPDATE CASCADE,
    status_umkm_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statusumkm(status_umkm_id) ON UPDATE CASCADE,
    nama_umkm VARCHAR(150) NOT NULL,
    nib VARCHAR(30),
    deskripsi_usaha TEXT,
    produk_utama VARCHAR(150),
    tahun_berdiri SMALLINT CHECK (tahun_berdiri BETWEEN 1900 AND 2100),
    nomor_whatsapp VARCHAR(20),
    email_bisnis CITEXT,
    jam_operasional VARCHAR(150),
    media_sosial_marketplace TEXT,
    logo_url TEXT,
    foto_cover_url TEXT,
    status_verified BOOLEAN NOT NULL DEFAULT FALSE,
    tanggal_terdaftar DATE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_master_umkm_nib UNIQUE (nib),
    CONSTRAINT ck_master_umkm_nib CHECK (nib IS NULL OR nib ~ '^[0-9]{13}$'),
    CONSTRAINT ck_master_umkm_deleted CHECK ((is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE))
);

CREATE TABLE user_mgmt.master_produkumkm (
    produk_id VARCHAR(30) PRIMARY KEY,
    umkm_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_umkm(umkm_id) ON DELETE CASCADE ON UPDATE CASCADE,
    kategori_produk_id VARCHAR(30) NOT NULL REFERENCES ref.ref_kategoriproduk(kategori_produk_id) ON UPDATE CASCADE,
    nama_produk VARCHAR(150) NOT NULL,
    deskripsi_produk TEXT,
    harga NUMERIC(14,2) NOT NULL CHECK (harga >= 0),
    status_produk VARCHAR(30) NOT NULL DEFAULT 'AKTIF' CHECK (status_produk IN ('AKTIF', 'DRAFT', 'NONAKTIF')),
    legalitas_produk TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_master_produkumkm_deleted CHECK ((is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE))
);

CREATE TABLE user_mgmt.master_mitra (
    mitra_id VARCHAR(30) PRIMARY KEY,
    kode_mitra VARCHAR(50) NOT NULL UNIQUE,
    akun_id VARCHAR(30) NOT NULL UNIQUE REFERENCES auth.master_akunpengguna(akun_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    diverifikasi_oleh_admin_id VARCHAR(30) REFERENCES auth.master_admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE,
    lokasi_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_lokasi(lokasi_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    jenis_mitra_id VARCHAR(30) NOT NULL REFERENCES ref.ref_jenismitra(jenis_mitra_id) ON UPDATE CASCADE,
    status_mitra_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statusmitra(status_mitra_id) ON UPDATE CASCADE,
    skala_kerjasama_id VARCHAR(30) REFERENCES ref.ref_skalakerjasama(skala_kerjasama_id) ON UPDATE CASCADE,
    nama_mitra VARCHAR(150) NOT NULL,
    nama_badan_hukum VARCHAR(150),
    nib VARCHAR(30),
    npwp VARCHAR(30),
    nama_pic VARCHAR(150) NOT NULL,
    jabatan_pic VARCHAR(100),
    kontak_pic VARCHAR(20),
    email_pic CITEXT,
    alamat_mitra TEXT,
    wilayah_operasional VARCHAR(150),
    deskripsi_dukungan TEXT,
    logo_url TEXT,
    foto_cover_url TEXT,
    status_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_master_mitra_nib UNIQUE (nib),
    CONSTRAINT uq_master_mitra_npwp UNIQUE (npwp),
    CONSTRAINT ck_master_mitra_deleted CHECK ((is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE))
);

CREATE TABLE user_mgmt.master_mitrabidangkemitraan (
    mitra_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_mitra(mitra_id) ON DELETE CASCADE ON UPDATE CASCADE,
    bidang_kemitraan_id VARCHAR(30) NOT NULL REFERENCES ref.ref_bidangkemitraan(bidang_kemitraan_id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (mitra_id, bidang_kemitraan_id)
);

CREATE TABLE user_mgmt.master_mitrabentukdukungan (
    mitra_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_mitra(mitra_id) ON DELETE CASCADE ON UPDATE CASCADE,
    bentuk_dukungan_id VARCHAR(30) NOT NULL REFERENCES ref.ref_bentukdukungan(bentuk_dukungan_id) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (mitra_id, bentuk_dukungan_id)
);

CREATE TABLE user_mgmt.transaksi_registrasipengguna (
    akun_id VARCHAR(30) NOT NULL REFERENCES auth.master_akunpengguna(akun_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    umkm_id VARCHAR(30) REFERENCES user_mgmt.master_umkm(umkm_id) ON DELETE SET NULL ON UPDATE CASCADE,
    diverifikasi_oleh_admin_id VARCHAR(30) REFERENCES auth.master_admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE,
    mitra_id VARCHAR(30) REFERENCES user_mgmt.master_mitra(mitra_id) ON DELETE SET NULL ON UPDATE CASCADE,
    status_verifikasi_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statusverifikasi(status_verifikasi_id) ON UPDATE CASCADE,
    kode_registrasi VARCHAR(50) PRIMARY KEY,
    tanggal_submit TIMESTAMPTZ NOT NULL,
    tanggal_review TIMESTAMPTZ,
    tanggal_aktivasi TIMESTAMPTZ,
    catatan_validasi TEXT,
    checklist_informasi_lengkap BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_registrasi_owner CHECK (
        (umkm_id IS NOT NULL AND mitra_id IS NULL)
        OR (umkm_id IS NULL AND mitra_id IS NOT NULL)
    ),
    CONSTRAINT ck_registrasi_review CHECK (tanggal_review IS NULL OR tanggal_review >= tanggal_submit),
    CONSTRAINT ck_registrasi_aktivasi CHECK (tanggal_aktivasi IS NULL OR tanggal_review IS NULL OR tanggal_aktivasi >= tanggal_review)
);

-- ============================================================
