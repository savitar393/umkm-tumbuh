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
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type Response struct {
	ID          string    `json:"id"`
	FullName    string    `json:"full_name"`
	Email       string    `json:"email"`
	PhoneNumber *string   `json:"phone_number"`
	NIK         *string   `json:"nik"`
	Role        string    `json:"role"`
	Status      string    `json:"status"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

func ToResponse(user *User) Response {
	return Response{
		ID:          user.ID,
		FullName:    user.FullName,
		Email:       user.Email,
		PhoneNumber: user.PhoneNumber,
		NIK:         user.NIK,
		Role:        user.Role,
		Status:      user.Status,
		IsActive:    user.IsActive,
		CreatedAt:   user.CreatedAt,
	}
}
