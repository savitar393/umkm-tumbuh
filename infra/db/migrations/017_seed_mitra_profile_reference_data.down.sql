-- +goose Down

DELETE FROM ref.ref_skalakerjasama
WHERE skala_kerjasama_id IN ('LOKAL', 'REGIONAL', 'NASIONAL', 'INTERNASIONAL');

DELETE FROM ref.ref_statusmitra
WHERE status_mitra_id IN ('AKTIF', 'NONAKTIF', 'SUSPEND', 'ARSIP');

DELETE FROM ref.ref_jenismitra
WHERE jenis_mitra_id IN (
    'PERUSAHAAN',
    'KOPERASI',
    'KOMUNITAS',
    'LEMBAGA_PENDIDIKAN',
    'PEMERINTAH',
    'LAINNYA'
);
