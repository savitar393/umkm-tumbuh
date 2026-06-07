-- +goose Down

DELETE FROM ref.ref_statusverifikasi
WHERE status_verifikasi_id IN (
    'MENUNGGU',
    'DISETUJUI',
    'DITOLAK',
    'REVISI',
    'AKTIF',
    'DINONAKTIFKAN'
);

DELETE FROM ref.ref_peranpengguna
WHERE peran_id IN ('ADMIN', 'UMKM', 'MITRA');
