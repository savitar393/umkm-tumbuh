-- +goose Down

DELETE FROM ref.ref_kategoriusaha
WHERE kategori_usaha_id IN (
    'UMUM',
    'MAKANAN',
    'MINUMAN',
    'FASHION',
    'KERAJINAN',
    'JASA',
    'PERTANIAN',
    'PERDAGANGAN'
);

DELETE FROM ref.ref_statusumkm
WHERE status_umkm_id IN ('AKTIF', 'NONAKTIF', 'SUSPEND', 'ARSIP');

DELETE FROM ref.ref_skalausaha
WHERE skala_usaha_id IN ('MIKRO', 'KECIL', 'MENENGAH');

DELETE FROM ref.ref_jenisumkm
WHERE jenis_umkm_id = 'UMKM';
