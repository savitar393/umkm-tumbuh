-- +goose Down

DELETE FROM ref.ref_statussertifikat WHERE status_sertifikat_id IN ('TERBIT', 'DITOLAK');
DELETE FROM ref.ref_statussubmission WHERE status_submission_id IN ('BELUM_DIUPLOAD', 'DIREVIEW', 'LULUS', 'TIDAK_LULUS');
DELETE FROM ref.ref_statuspendaftaranpelatihan WHERE status_pendaftaran_pelatihan_id IN ('SELESAI', 'EXPIRED');
DELETE FROM ref.ref_statuspelatihan WHERE status_pelatihan_id IN ('DRAFT', 'PUBLISHED', 'ONGOING', 'ARCHIVED');
DELETE FROM ref.ref_jenispelatihan WHERE jenis_pelatihan_id IN ('ONLINE', 'OFFLINE', 'HYBRID');

-- ============================================================
