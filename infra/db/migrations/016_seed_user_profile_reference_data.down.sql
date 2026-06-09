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

-- +goose Up

INSERT INTO ref.ref_jenisumkm (jenis_umkm_id, nama_jenis_umkm)
VALUES
    ('KULINER', 'Kuliner'),
    ('FASHION', 'Fashion'),
    ('KRIYA', 'Kriya'),
    ('AGRIBISNIS', 'Agribisnis'),
    ('JASA', 'Jasa'),
    ('KECANTIKAN', 'Kecantikan'),
    ('OTOMOTIF', 'Otomotif'),
    ('DIGITAL', 'Digital'),
    ('EDUKASI', 'Edukasi'),
    ('KESEHATAN', 'Kesehatan'),
    ('PERDAGANGAN', 'Perdagangan'),
    ('KERAJINAN', 'Kerajinan')
ON CONFLICT (jenis_umkm_id) DO NOTHING;