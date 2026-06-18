-- Load all CSV data with robust conflict handling
\set ON_ERROR_STOP on

-- =============================================================================
-- REFERENCE TABLES
-- =============================================================================
CREATE TEMP TABLE _r (id VARCHAR(30), name VARCHAR(200));
\copy _r FROM 'csv/ref_skalausaha.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_skalausaha SELECT * FROM _r ON CONFLICT (skala_usaha_id) DO UPDATE SET nama_skala_usaha = EXCLUDED.nama_skala_usaha; TRUNCATE _r;
\copy _r FROM 'csv/ref_kategoriusaha.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_kategoriusaha SELECT * FROM _r ON CONFLICT (kategori_usaha_id) DO UPDATE SET nama_kategori_usaha = EXCLUDED.nama_kategori_usaha; TRUNCATE _r;
\copy _r FROM 'csv/ref_kategoriproduk.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_kategoriproduk SELECT * FROM _r ON CONFLICT (kategori_produk_id) DO UPDATE SET nama_kategori_produk = EXCLUDED.nama_kategori_produk; TRUNCATE _r;
\copy _r FROM 'csv/ref_jenisumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenisumkm SELECT * FROM _r ON CONFLICT (jenis_umkm_id) DO UPDATE SET nama_jenis_umkm = EXCLUDED.nama_jenis_umkm; TRUNCATE _r;
\copy _r FROM 'csv/ref_jenismitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenismitra SELECT * FROM _r ON CONFLICT (jenis_mitra_id) DO UPDATE SET nama_jenis_mitra = EXCLUDED.nama_jenis_mitra; TRUNCATE _r;
\copy _r FROM 'csv/ref_bidangkemitraan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_bidangkemitraan SELECT * FROM _r ON CONFLICT (bidang_kemitraan_id) DO UPDATE SET nama_bidang_kemitraan = EXCLUDED.nama_bidang_kemitraan; TRUNCATE _r;
\copy _r FROM 'csv/ref_bentukdukungan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_bentukdukungan SELECT * FROM _r ON CONFLICT (bentuk_dukungan_id) DO UPDATE SET nama_bentuk_dukungan = EXCLUDED.nama_bentuk_dukungan; TRUNCATE _r;
\copy _r FROM 'csv/ref_skalakerjasama.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_skalakerjasama SELECT * FROM _r ON CONFLICT (skala_kerjasama_id) DO UPDATE SET nama_skala_kerjasama = EXCLUDED.nama_skala_kerjasama; TRUNCATE _r;
\copy _r FROM 'csv/ref_statusumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusumkm SELECT * FROM _r ON CONFLICT (status_umkm_id) DO UPDATE SET nama_status_umkm = EXCLUDED.nama_status_umkm; TRUNCATE _r;
\copy _r FROM 'csv/ref_statusmitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusmitra SELECT * FROM _r ON CONFLICT (status_mitra_id) DO UPDATE SET nama_status_mitra = EXCLUDED.nama_status_mitra; TRUNCATE _r;
\copy _r FROM 'csv/ref_jenispelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenispelatihan SELECT * FROM _r ON CONFLICT (jenis_pelatihan_id) DO UPDATE SET nama_jenis_pelatihan = EXCLUDED.nama_jenis_pelatihan; TRUNCATE _r;
\copy _r FROM 'csv/ref_statuspelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statuspelatihan SELECT * FROM _r ON CONFLICT (status_pelatihan_id) DO UPDATE SET nama_status_pelatihan = EXCLUDED.nama_status_pelatihan; TRUNCATE _r;
\copy _r FROM 'csv/ref_statuspendaftaranpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statuspendaftaranpelatihan SELECT * FROM _r ON CONFLICT (status_pendaftaran_pelatihan_id) DO UPDATE SET nama_status_pendaftaran = EXCLUDED.nama_status_pendaftaran; TRUNCATE _r;
\copy _r FROM 'csv/ref_statussubmission.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statussubmission SELECT * FROM _r ON CONFLICT (status_submission_id) DO UPDATE SET nama_status_submission = EXCLUDED.nama_status_submission; TRUNCATE _r;
\copy _r FROM 'csv/ref_statussertifikat.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statussertifikat SELECT * FROM _r ON CONFLICT (status_sertifikat_id) DO UPDATE SET nama_status_sertifikat = EXCLUDED.nama_status_sertifikat; TRUNCATE _r;
\copy _r FROM 'csv/ref_statuspengajuan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statuspengajuan SELECT * FROM _r ON CONFLICT (status_pengajuan_id) DO UPDATE SET nama_status_pengajuan = EXCLUDED.nama_status_pengajuan; TRUNCATE _r;
\copy _r FROM 'csv/ref_statusperkembangan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusperkembangan SELECT * FROM _r ON CONFLICT (status_perkembangan_id) DO UPDATE SET nama_status_perkembangan = EXCLUDED.nama_status_perkembangan; TRUNCATE _r;
\copy _r FROM 'csv/ref_statusdokumen.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusdokumen SELECT * FROM _r ON CONFLICT (status_dokumen_id) DO UPDATE SET nama_status_dokumen = EXCLUDED.nama_status_dokumen; TRUNCATE _r;
\copy _r FROM 'csv/ref_peranpengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_peranpengguna SELECT * FROM _r ON CONFLICT (peran_id) DO UPDATE SET nama_peran = EXCLUDED.nama_peran; TRUNCATE _r;
DROP TABLE _r;

