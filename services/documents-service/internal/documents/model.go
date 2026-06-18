package documents

import (
	"time"
)

type DocumentType string

const (
	DocKTP                DocumentType = "KTP"
	DocNIB                DocumentType = "NIB"
	DocProposalKerjasama  DocumentType = "PROPOSAL_KERJASAMA"
	DocPerjanjianKerjasama DocumentType = "PERJANJIAN_KERJASAMA"
	DocSertifikatHalal    DocumentType = "SERTIFIKAT_HALAL"
	DocPIRT               DocumentType = "PIRT"
	DocLainnya            DocumentType = "DOKUMEN_PENDUKUNG"
)

type DocumentStatus string

const (
	StatusUploaded   DocumentStatus = "UPLOADED"
	StatusValid      DocumentStatus = "VALID"
	StatusInvalid    DocumentStatus = "INVALID"
	StatusExpired    DocumentStatus = "EXPIRED"
	StatusReplaced   DocumentStatus = "REPLACED"
	StatusDeleted    DocumentStatus = "DELETED"
)

type OwnerType string

const (
	OwnerUMKM              OwnerType = "UMKM"
	OwnerMitra             OwnerType = "MITRA"
	OwnerPengajuanKerjasama OwnerType = "PENGAJUAN_KERJASAMA"
)

type Document struct {
	DokumenID        string         `json:"dokumen_id"`
	JenisDokumenID   string         `json:"jenis_dokumen_id"`
	StatusDokumenID  string         `json:"status_dokumen_id"`
	UploaderAkunID   string         `json:"uploader_akun_id"`
	OwnerType        OwnerType      `json:"owner_type"`
	OwnerID          string         `json:"owner_id"`
	ContextType      string         `json:"context_type"`
	ContextID        *string        `json:"context_id,omitempty"`
	OriginalFileName string         `json:"original_file_name"`
	StoredFileName   string         `json:"stored_file_name"`
	FileExtension    string         `json:"file_extension"`
	MimeType         string         `json:"mime_type"`
	FileSizeBytes    int64          `json:"file_size_bytes"`
	BucketName       string         `json:"bucket_name"`
	ObjectKey        string         `json:"object_key"`
	StoragePath      string         `json:"storage_path"`
	PublicURL        *string        `json:"public_url,omitempty"`
	ChecksumSHA256   string         `json:"checksum_sha256"`
	VersionID        *string        `json:"version_id,omitempty"`
	IsPublic         bool           `json:"is_public"`
	DisplayOrder     int            `json:"display_order"`
	Caption          *string        `json:"caption,omitempty"`
	UploadedAt       time.Time      `json:"uploaded_at"`
	VerifiedAt       *time.Time     `json:"verified_at,omitempty"`
	ExpiredAt        *time.Time     `json:"expired_at,omitempty"`
	MetadataJSON     map[string]any `json:"metadata_json"`
}

type UploadRequest struct {
	JenisDokumenID string    `json:"jenis_dokumen_id"`
	UploaderAkunID string    `json:"uploader_akun_id"`
	OwnerType      OwnerType `json:"owner_type"`
	OwnerID        string    `json:"owner_id"`
	ContextType    string    `json:"context_type"`
	ContextID      *string   `json:"context_id,omitempty"`
	Caption        *string   `json:"caption,omitempty"`
	DisplayOrder   int       `json:"display_order"`
	IsPublic       bool      `json:"is_public"`
}

type UploadResponse struct {
	DokumenID        string `json:"dokumen_id"`
	OriginalFileName string `json:"original_file_name"`
	FileSizeBytes    int64  `json:"file_size_bytes"`
	MimeType         string `json:"mime_type"`
	ChecksumSHA256   string `json:"checksum_sha256"`
	StatusDokumenID  string `json:"status_dokumen_id"`
}
