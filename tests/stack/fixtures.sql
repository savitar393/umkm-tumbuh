\set ON_ERROR_STOP on
BEGIN;

-- These fixtures are only for the isolated Stage 1 test database.
DO $$
BEGIN
    IF current_database() <> 'umkm_tumbuh_test' THEN
        RAISE EXCEPTION 'Fixtures require the isolated umkm_tumbuh_test database';
    END IF;
END $$;

INSERT INTO auth.master_akunpengguna
    (akun_id, peran_id, nama_lengkap, email, no_hp, password_hash, email_verified_at)
SELECT id, role, name, email, phone, crypt('Stage1Test123!', gen_salt('bf', 10)), now()
FROM (VALUES
    ('TEST_ADMIN', 'ADMIN', 'Test Admin', 'admin@stage1.test', '080000000001'),
    ('TEST_UMKM_A', 'UMKM', 'Test UMKM A', 'umkm.a@stage1.test', '080000000002'),
    ('TEST_UMKM_B', 'UMKM', 'Test UMKM B', 'umkm.b@stage1.test', '080000000003'),
    ('TEST_MITRA_A', 'MITRA', 'Test Mitra A', 'mitra.a@stage1.test', '080000000004'),
    ('TEST_MITRA_B', 'MITRA', 'Test Mitra B', 'mitra.b@stage1.test', '080000000005'),
    ('TEST_ONBOARDING', 'UMKM', 'Test Onboarding', 'onboarding@stage1.test', '080000000006')
) AS fixtures(id, role, name, email, phone)
ON CONFLICT (akun_id) DO NOTHING;

INSERT INTO auth.master_admin (admin_id, akun_id, kode_admin)
VALUES ('TEST_ADMIN_PROFILE', 'TEST_ADMIN', 'TEST-ADMIN')
ON CONFLICT (admin_id) DO NOTHING;

INSERT INTO user_mgmt.master_lokasi
    (lokasi_id, provinsi, kabupaten_kota, kecamatan, kelurahan, alamat_detail)
SELECT id, 'Jawa Tengah', 'Surakarta', 'Test Kecamatan', 'Test Kelurahan', 'Alamat sintetis untuk pengujian'
FROM (VALUES ('TEST_LOCATION_A'), ('TEST_LOCATION_B')) AS fixtures(id)
ON CONFLICT (lokasi_id) DO NOTHING;

INSERT INTO user_mgmt.master_pelakuumkm
    (pelaku_umkm_id, akun_id, nama_pelaku, nik, no_hp, email)
VALUES
    ('TEST_OWNER_A', 'TEST_UMKM_A', 'Test UMKM A', '0000000000000001', '080000000002', 'umkm.a@stage1.test'),
    ('TEST_OWNER_B', 'TEST_UMKM_B', 'Test UMKM B', '0000000000000002', '080000000003', 'umkm.b@stage1.test')
ON CONFLICT (pelaku_umkm_id) DO NOTHING;

INSERT INTO user_mgmt.master_umkm
    (umkm_id, kode_umkm, pelaku_umkm_id, lokasi_id, jenis_umkm_id,
     skala_usaha_id, kategori_usaha_id, status_umkm_id, nama_umkm, status_verified)
VALUES
    ('TEST_BUSINESS_A', 'TEST-UMKM-A', 'TEST_OWNER_A', 'TEST_LOCATION_A', 'UMKM', 'MIKRO', 'UMUM', 'AKTIF', 'Usaha Test A', TRUE),
    ('TEST_BUSINESS_B', 'TEST-UMKM-B', 'TEST_OWNER_B', 'TEST_LOCATION_B', 'UMKM', 'MIKRO', 'UMUM', 'AKTIF', 'Usaha Test B', TRUE)
ON CONFLICT (umkm_id) DO NOTHING;

INSERT INTO user_mgmt.master_mitra
    (mitra_id, kode_mitra, akun_id, lokasi_id, jenis_mitra_id,
     status_mitra_id, skala_kerjasama_id, nama_mitra, nama_pic, status_verified)
VALUES
    ('TEST_PARTNER_A', 'TEST-MITRA-A', 'TEST_MITRA_A', 'TEST_LOCATION_A', 'PERUSAHAAN', 'AKTIF', 'LOKAL', 'Mitra Test A', 'PIC Test A', TRUE),
    ('TEST_PARTNER_B', 'TEST-MITRA-B', 'TEST_MITRA_B', 'TEST_LOCATION_B', 'PERUSAHAAN', 'AKTIF', 'LOKAL', 'Mitra Test B', 'PIC Test B', TRUE)
ON CONFLICT (mitra_id) DO NOTHING;

INSERT INTO user_mgmt.transaksi_registrasipengguna
    (akun_id, umkm_id, mitra_id, status_verifikasi_id, kode_registrasi,
     tanggal_submit, tanggal_review, tanggal_aktivasi, sudah_submit)
SELECT account, business, partner, 'DISETUJUI', registration, now(), now(), now(), TRUE
FROM (VALUES
    ('TEST_UMKM_A', 'TEST_BUSINESS_A', NULL, 'TEST_REG_UMKM_A'),
    ('TEST_UMKM_B', 'TEST_BUSINESS_B', NULL, 'TEST_REG_UMKM_B'),
    ('TEST_MITRA_A', NULL, 'TEST_PARTNER_A', 'TEST_REG_MITRA_A'),
    ('TEST_MITRA_B', NULL, 'TEST_PARTNER_B', 'TEST_REG_MITRA_B')
) AS fixtures(account, business, partner, registration)
ON CONFLICT (kode_registrasi) DO NOTHING;

-- Email verified, but no business profile or submitted application yet.
INSERT INTO user_mgmt.transaksi_registrasipengguna
    (akun_id, status_verifikasi_id, kode_registrasi, tanggal_submit, sudah_submit)
VALUES ('TEST_ONBOARDING', 'MENUNGGU', 'TEST_REG_ONBOARDING', now(), FALSE)
ON CONFLICT (kode_registrasi) DO NOTHING;

COMMIT;
