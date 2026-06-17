\set ON_ERROR_STOP off

-- ========================================
-- Phase 1: Load all ref tables via temp
-- ========================================
CREATE TEMP TABLE temp_ref_bentukdukungan (bentuk_dukungan_id TEXT, nama_bentuk_dukungan TEXT);
\copy temp_ref_bentukdukungan FROM '/tmp/csv/ref_bentukdukungan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_bentukdukungan SELECT * FROM temp_ref_bentukdukungan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_bentukdukungan;

CREATE TEMP TABLE temp_ref_bidangkemitraan (bidang_kemitraan_id TEXT, nama_bidang_kemitraan TEXT);
\copy temp_ref_bidangkemitraan FROM '/tmp/csv/ref_bidangkemitraan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_bidangkemitraan SELECT * FROM temp_ref_bidangkemitraan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_bidangkemitraan;

CREATE TEMP TABLE temp_ref_dimwaktu (tanggal DATE, hari INTEGER, minggu_ke INTEGER, minggu_bulan INTEGER, tanggal_awal_minggu DATE, tanggal_akhir_minggu DATE, bulan INTEGER, nama_bulan TEXT, kuartal INTEGER, tahun INTEGER, is_weekend BOOLEAN);
\copy temp_ref_dimwaktu FROM '/tmp/csv/ref_dimwaktu.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_dimwaktu SELECT * FROM temp_ref_dimwaktu ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_dimwaktu;

CREATE TEMP TABLE temp_ref_jenisdokumen (jenis_dokumen_id TEXT, nama_jenis_dokumen TEXT, deskripsi TEXT, allowed_extensions TEXT, max_size_mb NUMERIC, wajib_umkm BOOLEAN, wajib_mitra BOOLEAN, wajib_pengajuan_kemitraan BOOLEAN);
\copy temp_ref_jenisdokumen FROM '/tmp/csv/ref_jenisdokumen.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenisdokumen SELECT * FROM temp_ref_jenisdokumen ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_jenisdokumen;

CREATE TEMP TABLE temp_ref_jenismitra (jenis_mitra_id TEXT, nama_jenis_mitra TEXT);
\copy temp_ref_jenismitra FROM '/tmp/csv/ref_jenismitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenismitra SELECT * FROM temp_ref_jenismitra ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_jenismitra;

CREATE TEMP TABLE temp_ref_jenispelatihan (jenis_pelatihan_id TEXT, nama_jenis_pelatihan TEXT);
\copy temp_ref_jenispelatihan FROM '/tmp/csv/ref_jenispelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenispelatihan SELECT * FROM temp_ref_jenispelatihan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_jenispelatihan;

CREATE TEMP TABLE temp_ref_jenisumkm (jenis_umkm_id TEXT, nama_jenis_umkm TEXT);
\copy temp_ref_jenisumkm FROM '/tmp/csv/ref_jenisumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_jenisumkm SELECT * FROM temp_ref_jenisumkm ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_jenisumkm;

CREATE TEMP TABLE temp_ref_kategoriproduk (kategori_produk_id TEXT, nama_kategori_produk TEXT);
\copy temp_ref_kategoriproduk FROM '/tmp/csv/ref_kategoriproduk.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_kategoriproduk SELECT * FROM temp_ref_kategoriproduk ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_kategoriproduk;

CREATE TEMP TABLE temp_ref_kategoriusaha (kategori_usaha_id TEXT, nama_kategori_usaha TEXT);
\copy temp_ref_kategoriusaha FROM '/tmp/csv/ref_kategoriusaha.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_kategoriusaha SELECT * FROM temp_ref_kategoriusaha ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_kategoriusaha;

CREATE TEMP TABLE temp_ref_peranpengguna (peran_id TEXT, nama_peran TEXT);
\copy temp_ref_peranpengguna FROM '/tmp/csv/ref_peranpengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_peranpengguna SELECT * FROM temp_ref_peranpengguna ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_peranpengguna;

CREATE TEMP TABLE temp_ref_skalakerjasama (skala_kerjasama_id TEXT, nama_skala_kerjasama TEXT);
\copy temp_ref_skalakerjasama FROM '/tmp/csv/ref_skalakerjasama.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_skalakerjasama SELECT * FROM temp_ref_skalakerjasama ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_skalakerjasama;

