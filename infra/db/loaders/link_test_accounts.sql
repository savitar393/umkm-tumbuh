-- link_test_accounts.sql
-- Link test accounts to existing UMKM/Mitra seed data so dashboards show real data.

\set ON_ERROR_STOP on

-- ── Function to link one UMKM test account ──
CREATE OR REPLACE FUNCTION link_test_umkm(p_email TEXT, p_akun_id TEXT, p_umkm_id TEXT, p_umkm_name TEXT)
RETURNS VOID AS $$
DECLARE
  v_akun_id TEXT;
  v_template_akun TEXT := 'AKUN000251';
  v_template_umkm TEXT := 'UMK000001';
BEGIN
  SELECT akun_id INTO v_akun_id FROM auth.master_akunpengguna WHERE email = p_email;
  IF v_akun_id IS NULL THEN
    RAISE NOTICE 'Account % not found, skipping.', p_email;
    RETURN;
  END IF;

  -- Create pelaku UMKM (copy from template)
  INSERT INTO user_mgmt.master_pelakuumkm (
    pelaku_umkm_id, akun_id, nama_pelaku, nik, no_hp, email, alamat, status_aktif, created_at, updated_at
  )
  SELECT p_akun_id, v_akun_id, nama_pelaku, nik, no_hp, email, alamat, TRUE, NOW(), NOW()
  FROM user_mgmt.master_pelakuumkm WHERE akun_id = v_template_akun
  ON CONFLICT (akun_id) DO NOTHING;

  -- Create UMKM record (copy from template)
  INSERT INTO user_mgmt.master_umkm (
    umkm_id, kode_umkm, pelaku_umkm_id, lokasi_id,
    jenis_umkm_id, skala_usaha_id, kategori_usaha_id, status_umkm_id,
    nama_umkm, tanggal_terdaftar, created_at, updated_at
  )
  SELECT p_umkm_id, p_umkm_id, p_akun_id, lokasi_id,
    jenis_umkm_id, skala_usaha_id, kategori_usaha_id, status_umkm_id,
    p_umkm_name, tanggal_terdaftar, NOW(), NOW()
  FROM user_mgmt.master_umkm WHERE umkm_id = v_template_umkm
  ON CONFLICT (umkm_id) DO NOTHING;

  -- Copy monitoring data from template
  INSERT INTO dashboard.transaksi_monitoringperkembangan
    (umkm_id, status_perkembangan_id, laba_harian, jumlah_produk, created_at)
  SELECT p_umkm_id, status_perkembangan_id, laba_harian, jumlah_produk, created_at
  FROM dashboard.transaksi_monitoringperkembangan
  WHERE umkm_id = v_template_umkm
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'UMKM test linked: % → % (%)', p_email, p_umkm_id, p_umkm_name;
END;
$$ LANGUAGE plpgsql;

-- ── Function to link one MITRA test account ──
CREATE OR REPLACE FUNCTION link_test_mitra(p_email TEXT, p_akun_id TEXT, p_mitra_id TEXT, p_mitra_name TEXT)
RETURNS VOID AS $$
DECLARE
  v_akun_id TEXT;
  v_template_akun TEXT := 'AKUN005251';
  v_template_mitra TEXT := 'MTR000001';
BEGIN
  SELECT akun_id INTO v_akun_id FROM auth.master_akunpengguna WHERE email = p_email;
  IF v_akun_id IS NULL THEN
    RAISE NOTICE 'Account % not found, skipping.', p_email;
    RETURN;
  END IF;

  -- Create mitra record (copy from template)
  INSERT INTO user_mgmt.master_mitra (
    mitra_id, kode_mitra, akun_id, lokasi_id,
    jenis_mitra_id, status_mitra_id, skala_kerjasama_id,
    nama_mitra, nama_badan_hukum, nama_pic, jabatan_pic, kontak_pic, email_pic,
    alamat_mitra, status_verified, created_at, updated_at
  )
  SELECT p_mitra_id, p_mitra_id, v_akun_id, lokasi_id,
    jenis_mitra_id, status_mitra_id, skala_kerjasama_id,
    p_mitra_name, nama_badan_hukum, nama_pic, jabatan_pic, kontak_pic, email_pic,
    alamat_mitra, status_verified, NOW(), NOW()
  FROM user_mgmt.master_mitra WHERE mitra_id = v_template_mitra
  ON CONFLICT (akun_id) DO NOTHING;

  -- Copy active partnerships from template
  INSERT INTO partnership.transaksi_pengajuankerjasama (
    pengajuan_id, kode_pengajuan, umkm_id, mitra_id,
    pengaju_akun_id, penerima_akun_id, status_pengajuan_id,
    pesan_pengajuan, tanggal_pengajuan, created_at, updated_at
  )
  SELECT
    'PKS-' || p_mitra_id || '-' || ROW_NUMBER() OVER (ORDER BY pengajuan_id),
    'KS-' || p_mitra_id || '-' || ROW_NUMBER() OVER (ORDER BY pengajuan_id),
    umkm_id, p_mitra_id,
    v_akun_id, v_akun_id, status_pengajuan_id,
    pesan_pengajuan, tanggal_pengajuan, NOW(), NOW()
  FROM partnership.transaksi_pengajuankerjasama
  WHERE mitra_id = v_template_mitra
    AND status_pengajuan_id IN ('AKTIF', 'SELESAI')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Mitra test linked: % → % (%)', p_email, p_mitra_id, p_mitra_name;
END;
$$ LANGUAGE plpgsql;

-- ── Link UMKM test accounts ──
SELECT link_test_umkm('rezawahyuni525@umkm.id', 'PLK-TEST-RW01', 'UMK-TEST-RW01', 'Toko Reza Wahyuni');
SELECT link_test_umkm('umkm@test.com',       'PLK-TEST-UM01', 'UMK-TEST-UM01', 'Toko Test UMKM');

-- ── Link MITRA test accounts ──
SELECT link_test_mitra('fauzan.kusuma54@mitra.id', 'MTR-TEST-FK01', 'MTR-TEST-FK01', 'PT Fauzan Kusuma');
SELECT link_test_mitra('mitra@test.com',            'MTR-TEST-MT01', 'MTR-TEST-MT01', 'PT Test Mitra');

-- ── Cleanup ──
DROP FUNCTION link_test_umkm;
DROP FUNCTION link_test_mitra;

-- ── Verification ──
SELECT 'UMKM_README' AS role, a.akun_id, u.umkm_id, u.nama_umkm,
       (SELECT COUNT(*) FROM dashboard.transaksi_monitoringperkembangan WHERE umkm_id = u.umkm_id) AS data_monitoring
FROM auth.master_akunpengguna a
JOIN user_mgmt.master_pelakuumkm p ON p.akun_id = a.akun_id
JOIN user_mgmt.master_umkm u ON u.pelaku_umkm_id = p.pelaku_umkm_id
WHERE a.email = 'rezawahyuni525@umkm.id';

SELECT 'MITRA_README' AS role, a.akun_id, m.mitra_id, m.nama_mitra,
       (SELECT COUNT(*) FROM partnership.transaksi_pengajuankerjasama WHERE mitra_id = m.mitra_id) AS total_kerjasama
FROM auth.master_akunpengguna a
JOIN user_mgmt.master_mitra m ON m.akun_id = a.akun_id
WHERE a.email = 'fauzan.kusuma54@mitra.id';

\echo 'Test accounts linked successfully!'
