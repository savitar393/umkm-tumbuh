-- +goose Up

-- Partnership service table
-- ============================================================

CREATE TABLE partnership.transaksi_pengajuankerjasama (
    pengajuan_id VARCHAR(30) PRIMARY KEY,
    kode_pengajuan VARCHAR(50) NOT NULL UNIQUE,
    umkm_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_umkm(umkm_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    mitra_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_mitra(mitra_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    pengaju_akun_id VARCHAR(30) NOT NULL REFERENCES auth.master_akunpengguna(akun_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    penerima_akun_id VARCHAR(30) NOT NULL REFERENCES auth.master_akunpengguna(akun_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status_pengajuan_id VARCHAR(40) NOT NULL REFERENCES ref.ref_statuspengajuan(status_pengajuan_id) ON UPDATE CASCADE,
    pesan_pengajuan TEXT NOT NULL,
    catatan_keputusan TEXT,
    dokumen_perjanjian_id VARCHAR(30) REFERENCES document.transaksi_dokumenterunggah(dokumen_id) ON DELETE SET NULL ON UPDATE CASCADE,
    tanggal_pengajuan TIMESTAMPTZ NOT NULL,
    tanggal_keputusan TIMESTAMPTZ,
    tanggal_upload_dokumen TIMESTAMPTZ,
    tanggal_mulai_kerjasama DATE,
    tanggal_selesai_kerjasama DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_pengajuan_decision CHECK (tanggal_keputusan IS NULL OR tanggal_keputusan >= tanggal_pengajuan),
    CONSTRAINT ck_pengajuan_doc CHECK (tanggal_upload_dokumen IS NULL OR tanggal_keputusan IS NULL OR tanggal_upload_dokumen >= tanggal_keputusan),
    CONSTRAINT ck_pengajuan_period CHECK (tanggal_selesai_kerjasama IS NULL OR tanggal_mulai_kerjasama IS NULL OR tanggal_selesai_kerjasama >= tanggal_mulai_kerjasama),
    CONSTRAINT ck_pengajuan_distinct_accounts CHECK (pengaju_akun_id <> penerima_akun_id)
);

-- ============================================================