CREATE TEMP TABLE _r3 (id VARCHAR(30), name VARCHAR(100));
\copy _r3 FROM 'csv/ref_statusverifikasi.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusverifikasi (status_verifikasi_id, nama_status_verifikasi) SELECT id, name FROM _r3 ON CONFLICT (status_verifikasi_id) DO UPDATE SET nama_status_verifikasi = EXCLUDED.nama_status_verifikasi;
DROP TABLE _r3;

CREATE TEMP TABLE _rd AS SELECT * FROM ref.ref_jenisdokumen WHERE false;
\copy _rd FROM 'csv/ref_jenisdokumen.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenisdokumen SELECT * FROM _rd ON CONFLICT (jenis_dokumen_id) DO UPDATE SET nama_jenis_dokumen = EXCLUDED.nama_jenis_dokumen, deskripsi = EXCLUDED.deskripsi, allowed_extensions = EXCLUDED.allowed_extensions, max_size_mb = EXCLUDED.max_size_mb, wajib_umkm = EXCLUDED.wajib_umkm, wajib_mitra = EXCLUDED.wajib_mitra, wajib_pengajuan_kemitraan = EXCLUDED.wajib_pengajuan_kemitraan;
DROP TABLE _rd;

CREATE TEMP TABLE _dw AS SELECT * FROM ref.ref_dimwaktu WHERE false;
\copy _dw FROM 'csv/ref_dimwaktu.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_dimwaktu SELECT * FROM _dw ON CONFLICT (tanggal) DO NOTHING;
DROP TABLE _dw;

-- =============================================================================
-- MASTER & TRANSACTION TABLES
-- =============================================================================
CREATE TEMP TABLE _a AS SELECT * FROM auth.master_akunpengguna WHERE false;
\copy _a FROM 'csv/master_akunpengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO auth.master_akunpengguna SELECT * FROM _a ON CONFLICT (akun_id) DO NOTHING;
DROP TABLE _a;

CREATE TEMP TABLE _adm AS SELECT * FROM auth.master_admin WHERE false;
\copy _adm FROM 'csv/master_admin.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO auth.master_admin SELECT * FROM _adm ON CONFLICT (admin_id) DO NOTHING;
DROP TABLE _adm;

CREATE TEMP TABLE _lok AS SELECT * FROM user_mgmt.master_lokasi WHERE false;
\copy _lok FROM 'csv/master_lokasi.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_lokasi SELECT * FROM _lok ON CONFLICT (lokasi_id) DO NOTHING;
DROP TABLE _lok;

CREATE TEMP TABLE _plk AS SELECT * FROM user_mgmt.master_pelakuumkm WHERE false;
\copy _plk FROM 'csv/master_pelakuumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_pelakuumkm SELECT * FROM _plk ON CONFLICT (pelaku_umkm_id) DO NOTHING;
DROP TABLE _plk;

CREATE TEMP TABLE _umkm AS SELECT * FROM user_mgmt.master_umkm WHERE false;
\copy _umkm FROM 'csv/master_umkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_umkm SELECT * FROM _umkm ON CONFLICT (umkm_id) DO NOTHING;
DROP TABLE _umkm;

