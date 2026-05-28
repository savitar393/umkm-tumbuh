package profiles

type UpsertProfileRequest struct {
	BusinessName        string `json:"business_name"`
	BusinessCategory    string `json:"business_category"`
	BusinessDescription string `json:"business_description"`
	OwnerName           string `json:"owner_name"`

	OrganizationName string `json:"organization_name"`
	OrganizationType string `json:"organization_type"`
	Description      string `json:"description"`
	ContactPerson    string `json:"contact_person"`

	PhoneNumber string `json:"phone_number"`
	Address     string `json:"address"`
	City        string `json:"city"`
	Province    string `json:"province"`
}