CREATE TEMP TABLE temp_ref_skalausaha (skala_usaha_id TEXT, nama_skala_usaha TEXT);
\copy temp_ref_skalausaha FROM '/tmp/csv/ref_skalausaha.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_skalausaha SELECT * FROM temp_ref_skalausaha ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_skalausaha;

CREATE TEMP TABLE temp_ref_statusdokumen (status_dokumen_id TEXT, nama_status_dokumen TEXT);
\copy temp_ref_statusdokumen FROM '/tmp/csv/ref_statusdokumen.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusdokumen SELECT * FROM temp_ref_statusdokumen ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statusdokumen;

CREATE TEMP TABLE temp_ref_statusmitra (status_mitra_id TEXT, nama_status_mitra TEXT);
\copy temp_ref_statusmitra FROM '/tmp/csv/ref_statusmitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusmitra SELECT * FROM temp_ref_statusmitra ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statusmitra;

CREATE TEMP TABLE temp_ref_statuspelatihan (status_pelatihan_id TEXT, nama_status_pelatihan TEXT);
\copy temp_ref_statuspelatihan FROM '/tmp/csv/ref_statuspelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statuspelatihan SELECT * FROM temp_ref_statuspelatihan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statuspelatihan;

CREATE TEMP TABLE temp_ref_statuspendaftaranpelatihan (status_pendaftaran_pelatihan_id TEXT, nama_status_pendaftaran TEXT);
\copy temp_ref_statuspendaftaranpelatihan FROM '/tmp/csv/ref_statuspendaftaranpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statuspendaftaranpelatihan SELECT * FROM temp_ref_statuspendaftaranpelatihan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statuspendaftaranpelatihan;

CREATE TEMP TABLE temp_ref_statuspengajuan (status_pengajuan_id TEXT, nama_status_pengajuan TEXT);
\copy temp_ref_statuspengajuan FROM '/tmp/csv/ref_statuspengajuan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statuspengajuan SELECT * FROM temp_ref_statuspengajuan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statuspengajuan;

CREATE TEMP TABLE temp_ref_statusperkembangan (status_perkembangan_id TEXT, nama_status_perkembangan TEXT);
\copy temp_ref_statusperkembangan FROM '/tmp/csv/ref_statusperkembangan.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusperkembangan SELECT * FROM temp_ref_statusperkembangan ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statusperkembangan;

CREATE TEMP TABLE temp_ref_statussertifikat (status_sertifikat_id TEXT, nama_status_sertifikat TEXT);
\copy temp_ref_statussertifikat FROM '/tmp/csv/ref_statussertifikat.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statussertifikat SELECT * FROM temp_ref_statussertifikat ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statussertifikat;

CREATE TEMP TABLE temp_ref_statussubmission (status_submission_id TEXT, nama_status_submission TEXT);
\copy temp_ref_statussubmission FROM '/tmp/csv/ref_statussubmission.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statussubmission SELECT * FROM temp_ref_statussubmission ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statussubmission;

CREATE TEMP TABLE temp_ref_statusumkm (status_umkm_id TEXT, nama_status_umkm TEXT);
\copy temp_ref_statusumkm FROM '/tmp/csv/ref_statusumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusumkm SELECT * FROM temp_ref_statusumkm ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statusumkm;

CREATE TEMP TABLE temp_ref_statusverifikasi (status_verifikasi_id TEXT, nama_status_verifikasi TEXT);
\copy temp_ref_statusverifikasi FROM '/tmp/csv/ref_statusverifikasi.csv' WITH (FORMAT csv, HEADER true, NULL '');
INSERT INTO ref.ref_statusverifikasi SELECT * FROM temp_ref_statusverifikasi ON CONFLICT DO NOTHING;
DROP TABLE temp_ref_statusverifikasi;

