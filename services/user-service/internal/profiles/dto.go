package profiles

type UpsertProfileRequest struct {
	BusinessName           string `json:"business_name"`
	BusinessCategory       string `json:"business_category"`
	BusinessDescription    string `json:"business_description"`
	OwnerName              string `json:"owner_name"`
	NIK                    string `json:"nik"`
	EstablishedYear        *int   `json:"established_year"`
	BusinessEmail          string `json:"business_email"`
	OperatingHours         string `json:"operating_hours"`
	SocialMediaMarketplace string `json:"social_media_marketplace"`

	OrganizationName   string `json:"organization_name"`
	OrganizationType   string `json:"organization_type"`
	LegalName          string `json:"legal_name"`
	NIB                string `json:"nib"`
	NPWP               string `json:"npwp"`
	Description        string `json:"description"`
	ContactPerson      string `json:"contact_person"`
	ContactPersonTitle string `json:"contact_person_title"`
	OperationalArea    string `json:"operational_area"`
	SupportDescription string `json:"support_description"`
	CooperationScale   string `json:"cooperation_scale"`

	PhoneNumber string `json:"phone_number"`
	Address     string `json:"address"`
	City        string `json:"city"`
	Province    string `json:"province"`
	District    string `json:"district"`
	Village     string `json:"village"`
	PostalCode  string `json:"postal_code"`
}
