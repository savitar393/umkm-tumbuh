package users

import "time"

const (
	RoleUMKM  = "UMKM"
	RoleMitra = "MITRA"
	RoleAdmin = "ADMIN"

	StatusPending  = "MENUNGGU"
	StatusApproved = "DISETUJUI"
	StatusRejected = "DITOLAK"
)

type User struct {
	ID              string
	FullName        string
	Email           string
	PhoneNumber     *string
	NIK             *string
	PasswordHash    string
	Role            string
	Status          string
	RejectionReason *string
	IsActive        bool
	SubmittedAt     *time.Time
	ReviewedAt      *time.Time
	ReviewedBy      *string
	CatatanValidasi *string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type Response struct {
	ID              string     `json:"id"`
	FullName        string     `json:"full_name"`
	Email           string     `json:"email"`
	PhoneNumber     *string    `json:"phone_number"`
	NIK             *string    `json:"nik"`
	Role            string     `json:"role"`
	Status          string     `json:"status"`
	RejectionReason *string    `json:"rejection_reason"`
	IsActive        bool       `json:"is_active"`
	SubmittedAt     *time.Time `json:"submitted_at,omitempty"`
	ReviewedAt      *time.Time `json:"reviewed_at,omitempty"`
	ReviewedBy      *string    `json:"reviewed_by,omitempty"`
	CatatanValidasi *string    `json:"catatan_validasi,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type RegistrationDetailResponse struct {
	User      Response `json:"user"`
	Profile   any      `json:"profile,omitempty"`
	Documents any      `json:"documents,omitempty"`
	Checklist any      `json:"checklist,omitempty"`
}

func ToResponse(user *User) Response {
	return Response{
		ID:              user.ID,
		FullName:        user.FullName,
		Email:           user.Email,
		PhoneNumber:     user.PhoneNumber,
		NIK:             user.NIK,
		Role:            user.Role,
		Status:          user.Status,
		RejectionReason: user.RejectionReason,
		IsActive:        user.IsActive,
		SubmittedAt:     user.SubmittedAt,
		ReviewedAt:      user.ReviewedAt,
		ReviewedBy:      user.ReviewedBy,
		CatatanValidasi: user.CatatanValidasi,
		CreatedAt:       user.CreatedAt,
		UpdatedAt:       user.UpdatedAt,
	}
}
