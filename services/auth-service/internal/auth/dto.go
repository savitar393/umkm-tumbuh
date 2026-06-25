package auth

import "github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"

type RegisterRequest struct {
	FullName    string  `json:"full_name"`
	Email       string  `json:"email"`
	PhoneNumber *string `json:"phone_number"`
	NIK         *string `json:"nik"`
	Password    string  `json:"password"`
	Role        string  `json:"role"`
}

type LoginRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me,omitempty"`
}

type RegisterResponse struct {
	Message     string         `json:"message"`
	AccessToken string         `json:"access_token,omitempty"`
	TokenType   string         `json:"token_type,omitempty"`
	User        users.Response `json:"user"`
}

type TokenResponse struct {
	AccessToken  string         `json:"access_token"`
	TokenType    string         `json:"token_type"`
	RefreshToken string         `json:"refresh_token,omitempty"`
	User         users.Response `json:"user"`
}
