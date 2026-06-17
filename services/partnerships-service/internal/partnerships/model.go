package partnerships

import (
	"time"
)

type PartnershipStatus string

const (
	StatusDraft      PartnershipStatus = "DRAFT"
	StatusSubmitted  PartnershipStatus = "DIAJUKAN"
	StatusReviewed   PartnershipStatus = "DITINJAU"
	StatusApproved   PartnershipStatus = "APPROVED"
	StatusRejected   PartnershipStatus = "DITOLAK"
	StatusActive     PartnershipStatus = "AKTIF"
	StatusCompleted  PartnershipStatus = "SELESAI"
	StatusCancelled  PartnershipStatus = "DIBATALKAN"
	StatusWaitingDoc PartnershipStatus = "MENUNGGU_DOKUMEN_TTD"
)

type UserRole string

const (
	RoleUMKM  UserRole = "UMKM"
	RoleMitra UserRole = "MITRA"
)

type PartnershipRequest struct {
	ID                   string            `json:"id" db:"id"`
	RequestCode          string            `json:"request_code" db:"request_code"`
	RequesterID          string            `json:"requester_id" db:"requester_id"`
	ReceiverID           string            `json:"receiver_id" db:"receiver_id"`
	RequesterBusinessID  string            `json:"requester_business_id" db:"requester_business_id"`
	ReceiverBusinessID   string            `json:"receiver_business_id" db:"receiver_business_id"`
	RequesterRole        UserRole          `json:"requester_role" db:"requester_role"`
	ReceiverRole         UserRole          `json:"receiver_role" db:"receiver_role"`
	Category             string            `json:"category" db:"category"`
	ProposalTitle        string            `json:"proposal_title" db:"proposal_title"`
	ProposalDescription  string            `json:"proposal_description" db:"proposal_description"`
	BusinessName         string            `json:"business_name" db:"business_name"`
	ContactPerson        string            `json:"contact_person" db:"contact_person"`
	ProductDescription   string            `json:"product_description" db:"product_description"`
	ReasonForPartnership string            `json:"reason_for_partnership" db:"reason_for_partnership"`
	NIBKTPFile           string            `json:"nib_ktp_file" db:"nib_ktp_file"`
	ProposalFile         string            `json:"proposal_file" db:"proposal_file"`
	CertificateFile      *string           `json:"certificate_file" db:"certificate_file"`
	Status               PartnershipStatus `json:"status" db:"status"`
	RejectionReason      *string           `json:"rejection_reason" db:"rejection_reason"`
	ContractDocumentID   *string           `json:"contract_document_id" db:"contract_document_id"`
	SubmittedAt          *time.Time        `json:"submitted_at" db:"submitted_at"`
	DecidedAt            *time.Time        `json:"decided_at" db:"decided_at"`
	ContractSignedAt     *time.Time        `json:"contract_signed_at" db:"contract_signed_at"`
	PartnershipStart     *time.Time        `json:"partnership_start" db:"partnership_start"`
	PartnershipEnd       *time.Time        `json:"partnership_end" db:"partnership_end"`
	CreatedAt            time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time         `json:"updated_at" db:"updated_at"`
}

type CreatePartnershipRequest struct {
	ReceiverID          string `json:"receiver_id" validate:"required"`
	ProposalTitle       string    `json:"proposal_title" validate:"required,min=10,max=200"`
	ProposalDescription string    `json:"proposal_description" validate:"required,min=30,max=1000"`
	AttachmentFiles     []string  `json:"attachment_files,omitempty"`
}

type UpdatePartnershipStatus struct {
	Status          PartnershipStatus `json:"status" validate:"required,oneof=APPROVED REJECTED"`
	RejectionReason *string           `json:"rejection_reason,omitempty"`
}

type SignPartnershipRequest struct {
	DokumenKontrak string `json:"dokumen_kontrak" validate:"required"`
}

type PartnershipResponse struct {
	PartnershipRequest
	RequesterName string `json:"requester_name"`
	ReceiverName  string `json:"receiver_name"`
}

type PartnershipListResponse struct {
	ID                  string            `json:"id"`
	RequestCode         string            `json:"request_code"`
	RequesterName       string            `json:"requester_name"`
	ReceiverName        string            `json:"receiver_name"`
	RequesterBusinessName string          `json:"requester_business_name"`
	ReceiverBusinessName  string          `json:"receiver_business_name"`
	ProposalTitle       string            `json:"proposal_title"`
	Status              PartnershipStatus `json:"status"`
	SubmittedAt         *time.Time        `json:"submitted_at"`
	DecidedAt           *time.Time        `json:"decided_at"`
	Category            string            `json:"category"`
}

// ============================================================
// NEW STRUCTS FOR UMKM AND MITRA LISTS
// ============================================================

// UMKMListItem represents an UMKM entity for listing purposes
// Used when MITRA wants to see list of UMKM to partner with
type UMKMListItem struct {
	ID              string `json:"id"`                // umkm_id from database
	Name            string `json:"name"`              // nama_umkm
	Type            string `json:"type"`              // jenis UMKM (from ref table)
	City            string `json:"city"`              // kabupaten/kota
	Province        string `json:"province"`          // provinsi
	Description     string `json:"description"`       // deskripsi_usaha
	OperationalArea string `json:"operational_area"`  // wilayah_operasional
}

// MitraListItem represents a Mitra entity for listing purposes
// Used when UMKM wants to see list of Mitra to partner with
type MitraListItem struct {
	ID              string `json:"id"`                // mitra_id from database
	Name            string `json:"name"`              // nama_mitra
	Type            string `json:"type"`              // jenis mitra (from ref table)
	City            string `json:"city"`              // kabupaten/kota
	Province        string `json:"province"`          // provinsi
	Description     string `json:"description"`       // deskripsi_dukungan
	OperationalArea string `json:"operational_area"`  // wilayah_operasional
}

// UMKMDetail represents full detail of an UMKM
type UMKMDetail struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Type            string `json:"type"`
	City            string `json:"city"`
	Province        string `json:"province"`
	Description     string `json:"description"`
	OperationalArea string `json:"operational_area"`
	OwnerName       string `json:"owner_name"`
	PhoneNumber     string `json:"phone_number"`
	Email           string `json:"email"`
	Address         string `json:"address"`
	Products        string `json:"products"`
	YearEstablished int    `json:"year_established"`
}

// MitraDetail represents full detail of a Mitra
type MitraDetail struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Type              string `json:"type"`
	City              string `json:"city"`
	Province          string `json:"province"`
	Description       string `json:"description"`
	OperationalArea   string `json:"operational_area"`
	ContactPerson     string `json:"contact_person"`
	ContactTitle      string `json:"contact_title"`
	PhoneNumber       string `json:"phone_number"`
	Email             string `json:"email"`
	Address           string `json:"address"`
	LegalName         string `json:"legal_name"`
	NIB               string `json:"nib"`
	NPWP              string `json:"npwp"`
	CooperationScale  string `json:"cooperation_scale"`
}