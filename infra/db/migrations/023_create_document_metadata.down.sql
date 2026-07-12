DROP TRIGGER IF EXISTS trg_master_dokumen_updated_at ON documents.master_dokumen;
DROP FUNCTION IF EXISTS documents.set_updated_at();
DROP TABLE IF EXISTS documents.master_dokumen;
DROP SCHEMA IF EXISTS documents;
