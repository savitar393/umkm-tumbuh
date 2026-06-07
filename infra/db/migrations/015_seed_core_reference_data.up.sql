-- +goose Up

INSERT INTO ref.ref_peranpengguna (peran_id, nama_peran)
VALUES
    ('ADMIN', 'Pemerintah/Admin'),
    ('UMKM', 'Pelaku UMKM'),
    ('MITRA', 'Mitra')
ON CONFLICT (peran_id) DO UPDATE
SET nama_peran = EXCLUDED.nama_peran;

INSERT INTO ref.ref_statusverifikasi (status_verifikasi_id, nama_status_verifikasi)
VALUES
    ('MENUNGGU', 'Menunggu Review'),
    ('DISETUJUI', 'Disetujui'),
    ('DITOLAK', 'Ditolak'),
    ('REVISI', 'Perlu Revisi'),
    ('AKTIF', 'Aktif'),
    ('DINONAKTIFKAN', 'Dinonaktifkan')
ON CONFLICT (status_verifikasi_id) DO UPDATE
SET nama_status_verifikasi = EXCLUDED.nama_status_verifikasi;
