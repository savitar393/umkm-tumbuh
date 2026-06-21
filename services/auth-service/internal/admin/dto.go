package admin

type RejectRegistrationRequest struct {
	RejectionReason string `json:"rejection_reason"`
	CatatanValidasi string `json:"catatan_validasi"`
}

type DeactivateAccountRequest struct {
	Alasan          string `json:"alasan"`
	CatatanValidasi string `json:"catatan_validasi"`
}

type ReactivationRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ApproveRegistrationRequest struct {
	CatatanValidasi string `json:"catatan_validasi"`
}

type UserListResponse struct {
	Status string `json:"status"`
	Data   struct {
		Users      []any `json:"users"`
		Pagination struct {
			Page       int `json:"page"`
			Limit      int `json:"limit"`
			Total      int `json:"total"`
			TotalPages int `json:"total_pages"`
		} `json:"pagination"`
	} `json:"data"`
}

type UserDetailResponse struct {
	Status string `json:"status"`
	Data   any    `json:"data"`
}

type MessageResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type StatsResponse struct {
	Status string `json:"status"`
	Data   struct {
		Pending              int `json:"pending"`
		Approved             int `json:"approved"`
		Rejected             int `json:"rejected"`
		ReactivationRequested int `json:"reactivation_requested"`
		Total                int `json:"total"`
	} `json:"data"`
}

type ReactivationRequestResponse struct {
	Status string `json:"status"`
	Data   []any  `json:"data"`
}
