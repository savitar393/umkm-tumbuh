

-- Training service tables
-- ============================================================

CREATE TABLE training.master_programpelatihan (
    pelatihan_id VARCHAR(30) PRIMARY KEY,
    kode_pelatihan VARCHAR(50) NOT NULL UNIQUE,
    dibuat_oleh_admin_id VARCHAR(30) NOT NULL REFERENCES auth.master_admin(admin_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    jenis_pelatihan_id VARCHAR(30) NOT NULL REFERENCES ref.ref_jenispelatihan(jenis_pelatihan_id) ON UPDATE CASCADE,
    status_pelatihan_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statuspelatihan(status_pelatihan_id) ON UPDATE CASCADE,
    judul_pelatihan VARCHAR(200) NOT NULL,
    deskripsi_pelatihan TEXT,
    mentor_nama VARCHAR(150),
    durasi_jam INTEGER NOT NULL CHECK (durasi_jam > 0),
    total_modul INTEGER NOT NULL CHECK (total_modul >= 0),
    harga NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (harga = 0),
    akses_seumur_hidup BOOLEAN NOT NULL DEFAULT FALSE,
    masa_akses_hari INTEGER CHECK (masa_akses_hari IS NULL OR masa_akses_hari > 0),
    rating_rata_rata NUMERIC(3,2) CHECK (rating_rata_rata IS NULL OR rating_rata_rata BETWEEN 0 AND 5),
    jumlah_alumni INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_alumni >= 0),
    thumbnail_url TEXT,
    syarat_ketentuan TEXT,
    tanggal_publish TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE training.master_modulpelatihan (
    modul_id VARCHAR(30) PRIMARY KEY,
    pelatihan_id VARCHAR(30) NOT NULL REFERENCES training.master_programpelatihan(pelatihan_id) ON DELETE CASCADE ON UPDATE CASCADE,
    urutan_modul INTEGER NOT NULL CHECK (urutan_modul > 0),
    judul_modul VARCHAR(200) NOT NULL,
    deskripsi_modul TEXT,
    durasi_menit INTEGER NOT NULL CHECK (durasi_menit > 0),
    materi_url TEXT,
    is_preview BOOLEAN NOT NULL DEFAULT FALSE,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_modulpelatihan_order UNIQUE (pelatihan_id, urutan_modul)
);

CREATE TABLE training.master_assignmentpelatihan (
    assignment_id VARCHAR(30) PRIMARY KEY,
    pelatihan_id VARCHAR(30) NOT NULL REFERENCES training.master_programpelatihan(pelatihan_id) ON DELETE CASCADE ON UPDATE CASCADE,
    judul_assignment VARCHAR(200) NOT NULL,
    deskripsi_assignment TEXT,
    instruksi_submission TEXT NOT NULL,
    due_days_after_enroll INTEGER NOT NULL CHECK (due_days_after_enroll >= 0),
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE training.transaksi_pendaftaranpelatihan (
    pendaftaran_pelatihan_id VARCHAR(30) PRIMARY KEY,
    umkm_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_umkm(umkm_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    pelatihan_id VARCHAR(30) NOT NULL REFERENCES training.master_programpelatihan(pelatihan_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status_pendaftaran_pelatihan_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statuspendaftaranpelatihan(status_pendaftaran_pelatihan_id) ON UPDATE CASCADE,
    tanggal_daftar TIMESTAMPTZ NOT NULL,
    akses_mulai_at TIMESTAMPTZ,
    akses_berakhir_at TIMESTAMPTZ,
    terakhir_diakses_at TIMESTAMPTZ,
    progress_persen NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_persen BETWEEN 0 AND 100),
    modul_selesai INTEGER NOT NULL DEFAULT 0 CHECK (modul_selesai >= 0),
    total_modul_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (total_modul_snapshot >= 0),
    tanggal_selesai TIMESTAMPTZ,
    CONSTRAINT ck_pendaftaran_akses CHECK (akses_berakhir_at IS NULL OR akses_mulai_at IS NULL OR akses_berakhir_at >= akses_mulai_at),
    CONSTRAINT ck_pendaftaran_modul CHECK (modul_selesai <= total_modul_snapshot)
);

CREATE TABLE training.transaksi_submissionassignment (
    submission_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pendaftaran_pelatihan_id VARCHAR(30) NOT NULL REFERENCES training.transaksi_pendaftaranpelatihan(pendaftaran_pelatihan_id) ON DELETE CASCADE ON UPDATE CASCADE,
    assignment_id VARCHAR(30) NOT NULL REFERENCES training.master_assignmentpelatihan(assignment_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status_submission_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statussubmission(status_submission_id) ON UPDATE CASCADE,
    dokumen_id VARCHAR(30) REFERENCES document.transaksi_dokumenterunggah(dokumen_id) ON DELETE SET NULL ON UPDATE CASCADE,
    submission_link TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT ck_submission_review CHECK (reviewed_at IS NULL OR submitted_at IS NULL OR reviewed_at >= submitted_at)
);

CREATE TABLE training.transaksi_sertifikatpelatihan (
    sertifikat_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pendaftaran_pelatihan_id VARCHAR(30) NOT NULL REFERENCES training.transaksi_pendaftaranpelatihan(pendaftaran_pelatihan_id) ON DELETE CASCADE ON UPDATE CASCADE,
    status_sertifikat_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statussertifikat(status_sertifikat_id) ON UPDATE CASCADE,
    dokumen_id VARCHAR(30) REFERENCES document.transaksi_dokumenterunggah(dokumen_id) ON DELETE SET NULL ON UPDATE CASCADE,
    nomor_sertifikat VARCHAR(100),
    tanggal_pengajuan TIMESTAMPTZ,
    tanggal_terbit TIMESTAMPTZ,
    diverifikasi_oleh_admin_id VARCHAR(30) REFERENCES auth.master_admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE,
    catatan_validasi TEXT,
    CONSTRAINT ck_sertifikat_terbit CHECK (tanggal_terbit IS NULL OR tanggal_pengajuan IS NULL OR tanggal_terbit >= tanggal_pengajuan)
);

CREATE UNIQUE INDEX uq_sertifikat_nomor_nonempty
ON training.transaksi_sertifikatpelatihan(nomor_sertifikat)
WHERE nomor_sertifikat IS NOT NULL AND nomor_sertifikat <> '';

-- ============================================================
