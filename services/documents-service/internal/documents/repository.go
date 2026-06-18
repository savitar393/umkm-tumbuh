package documents

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Insert(ctx context.Context, doc *Document) error
	FindByID(ctx context.Context, id string) (*Document, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func generateDocumentID() string {
	now := time.Now()
	ts := now.Format("20060102150405")
	n := rand.Intn(100000)
	return fmt.Sprintf("DOC%s%05d", ts, n)
}

func (r *repository) Insert(ctx context.Context, doc *Document) error {
	doc.DokumenID = generateDocumentID()

	query := `
		INSERT INTO document.transaksi_dokumenterunggah (
			dokumen_id, jenis_dokumen_id, status_dokumen_id,
			uploader_akun_id, owner_type, owner_id,
			context_type, context_id,
			original_file_name, stored_file_name, file_extension, mime_type, file_size_bytes,
			bucket_name, object_key, storage_path, public_url,
			checksum_sha256, version_id, is_public, display_order, caption,
			uploaded_at, verified_at, expired_at, metadata_json
		) VALUES (
			$1, $2, $3,
			$4, $5, $6,
			$7, $8,
			$9, $10, $11, $12, $13,
			$14, $15, $16, $17,
			$18, $19, $20, $21, $22,
			$23, $24, $25, $26
		)
	`

	_, err := r.db.Exec(ctx, query,
		doc.DokumenID, doc.JenisDokumenID, doc.StatusDokumenID,
		doc.UploaderAkunID, doc.OwnerType, doc.OwnerID,
		doc.ContextType, doc.ContextID,
		doc.OriginalFileName, doc.StoredFileName, doc.FileExtension, doc.MimeType, doc.FileSizeBytes,
		doc.BucketName, doc.ObjectKey, doc.StoragePath, doc.PublicURL,
		doc.ChecksumSHA256, doc.VersionID, doc.IsPublic, doc.DisplayOrder, doc.Caption,
		doc.UploadedAt, doc.VerifiedAt, doc.ExpiredAt, doc.MetadataJSON,
	)

	if err != nil {
		return fmt.Errorf("failed to insert document: %w", err)
	}

	return nil
}

func (r *repository) FindByID(ctx context.Context, id string) (*Document, error) {
	query := `
		SELECT
			dokumen_id, jenis_dokumen_id, status_dokumen_id,
			uploader_akun_id, owner_type, owner_id,
			context_type, context_id,
			original_file_name, stored_file_name, file_extension, mime_type, file_size_bytes,
			bucket_name, object_key, storage_path, public_url,
			checksum_sha256, version_id, is_public, display_order, caption,
			uploaded_at, verified_at, expired_at, metadata_json
		FROM document.transaksi_dokumenterunggah
		WHERE dokumen_id = $1
	`

	var doc Document
	err := r.db.QueryRow(ctx, query, id).Scan(
		&doc.DokumenID, &doc.JenisDokumenID, &doc.StatusDokumenID,
		&doc.UploaderAkunID, &doc.OwnerType, &doc.OwnerID,
		&doc.ContextType, &doc.ContextID,
		&doc.OriginalFileName, &doc.StoredFileName, &doc.FileExtension, &doc.MimeType, &doc.FileSizeBytes,
		&doc.BucketName, &doc.ObjectKey, &doc.StoragePath, &doc.PublicURL,
		&doc.ChecksumSHA256, &doc.VersionID, &doc.IsPublic, &doc.DisplayOrder, &doc.Caption,
		&doc.UploadedAt, &doc.VerifiedAt, &doc.ExpiredAt, &doc.MetadataJSON,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("document not found: %s", id)
		}
		return nil, fmt.Errorf("failed to find document: %w", err)
	}

	return &doc, nil
}