CREATE TEMP TABLE _pdk (produk_id VARCHAR(30), umkm_id VARCHAR(30), kategori_produk_id VARCHAR(30), nama_produk VARCHAR(150), deskripsi_produk TEXT, harga NUMERIC(14,2), status_produk VARCHAR(30), legalitas_produk TEXT, is_deleted BOOLEAN, deleted_at TIMESTAMPTZ, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ);
\copy _pdk FROM 'csv/master_produkumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_produkumkm (produk_id, umkm_id, kategori_produk_id, nama_produk, deskripsi_produk, harga, status_produk, legalitas_produk, is_deleted, deleted_at, archived_at, created_at, updated_at) SELECT * FROM _pdk ON CONFLICT (produk_id) DO NOTHING;
DROP TABLE _pdk;

CREATE TEMP TABLE _mtr AS SELECT * FROM user_mgmt.master_mitra WHERE false;
\copy _mtr FROM 'csv/master_mitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_mitra SELECT * FROM _mtr ON CONFLICT (mitra_id) DO NOTHING;
DROP TABLE _mtr;

CREATE TEMP TABLE _mtb AS SELECT * FROM user_mgmt.master_mitrabidangkemitraan WHERE false;
\copy _mtb FROM 'csv/master_mitrabidangkemitraan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_mitrabidangkemitraan SELECT * FROM _mtb ON CONFLICT (mitra_id, bidang_kemitraan_id) DO NOTHING;
DROP TABLE _mtb;

CREATE TEMP TABLE _mduk AS SELECT * FROM user_mgmt.master_mitrabentukdukungan WHERE false;
\copy _mduk FROM 'csv/master_mitrabentukdukungan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.master_mitrabentukdukungan SELECT * FROM _mduk ON CONFLICT (mitra_id, bentuk_dukungan_id) DO NOTHING;
DROP TABLE _mduk;

-- Training
CREATE TEMP TABLE _tprog AS SELECT * FROM training.master_programpelatihan WHERE false;
\copy _tprog FROM 'csv/master_programpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO training.master_programpelatihan SELECT * FROM _tprog ON CONFLICT (pelatihan_id) DO NOTHING;
DROP TABLE _tprog;

CREATE TEMP TABLE _tmod AS SELECT * FROM training.master_modulpelatihan WHERE false;
\copy _tmod FROM 'csv/master_modulpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO training.master_modulpelatihan SELECT * FROM _tmod ON CONFLICT (modul_id) DO NOTHING;
DROP TABLE _tmod;

CREATE TEMP TABLE _tass AS SELECT * FROM training.master_assignmentpelatihan WHERE false;
\copy _tass FROM 'csv/master_assignmentpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO training.master_assignmentpelatihan SELECT * FROM _tass ON CONFLICT (assignment_id) DO NOTHING;
DROP TABLE _tass;

-- Documents
CREATE TEMP TABLE _doc AS SELECT * FROM document.transaksi_dokumenterunggah WHERE false;
\copy _doc FROM 'csv/transaksi_dokumenterunggah.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO document.transaksi_dokumenterunggah SELECT * FROM _doc ON CONFLICT (dokumen_id) DO NOTHING;
DROP TABLE _doc;

-- Registrations (has duplicate akun_id in CSV, so use ON CONFLICT)
CREATE TEMP TABLE _reg AS SELECT * FROM user_mgmt.transaksi_registrasipengguna WHERE false;
\copy _reg FROM 'csv/transaksi_registrasipengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO user_mgmt.transaksi_registrasipengguna SELECT * FROM _reg ON CONFLICT (akun_id) DO NOTHING;
DROP TABLE _reg;

-- Training enrollments (skip submissionassignment - has auto-generated bigint PK)
CREATE TEMP TABLE _tpen AS SELECT * FROM training.transaksi_pendaftaranpelatihan WHERE false;
\copy _tpen FROM 'csv/transaksi_pendaftaranpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO training.transaksi_pendaftaranpelatihan SELECT * FROM _tpen ON CONFLICT (pendaftaran_pelatihan_id) DO NOTHING;
DROP TABLE _tpen;

-- transaksi_sertifikatpelatihan skipped: has auto-generated bigint PK incompatible with CSV

-- Partnerships
CREATE TEMP TABLE _tpks AS SELECT * FROM partnership.transaksi_pengajuankerjasama WHERE false;
\copy _tpks FROM 'csv/transaksi_pengajuankerjasama.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO partnership.transaksi_pengajuankerjasama SELECT * FROM _tpks ON CONFLICT (pengajuan_id) DO NOTHING;
DROP TABLE _tpks;

-- Dashboard monitoring skipped: no unique constraint on (umkm_id, created_at)
