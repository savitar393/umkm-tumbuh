package model

import "time"

const (
	RoleUMKM  = "UMKM"
	RoleMitra = "MITRA"
	RoleAdmin = "ADMIN"

	StatusPending  = "PENDING"
	StatusApproved = "APPROVED"
	StatusRejected = "REJECTED"
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

type RegisterRequest struct {
	FullName    string  `json:"full_name"`
	Email       string  `json:"email"`
	PhoneNumber *string `json:"phone_number"`
	NIK         *string `json:"nik"`
	Password    string  `json:"password"`
	Role        string  `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserResponse struct {
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

type RegisterResponse struct {
	Message string       `json:"message"`
	User    UserResponse `json:"user"`
}

type TokenResponse struct {
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	User        UserResponse `json:"user"`
}

func ToUserResponse(user *User) UserResponse {
	return UserResponse{
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
