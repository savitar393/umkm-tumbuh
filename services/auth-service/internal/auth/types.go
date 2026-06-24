package auth

type RequestEmailVerificationRequest struct {
	Email string `json:"email"`
}

type ConfirmEmailVerificationRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type RequestPasswordResetRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}
