-- Link akun umkm@test.com ke data UMKM seed
DO $$
DECLARE
  v_akun_id TEXT;
BEGIN
  SELECT akun_id INTO v_akun_id 
  FROM auth.master_akunpengguna 
  WHERE email = 'umkm@test.com';

  -- Buat pelaku UMKM untuk akun test
  INSERT INTO user_mgmt.master_pelakuumkm (
    pelaku_umkm_id, akun_id, nama_pelaku, nik, no_hp, email, alamat, status_aktif, created_at, updated_at
  )
  SELECT 
    'PLK-TEST-UMKM01', v_akun_id, nama_pelaku, nik, no_hp, email, alamat, TRUE, NOW(), NOW()
  FROM user_mgmt.master_pelakuumkm 
  WHERE akun_id = 'AKUN000251'
  ON CONFLICT (akun_id) DO NOTHING;

  -- Buat UMKM yang terhubung ke pelaku test, copy dari UMK000001
  INSERT INTO user_mgmt.master_umkm (
    umkm_id, kode_umkm, pelaku_umkm_id, lokasi_id,
    jenis_umkm_id, skala_usaha_id, kategori_usaha_id, status_umkm_id,
    nama_umkm, tanggal_terdaftar, created_at, updated_at
  )
  SELECT 
    'UMK-TEST-001', 'UMKM-TEST-001', 'PLK-TEST-UMKM01', lokasi_id,
    jenis_umkm_id, skala_usaha_id, kategori_usaha_id, status_umkm_id,
    'Toko Test UMKM', tanggal_terdaftar, NOW(), NOW()
  FROM user_mgmt.master_umkm 
  WHERE umkm_id = 'UMK000001'
  ON CONFLICT (umkm_id) DO NOTHING;

  -- Salin data monitoring dari UMK000001 ke UMK-TEST-001
  INSERT INTO dashboard.transaksi_monitoringperkembangan 
    (umkm_id, status_perkembangan_id, laba_harian, jumlah_produk, created_at)
  SELECT 
    'UMK-TEST-001', status_perkembangan_id, laba_harian, jumlah_produk, created_at
  FROM dashboard.transaksi_monitoringperkembangan
  WHERE umkm_id = 'UMK000001';

  RAISE NOTICE 'UMKM test linked. akun_id = %', v_akun_id;
END $$;

-- Link akun mitra@test.com ke data mitra seed
DO $$
DECLARE
  v_akun_id TEXT;
  v_mitra_id TEXT;
BEGIN
  SELECT akun_id INTO v_akun_id 
  FROM auth.master_akunpengguna 
  WHERE email = 'mitra@test.com';

  -- Gunakan mitra AKUN005251 (MTR000001) sebagai template
  -- Update akun_id di master_mitra agar mitra@test.com punya mitra_id
  -- Cara paling bersih: insert mitra baru untuk akun test
  SELECT mitra_id INTO v_mitra_id
  FROM user_mgmt.master_mitra
  WHERE akun_id = 'AKUN005251'
  LIMIT 1;

  INSERT INTO user_mgmt.master_mitra (
    mitra_id, kode_mitra, akun_id, lokasi_id,
    jenis_mitra_id, status_mitra_id, skala_kerjasama_id,
    nama_mitra, nama_badan_hukum, nama_pic, jabatan_pic, kontak_pic, email_pic,
    alamat_mitra, status_verified, created_at, updated_at
  )
  SELECT
    'MTR-TEST-001', 'MITRA-TEST-001', v_akun_id, lokasi_id,
    jenis_mitra_id, status_mitra_id, skala_kerjasama_id,
    'PT Test Mitra', nama_badan_hukum, nama_pic, jabatan_pic, kontak_pic, email_pic,
    alamat_mitra, status_verified, NOW(), NOW()
  FROM user_mgmt.master_mitra
  WHERE mitra_id = v_mitra_id
  ON CONFLICT (akun_id) DO NOTHING;

  -- Salin pengajuan kerjasama dari mitra lama ke mitra test
  -- Ambil 10 kerjasama AKTIF dari mitra MTR000001
  INSERT INTO partnership.transaksi_pengajuankerjasama (
    pengajuan_id, kode_pengajuan, umkm_id, mitra_id,
    pengaju_akun_id, penerima_akun_id, status_pengajuan_id,
    pesan_pengajuan, tanggal_pengajuan, created_at, updated_at
  )
  SELECT
    'PKS-TEST-' || ROW_NUMBER() OVER (ORDER BY pengajuan_id),
    'KS-TEST-' || ROW_NUMBER() OVER (ORDER BY pengajuan_id),
    umkm_id, 'MTR-TEST-001',
    v_akun_id, v_akun_id, status_pengajuan_id,
    pesan_pengajuan, tanggal_pengajuan, NOW(), NOW()
  FROM partnership.transaksi_pengajuankerjasama
  WHERE mitra_id = v_mitra_id
    AND status_pengajuan_id IN ('AKTIF', 'SELESAI')
  LIMIT 10;

  RAISE NOTICE 'Mitra test linked. akun_id = %', v_akun_id;
END $$;

-- Verifikasi
SELECT 'UMKM' AS role, p.akun_id, u.umkm_id, u.nama_umkm,
       (SELECT COUNT(*) FROM dashboard.transaksi_monitoringperkembangan WHERE umkm_id = u.umkm_id) AS data_monitoring
FROM user_mgmt.master_pelakuumkm p
JOIN user_mgmt.master_umkm u ON u.pelaku_umkm_id = p.pelaku_umkm_id
WHERE p.akun_id = (SELECT akun_id FROM auth.master_akunpengguna WHERE email = 'umkm@test.com');

SELECT 'MITRA' AS role, m.akun_id, m.mitra_id, m.nama_mitra,
       (SELECT COUNT(*) FROM partnership.transaksi_pengajuankerjasama WHERE mitra_id = m.mitra_id) AS total_kerjasama
FROM user_mgmt.master_mitra m
WHERE m.akun_id = (SELECT akun_id FROM auth.master_akunpengguna WHERE email = 'mitra@test.com');
