package documents

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	DB *pgxpool.Pool
}

func NewStore(db *pgxpool.Pool) *Store {
	return &Store{DB: db}
}

func (s *Store) Create(ctx context.Context, doc *Document) error {
	query := `
		INSERT INTO user_service.documents (
			id, user_id, document_type, file_name, file_path,
			file_size, mime_type, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := s.DB.Exec(ctx, query,
		doc.ID,
		doc.UserID,
		doc.DocumentType,
		doc.FileName,
		doc.FilePath,
		doc.FileSize,
		doc.MimeType,
		doc.Status,
	)
	return err
}

func (s *Store) FindByID(ctx context.Context, id string) (*Document, error) {
	query := `
		SELECT id, user_id, document_type, file_name, file_path,
		       file_size, mime_type, status,
		       created_at, updated_at
		FROM user_service.documents
		WHERE id = $1
	`

	row := s.DB.QueryRow(ctx, query, id)

	var doc Document
	var createdAt, updatedAt time.Time
	err := row.Scan(
		&doc.ID,
		&doc.UserID,
		&doc.DocumentType,
		&doc.FileName,
		&doc.FilePath,
		&doc.FileSize,
		&doc.MimeType,
		&doc.Status,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return nil, err
	}
	doc.CreatedAt = createdAt.Format(time.RFC3339)
	doc.UpdatedAt = updatedAt.Format(time.RFC3339)

	return &doc, nil
}

func (s *Store) FindByUserID(ctx context.Context, userID string) ([]Document, error) {
	query := `
		SELECT id, user_id, document_type, file_name, file_path,
		       file_size, mime_type, status,
		       created_at, updated_at
		FROM user_service.documents
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []Document
	for rows.Next() {
		var doc Document
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&doc.ID, &doc.UserID, &doc.DocumentType, &doc.FileName, &doc.FilePath,
			&doc.FileSize, &doc.MimeType, &doc.Status,
			&createdAt, &updatedAt,
		); err != nil {
			return nil, err
		}
		doc.CreatedAt = createdAt.Format(time.RFC3339)
		doc.UpdatedAt = updatedAt.Format(time.RFC3339)
		docs = append(docs, doc)
	}

	if docs == nil {
		docs = []Document{}
	}

	return docs, rows.Err()
}

func (s *Store) FindByUserIDAndType(ctx context.Context, userID string, docType DocumentType) (*Document, error) {
	query := `
		SELECT id, user_id, document_type, file_name, file_path,
		       file_size, mime_type, status,
		       created_at, updated_at
		FROM user_service.documents
		WHERE user_id = $1 AND document_type = $2
		ORDER BY created_at DESC
		LIMIT 1
	`

	row := s.DB.QueryRow(ctx, query, userID, docType)

	var doc Document
	var createdAt, updatedAt time.Time
	err := row.Scan(
		&doc.ID, &doc.UserID, &doc.DocumentType, &doc.FileName, &doc.FilePath,
		&doc.FileSize, &doc.MimeType, &doc.Status,
		&createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	doc.CreatedAt = createdAt.Format(time.RFC3339)
	doc.UpdatedAt = updatedAt.Format(time.RFC3339)

	return &doc, nil
}

func (s *Store) UpdateStatus(ctx context.Context, id string, status DocumentStatus) error {
	_, err := s.DB.Exec(ctx, `
		UPDATE user_service.documents
		SET status = $2, updated_at = NOW()
		WHERE id = $1
	`, id, status)
	return err
}

func (s *Store) Delete(ctx context.Context, id string) error {
	_, err := s.DB.Exec(ctx, `DELETE FROM user_service.documents WHERE id = $1`, id)
	return err
}

func (s *Store) GetChecklist(ctx context.Context, userID string, role string) ([]ChecklistItem, error) {
	var requiredDocs []DocumentType
	switch role {
	case "UMKM":
		requiredDocs = UMKMRequiredDocs()
	case "MITRA":
		requiredDocs = MitraRequiredDocs()
	default:
		return []ChecklistItem{}, nil
	}

	docs, err := s.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	docMap := make(map[string]*Document)
	for i := range docs {
		docMap[string(docs[i].DocumentType)] = &docs[i]
	}

	labels := map[DocumentType]string{
		DocNIB:              "Nomor Induk Berusaha (NIB) 13 digit",
		DocNPWP:             "NPWP Usaha",
		DocSIUP:             "SIUP / Izin Usaha",
		DocSertifikasiHalal: "Sertifikasi Halal",
		DocLegalitas:        "Legalitas Perusahaan",
		DocSuratKomitmen:    "Surat Komitmen",
		DocProfilPerusahaan: "Profil Perusahaan",
	}

	items := make([]ChecklistItem, 0, len(requiredDocs))
	for _, dt := range requiredDocs {
		item := ChecklistItem{Label: labels[dt]}
		if doc, ok := docMap[string(dt)]; ok {
			item.Uploaded = true
			item.DocID = doc.ID
		}
		items = append(items, item)
	}

	return items, nil
}

func GenerateFilePath(userID string, docType DocumentType, fileName string) string {
	ext := ""
	for i := len(fileName) - 1; i >= 0; i-- {
		if fileName[i] == '.' {
			ext = fileName[i:]
			break
		}
	}
	id := uuid.NewString()
	return fmt.Sprintf("%s/%s/%s%s", userID, docType, id, ext)
}
