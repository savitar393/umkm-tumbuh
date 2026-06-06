-- +goose Up

-- Triggers
-- ============================================================

CREATE TRIGGER trg_master_akunpengguna_updated_at
BEFORE UPDATE ON auth.master_akunpengguna
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_admin_updated_at
BEFORE UPDATE ON auth.master_admin
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_lokasi_updated_at
BEFORE UPDATE ON user_mgmt.master_lokasi
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_pelakuumkm_updated_at
BEFORE UPDATE ON user_mgmt.master_pelakuumkm
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_umkm_updated_at
BEFORE UPDATE ON user_mgmt.master_umkm
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_produkumkm_updated_at
BEFORE UPDATE ON user_mgmt.master_produkumkm
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_mitra_updated_at
BEFORE UPDATE ON user_mgmt.master_mitra
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_master_programpelatihan_updated_at
BEFORE UPDATE ON training.master_programpelatihan
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE TRIGGER trg_pengajuankerjasama_updated_at
BEFORE UPDATE ON partnership.transaksi_pengajuankerjasama
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

-- ============================================================
-- Indexes for API and dashboard access patterns
-- ============================================================

CREATE INDEX idx_akunpengguna_peran ON auth.master_akunpengguna(peran_id);
CREATE INDEX idx_akunpengguna_status ON auth.master_akunpengguna(status_aktif);
CREATE INDEX idx_remember_tokens_akun ON auth.transaksi_remember_tokens(akun_id);
CREATE INDEX idx_remember_tokens_expires ON auth.transaksi_remember_tokens(expires_at);
CREATE INDEX idx_kode_verifikasi_email ON auth.transaksi_kode_verifikasi(email);
CREATE INDEX idx_kode_verifikasi_expires ON auth.transaksi_kode_verifikasi(expires_at);

CREATE INDEX idx_lokasi_region ON user_mgmt.master_lokasi(provinsi, kabupaten_kota, kecamatan);
CREATE INDEX idx_pelakuumkm_akun ON user_mgmt.master_pelakuumkm(akun_id);
CREATE INDEX idx_umkm_pelaku ON user_mgmt.master_umkm(pelaku_umkm_id);
CREATE INDEX idx_umkm_status ON user_mgmt.master_umkm(status_umkm_id);
CREATE INDEX idx_umkm_lokasi ON user_mgmt.master_umkm(lokasi_id);
CREATE INDEX idx_umkm_kategori ON user_mgmt.master_umkm(kategori_usaha_id);
CREATE INDEX idx_produk_umkm ON user_mgmt.master_produkumkm(umkm_id);
CREATE INDEX idx_mitra_status ON user_mgmt.master_mitra(status_mitra_id);
CREATE INDEX idx_mitra_lokasi ON user_mgmt.master_mitra(lokasi_id);
CREATE INDEX idx_mitra_jenis ON user_mgmt.master_mitra(jenis_mitra_id);
CREATE INDEX idx_registrasi_status ON user_mgmt.transaksi_registrasipengguna(status_verifikasi_id);
CREATE INDEX idx_registrasi_submit ON user_mgmt.transaksi_registrasipengguna(tanggal_submit);

CREATE INDEX idx_dokumenterunggah_owner ON document.transaksi_dokumenterunggah(owner_type, owner_id);
CREATE INDEX idx_dokumenterunggah_context ON document.transaksi_dokumenterunggah(context_type, context_id);
CREATE INDEX idx_dokumenterunggah_uploader ON document.transaksi_dokumenterunggah(uploader_akun_id);
CREATE INDEX idx_dokumenterunggah_status ON document.transaksi_dokumenterunggah(status_dokumen_id);

CREATE INDEX idx_pelatihan_status ON training.master_programpelatihan(status_pelatihan_id);
CREATE INDEX idx_modul_pelatihan ON training.master_modulpelatihan(pelatihan_id);
CREATE INDEX idx_assignment_pelatihan ON training.master_assignmentpelatihan(pelatihan_id);
CREATE INDEX idx_pendaftaran_umkm ON training.transaksi_pendaftaranpelatihan(umkm_id);
CREATE INDEX idx_pendaftaran_pelatihan ON training.transaksi_pendaftaranpelatihan(pelatihan_id);
CREATE INDEX idx_pendaftaran_status ON training.transaksi_pendaftaranpelatihan(status_pendaftaran_pelatihan_id);
CREATE INDEX idx_submission_assignment ON training.transaksi_submissionassignment(assignment_id);
CREATE INDEX idx_submission_status ON training.transaksi_submissionassignment(status_submission_id);
CREATE INDEX idx_sertifikat_status ON training.transaksi_sertifikatpelatihan(status_sertifikat_id);

CREATE INDEX idx_pengajuan_umkm ON partnership.transaksi_pengajuankerjasama(umkm_id);
CREATE INDEX idx_pengajuan_mitra ON partnership.transaksi_pengajuankerjasama(mitra_id);
CREATE INDEX idx_pengajuan_status ON partnership.transaksi_pengajuankerjasama(status_pengajuan_id);
CREATE INDEX idx_pengajuan_created ON partnership.transaksi_pengajuankerjasama(created_at);

CREATE INDEX idx_monitoring_umkm_created ON dashboard.transaksi_monitoringperkembangan(umkm_id, created_at DESC);
CREATE INDEX idx_monitoring_status ON dashboard.transaksi_monitoringperkembangan(status_perkembangan_id);
CREATE INDEX idx_notifications_recipient_unread ON notification.notifications(recipient_akun_id, read_at, created_at DESC);
CREATE INDEX idx_email_outbox_status ON notification.email_outbox(status, scheduled_at);
CREATE INDEX idx_audit_actor_created ON audit.audit_logs(actor_akun_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit.audit_logs(entity_schema, entity_table, entity_id);

-- ============================================================

CREATE INDEX IF NOT EXISTS idx_monitoring_created ON dashboard.transaksi_monitoringperkembangan(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_laba ON dashboard.transaksi_monitoringperkembangan(laba_harian);
CREATE INDEX IF NOT EXISTS idx_umkm_tanggal_terdaftar ON user_mgmt.master_umkm(tanggal_terdaftar);
CREATE INDEX IF NOT EXISTS idx_umkm_deleted ON user_mgmt.master_umkm(is_deleted);
