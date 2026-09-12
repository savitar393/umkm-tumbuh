-- +goose Up

-- Partnership requests must work without the optional dummy CSV dataset.
-- Preserve reference labels already installed by that dataset or an operator.
INSERT INTO ref.ref_statuspengajuan (status_pengajuan_id, nama_status_pengajuan)
VALUES
    ('DRAFT', 'Draft'),
    ('DIAJUKAN', 'Diajukan'),
    ('DITINJAU', 'Ditinjau'),
    ('DITOLAK', 'Ditolak'),
    ('MENUNGGU_DOKUMEN_TTD', 'Menunggu Dokumen Ditandatangani'),
    ('AKTIF', 'Aktif'),
    ('SELESAI', 'Selesai'),
    ('DIBATALKAN', 'Dibatalkan')
ON CONFLICT (status_pengajuan_id) DO NOTHING;
