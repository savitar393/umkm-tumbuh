-- +goose Down

DROP TABLE IF EXISTS ref.ref_dimwaktu CASCADE;
DROP TABLE IF EXISTS ref.ref_jenisdokumen CASCADE;
DROP TABLE IF EXISTS ref.ref_statusdokumen CASCADE;
DROP TABLE IF EXISTS ref.ref_statusverifikasi CASCADE;
DROP TABLE IF EXISTS ref.ref_statusperkembangan CASCADE;
DROP TABLE IF EXISTS ref.ref_statuspengajuan CASCADE;
DROP TABLE IF EXISTS ref.ref_statussertifikat CASCADE;
DROP TABLE IF EXISTS ref.ref_statussubmission CASCADE;
DROP TABLE IF EXISTS ref.ref_statuspendaftaranpelatihan CASCADE;
DROP TABLE IF EXISTS ref.ref_statuspelatihan CASCADE;
DROP TABLE IF EXISTS ref.ref_jenispelatihan CASCADE;
DROP TABLE IF EXISTS ref.ref_skalakerjasama CASCADE;
DROP TABLE IF EXISTS ref.ref_bentukdukungan CASCADE;
DROP TABLE IF EXISTS ref.ref_bidangkemitraan CASCADE;
DROP TABLE IF EXISTS ref.ref_statusmitra CASCADE;
DROP TABLE IF EXISTS ref.ref_jenismitra CASCADE;
DROP TABLE IF EXISTS ref.ref_statusumkm CASCADE;
DROP TABLE IF EXISTS ref.ref_kategoriproduk CASCADE;
DROP TABLE IF EXISTS ref.ref_kategoriusaha CASCADE;
DROP TABLE IF EXISTS ref.ref_skalausaha CASCADE;
DROP TABLE IF EXISTS ref.ref_jenisumkm CASCADE;
DROP TABLE IF EXISTS ref.ref_peranpengguna CASCADE;
