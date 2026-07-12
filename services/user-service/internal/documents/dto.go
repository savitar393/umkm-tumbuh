package documents

type DocumentType string

const (
	DocNIB                DocumentType = "NIB"
	DocNPWP               DocumentType = "NPWP"
	DocSIUP               DocumentType = "SIUP"
	DocSertifikasiHalal   DocumentType = "SERTIFIKASI_HALAL"
	DocLegalitas          DocumentType = "LEGALITAS"
	DocSuratKomitmen      DocumentType = "SURAT_KOMITMEN"
	DocProfilPerusahaan   DocumentType = "PROFIL_PERUSAHAAN"
	DocLogo               DocumentType = "LOGO"
	DocFotoUsaha          DocumentType = "FOTO_USAHA"
)

type DocumentStatus string

const (
	StatusUploaded DocumentStatus = "UPLOADED"
	StatusVerified DocumentStatus = "VERIFIED"
	StatusRejected DocumentStatus = "REJECTED"
)

type Document struct {
	ID           string         `json:"id"`
	UserID       string         `json:"user_id"`
	DocumentType DocumentType   `json:"document_type"`
	FileName     string         `json:"file_name"`
	FilePath     string         `json:"file_path"`
	FileSize     int64          `json:"file_size"`
	MimeType     string         `json:"mime_type"`
	Status       DocumentStatus `json:"status"`
	CreatedAt    string         `json:"created_at"`
	UpdatedAt    string         `json:"updated_at"`
}

type DocumentResponse struct {
	ID           string         `json:"id"`
	UserID       string         `json:"user_id"`
	DocumentType DocumentType   `json:"document_type"`
	FileName     string         `json:"file_name"`
	FileSize     int64          `json:"file_size"`
	MimeType     string         `json:"mime_type"`
	Status       DocumentStatus `json:"status"`
	CreatedAt    string         `json:"created_at"`
	UpdatedAt    string         `json:"updated_at"`
}

type UploadDocumentRequest struct {
	DocumentType DocumentType `json:"document_type"`
}

type ChecklistItem struct {
	Label    string `json:"label"`
	Uploaded bool   `json:"uploaded"`
	DocID    string `json:"doc_id,omitempty"`
}

func ToResponse(d *Document) DocumentResponse {
	return DocumentResponse{
		ID:           d.ID,
		UserID:       d.UserID,
		DocumentType: d.DocumentType,
		FileName:     d.FileName,
		FileSize:     d.FileSize,
		MimeType:     d.MimeType,
		Status:       d.Status,
		CreatedAt:    d.CreatedAt,
		UpdatedAt:    d.UpdatedAt,
	}
}

func UMKMRequiredDocs() []DocumentType {
	return []DocumentType{DocNIB, DocNPWP, DocSIUP, DocSertifikasiHalal}
}

func MitraRequiredDocs() []DocumentType {
	return []DocumentType{DocLegalitas, DocSuratKomitmen, DocProfilPerusahaan}
}