-- ========================================
-- Phase 2: Master tables (empty, direct \copy)
-- ========================================
\copy auth.master_akunpengguna(akun_id, peran_id, nama_lengkap, email, no_hp, password_hash, status_aktif, email_verified_at, last_login_at, created_at, updated_at) FROM '/tmp/csv/master_akunpengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy auth.master_admin(admin_id, akun_id, kode_admin, is_active, created_at, updated_at) FROM '/tmp/csv/master_admin.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_lokasi(lokasi_id, provinsi, kabupaten_kota, kecamatan, kelurahan, kode_pos, alamat_detail, latitude, longitude, created_at, updated_at) FROM '/tmp/csv/master_lokasi.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_pelakuumkm(pelaku_umkm_id, akun_id, nama_pelaku, nik, no_hp, email, alamat, status_aktif, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM '/tmp/csv/master_pelakuumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_umkm(umkm_id, kode_umkm, pelaku_umkm_id, diverifikasi_oleh_admin_id, lokasi_id, jenis_umkm_id, skala_usaha_id, kategori_usaha_id, status_umkm_id, nama_umkm, nib, deskripsi_usaha, produk_utama, tahun_berdiri, nomor_whatsapp, email_bisnis, jam_operasional, media_sosial_marketplace, logo_url, foto_cover_url, status_verified, tanggal_terdaftar, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM '/tmp/csv/master_umkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_produkumkm(produk_id, umkm_id, kategori_produk_id, nama_produk, deskripsi_produk, harga, status_produk, legalitas_produk, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM '/tmp/csv/master_produkumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_mitra(mitra_id, kode_mitra, akun_id, diverifikasi_oleh_admin_id, lokasi_id, jenis_mitra_id, status_mitra_id, skala_kerjasama_id, nama_mitra, nama_badan_hukum, nib, npwp, nama_pic, jabatan_pic, kontak_pic, email_pic, alamat_mitra, wilayah_operasional, deskripsi_dukungan, logo_url, foto_cover_url, status_verified, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM '/tmp/csv/master_mitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_mitrabidangkemitraan(mitra_id, bidang_kemitraan_id, created_at) FROM '/tmp/csv/master_mitrabidangkemitraan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_mitrabentukdukungan(mitra_id, bentuk_dukungan_id, created_at) FROM '/tmp/csv/master_mitrabentukdukungan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.master_programpelatihan(pelatihan_id, kode_pelatihan, dibuat_oleh_admin_id, jenis_pelatihan_id, status_pelatihan_id, judul_pelatihan, deskripsi_pelatihan, mentor_nama, durasi_jam, total_modul, harga, akses_seumur_hidup, masa_akses_hari, rating_rata_rata, jumlah_alumni, thumbnail_url, syarat_ketentuan, tanggal_publish, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM '/tmp/csv/master_programpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.master_modulpelatihan(modul_id, pelatihan_id, urutan_modul, judul_modul, deskripsi_modul, durasi_menit, materi_url, is_preview, status_aktif, created_at) FROM '/tmp/csv/master_modulpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.master_assignmentpelatihan(assignment_id, pelatihan_id, judul_assignment, deskripsi_assignment, instruksi_submission, due_days_after_enroll, status_aktif, created_at) FROM '/tmp/csv/master_assignmentpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy document.transaksi_dokumenterunggah(dokumen_id, jenis_dokumen_id, status_dokumen_id, uploader_akun_id, owner_type, owner_id, context_type, context_id, original_file_name, stored_file_name, file_extension, mime_type, file_size_bytes, bucket_name, object_key, storage_path, public_url, checksum_sha256, version_id, is_public, display_order, caption, uploaded_at, verified_at, expired_at, metadata_json) FROM '/tmp/csv/transaksi_dokumenterunggah.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.transaksi_pendaftaranpelatihan(pendaftaran_pelatihan_id, umkm_id, pelatihan_id, status_pendaftaran_pelatihan_id, tanggal_daftar, akses_mulai_at, akses_berakhir_at, terakhir_diakses_at, progress_persen, modul_selesai, total_modul_snapshot, tanggal_selesai) FROM '/tmp/csv/transaksi_pendaftaranpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.transaksi_submissionassignment(pendaftaran_pelatihan_id, assignment_id, status_submission_id, dokumen_id, submission_link, submitted_at, reviewed_at) FROM '/tmp/csv/transaksi_submissionassignment.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.transaksi_sertifikatpelatihan(pendaftaran_pelatihan_id, status_sertifikat_id, dokumen_id, nomor_sertifikat, tanggal_pengajuan, tanggal_terbit, diverifikasi_oleh_admin_id, catatan_validasi) FROM '/tmp/csv/transaksi_sertifikatpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
