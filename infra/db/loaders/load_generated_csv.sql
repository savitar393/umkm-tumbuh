-- Run this with psql from the generator output directory that contains csv/*.csv.
-- Example:
--   psql "$DATABASE_URL" -f infra/db/loaders/load_mandat_generated_csv.sql

\set ON_ERROR_STOP on

\copy ref.ref_peranpengguna(peran_id, nama_peran) FROM 'csv/ref_peranpengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_jenisumkm(jenis_umkm_id, nama_jenis_umkm) FROM 'csv/ref_jenisumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_skalausaha(skala_usaha_id, nama_skala_usaha) FROM 'csv/ref_skalausaha.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_kategoriusaha(kategori_usaha_id, nama_kategori_usaha) FROM 'csv/ref_kategoriusaha.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_kategoriproduk(kategori_produk_id, nama_kategori_produk) FROM 'csv/ref_kategoriproduk.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statusumkm(status_umkm_id, nama_status_umkm) FROM 'csv/ref_statusumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_jenismitra(jenis_mitra_id, nama_jenis_mitra) FROM 'csv/ref_jenismitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statusmitra(status_mitra_id, nama_status_mitra) FROM 'csv/ref_statusmitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_bidangkemitraan(bidang_kemitraan_id, nama_bidang_kemitraan) FROM 'csv/ref_bidangkemitraan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_bentukdukungan(bentuk_dukungan_id, nama_bentuk_dukungan) FROM 'csv/ref_bentukdukungan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_skalakerjasama(skala_kerjasama_id, nama_skala_kerjasama) FROM 'csv/ref_skalakerjasama.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_jenispelatihan(jenis_pelatihan_id, nama_jenis_pelatihan) FROM 'csv/ref_jenispelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statuspelatihan(status_pelatihan_id, nama_status_pelatihan) FROM 'csv/ref_statuspelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statuspendaftaranpelatihan(status_pendaftaran_pelatihan_id, nama_status_pendaftaran) FROM 'csv/ref_statuspendaftaranpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statussubmission(status_submission_id, nama_status_submission) FROM 'csv/ref_statussubmission.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statussertifikat(status_sertifikat_id, nama_status_sertifikat) FROM 'csv/ref_statussertifikat.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statuspengajuan(status_pengajuan_id, nama_status_pengajuan) FROM 'csv/ref_statuspengajuan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statusperkembangan(status_perkembangan_id, nama_status_perkembangan) FROM 'csv/ref_statusperkembangan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statusverifikasi(status_verifikasi_id, nama_status_verifikasi) FROM 'csv/ref_statusverifikasi.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_statusdokumen(status_dokumen_id, nama_status_dokumen) FROM 'csv/ref_statusdokumen.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_jenisdokumen(jenis_dokumen_id, nama_jenis_dokumen, deskripsi, allowed_extensions, max_size_mb, wajib_umkm, wajib_mitra, wajib_pengajuan_kemitraan) FROM 'csv/ref_jenisdokumen.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy ref.ref_dimwaktu(tanggal, hari, minggu_ke, minggu_bulan, tanggal_awal_minggu, tanggal_akhir_minggu, bulan, nama_bulan, kuartal, tahun, is_weekend) FROM 'csv/ref_dimwaktu.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy auth.master_akunpengguna(akun_id, peran_id, nama_lengkap, email, no_hp, password_hash, status_aktif, email_verified_at, last_login_at, created_at, updated_at) FROM 'csv/master_akunpengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_lokasi(lokasi_id, provinsi, kabupaten_kota, kecamatan, kelurahan, kode_pos, alamat_detail, latitude, longitude, created_at, updated_at) FROM 'csv/master_lokasi.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_pelakuumkm(pelaku_umkm_id, akun_id, nama_pelaku, nik, no_hp, email, alamat, status_aktif, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM 'csv/master_pelakuumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_umkm(umkm_id, kode_umkm, pelaku_umkm_id, diverifikasi_oleh_admin_id, lokasi_id, jenis_umkm_id, skala_usaha_id, kategori_usaha_id, status_umkm_id, nama_umkm, nib, deskripsi_usaha, produk_utama, tahun_berdiri, nomor_whatsapp, email_bisnis, jam_operasional, media_sosial_marketplace, logo_url, foto_cover_url, status_verified, tanggal_terdaftar, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM 'csv/master_umkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_produkumkm(produk_id, umkm_id, kategori_produk_id, nama_produk, deskripsi_produk, harga, status_produk, legalitas_produk, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM 'csv/master_produkumkm.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_mitra(mitra_id, kode_mitra, akun_id, diverifikasi_oleh_admin_id, lokasi_id, jenis_mitra_id, status_mitra_id, skala_kerjasama_id, nama_mitra, nama_badan_hukum, nib, npwp, nama_pic, jabatan_pic, kontak_pic, email_pic, alamat_mitra, wilayah_operasional, deskripsi_dukungan, logo_url, foto_cover_url, status_verified, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM 'csv/master_mitra.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_mitrabidangkemitraan(mitra_id, bidang_kemitraan_id, created_at) FROM 'csv/master_mitrabidangkemitraan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.master_mitrabentukdukungan(mitra_id, bentuk_dukungan_id, created_at) FROM 'csv/master_mitrabentukdukungan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.master_programpelatihan(pelatihan_id, kode_pelatihan, dibuat_oleh_admin_id, jenis_pelatihan_id, status_pelatihan_id, judul_pelatihan, deskripsi_pelatihan, mentor_nama, durasi_jam, total_modul, harga, akses_seumur_hidup, masa_akses_hari, rating_rata_rata, jumlah_alumni, thumbnail_url, syarat_ketentuan, tanggal_publish, is_deleted, deleted_at, archived_at, created_at, updated_at) FROM 'csv/master_programpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.master_modulpelatihan(modul_id, pelatihan_id, urutan_modul, judul_modul, deskripsi_modul, durasi_menit, materi_url, is_preview, status_aktif, created_at) FROM 'csv/master_modulpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.master_assignmentpelatihan(assignment_id, pelatihan_id, judul_assignment, deskripsi_assignment, instruksi_submission, due_days_after_enroll, status_aktif, created_at) FROM 'csv/master_assignmentpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy auth.master_admin(admin_id, akun_id, kode_admin, is_active, created_at, updated_at) FROM 'csv/master_admin.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy document.transaksi_dokumenterunggah(dokumen_id, jenis_dokumen_id, status_dokumen_id, uploader_akun_id, owner_type, owner_id, context_type, context_id, original_file_name, stored_file_name, file_extension, mime_type, file_size_bytes, bucket_name, object_key, storage_path, public_url, checksum_sha256, version_id, is_public, display_order, caption, uploaded_at, verified_at, expired_at, metadata_json) FROM 'csv/transaksi_dokumenterunggah.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy user_mgmt.transaksi_registrasipengguna(akun_id, umkm_id, diverifikasi_oleh_admin_id, mitra_id, status_verifikasi_id, kode_registrasi, tanggal_submit, tanggal_review, tanggal_aktivasi, catatan_validasi, checklist_informasi_lengkap, created_at) FROM 'csv/transaksi_registrasipengguna.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.transaksi_pendaftaranpelatihan(pendaftaran_pelatihan_id, umkm_id, pelatihan_id, status_pendaftaran_pelatihan_id, tanggal_daftar, akses_mulai_at, akses_berakhir_at, terakhir_diakses_at, progress_persen, modul_selesai, total_modul_snapshot, tanggal_selesai) FROM 'csv/transaksi_pendaftaranpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.transaksi_submissionassignment(pendaftaran_pelatihan_id, assignment_id, status_submission_id, dokumen_id, submission_link, submitted_at, reviewed_at) FROM 'csv/transaksi_submissionassignment.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy training.transaksi_sertifikatpelatihan(pendaftaran_pelatihan_id, status_sertifikat_id, dokumen_id, nomor_sertifikat, tanggal_pengajuan, tanggal_terbit, diverifikasi_oleh_admin_id, catatan_validasi) FROM 'csv/transaksi_sertifikatpelatihan.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy partnership.transaksi_pengajuankerjasama(pengajuan_id, kode_pengajuan, umkm_id, mitra_id, pengaju_akun_id, penerima_akun_id, status_pengajuan_id, pesan_pengajuan, catatan_keputusan, dokumen_perjanjian_id, tanggal_pengajuan, tanggal_keputusan, tanggal_upload_dokumen, tanggal_mulai_kerjasama, tanggal_selesai_kerjasama, created_at, updated_at) FROM 'csv/transaksi_pengajuankerjasama.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy dashboard.transaksi_monitoringperkembangan(umkm_id, status_perkembangan_id, laba_harian, jumlah_produk, created_at) FROM 'csv/transaksi_monitoringperkembangan.csv' WITH (FORMAT csv, HEADER true, NULL '');
