-- +goose Up

INSERT INTO ref.ref_jenismitra (jenis_mitra_id, nama_jenis_mitra)
VALUES
    ('PERUSAHAAN', 'Perusahaan'),
    ('KOPERASI', 'Koperasi'),
    ('KOMUNITAS', 'Komunitas'),
    ('LEMBAGA_PENDIDIKAN', 'Lembaga Pendidikan'),
    ('PEMERINTAH', 'Pemerintah'),
    ('LAINNYA', 'Lainnya')
ON CONFLICT (jenis_mitra_id) DO UPDATE
SET nama_jenis_mitra = EXCLUDED.nama_jenis_mitra;

INSERT INTO ref.ref_statusmitra (status_mitra_id, nama_status_mitra)
VALUES
    ('AKTIF', 'Aktif'),
    ('NONAKTIF', 'Nonaktif'),
    ('SUSPEND', 'Suspend'),
    ('ARSIP', 'Arsip')
ON CONFLICT (status_mitra_id) DO UPDATE
SET nama_status_mitra = EXCLUDED.nama_status_mitra;

INSERT INTO ref.ref_skalakerjasama (skala_kerjasama_id, nama_skala_kerjasama)
VALUES
    ('LOKAL', 'Lokal'),
    ('REGIONAL', 'Regional'),
    ('NASIONAL', 'Nasional'),
    ('INTERNASIONAL', 'Internasional')
ON CONFLICT (skala_kerjasama_id) DO UPDATE
SET nama_skala_kerjasama = EXCLUDED.nama_skala_kerjasama;
