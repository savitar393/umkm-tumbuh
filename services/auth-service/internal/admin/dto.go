package admin

type RejectRegistrationRequest struct {
	RejectionReason string `json:"rejection_reason"`
	CatatanValidasi string `json:"catatan_validasi"`
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
		Pending  int `json:"pending"`
		Approved int `json:"approved"`
		Rejected int `json:"rejected"`
		Total    int `json:"total"`
	} `json:"data"`
}
