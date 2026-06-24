package auth

type RequestEmailVerificationRequest struct {
	Email string `json:"email"`
}

type ConfirmEmailVerificationRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}
