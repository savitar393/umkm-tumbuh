-- +goose Up

INSERT INTO ref.ref_jenisumkm (jenis_umkm_id, nama_jenis_umkm)
VALUES
    ('UMKM', 'Usaha Mikro, Kecil, dan Menengah')
ON CONFLICT (jenis_umkm_id) DO UPDATE
SET nama_jenis_umkm = EXCLUDED.nama_jenis_umkm;

INSERT INTO ref.ref_skalausaha (skala_usaha_id, nama_skala_usaha)
VALUES
    ('MIKRO', 'Mikro'),
    ('KECIL', 'Kecil'),
    ('MENENGAH', 'Menengah')
ON CONFLICT (skala_usaha_id) DO UPDATE
SET nama_skala_usaha = EXCLUDED.nama_skala_usaha;

INSERT INTO ref.ref_statusumkm (status_umkm_id, nama_status_umkm)
VALUES
    ('AKTIF', 'Aktif'),
    ('NONAKTIF', 'Nonaktif'),
    ('SUSPEND', 'Suspend'),
    ('ARSIP', 'Arsip')
ON CONFLICT (status_umkm_id) DO UPDATE
SET nama_status_umkm = EXCLUDED.nama_status_umkm;

INSERT INTO ref.ref_kategoriusaha (kategori_usaha_id, nama_kategori_usaha)
VALUES
    ('UMUM', 'Umum'),
    ('MAKANAN', 'Makanan'),
    ('MINUMAN', 'Minuman'),
    ('FASHION', 'Fashion'),
    ('KERAJINAN', 'Kerajinan'),
    ('JASA', 'Jasa'),
    ('PERTANIAN', 'Pertanian'),
    ('PERDAGANGAN', 'Perdagangan')
ON CONFLICT (kategori_usaha_id) DO UPDATE
SET nama_kategori_usaha = EXCLUDED.nama_kategori_usaha;
