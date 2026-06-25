package adminprofiles

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) GetProfileByUserID(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	role := r.URL.Query().Get("role")

	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "userID required"})
		return
	}

	switch role {
	case "UMKM":
		profile, err := h.getUMKMProfile(r, userID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		profile, err := h.getMitraProfile(r, userID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	default:
		profile, umkmErr := h.getUMKMProfile(r, userID)
		if umkmErr == nil {
			writeJSON(w, http.StatusOK, map[string]any{"profile": profile})
			return
		}

		profile, mitraErr := h.getMitraProfile(r, userID)
		if mitraErr == nil {
			writeJSON(w, http.StatusOK, map[string]any{"profile": profile})
			return
		}

		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Profil tidak ditemukan."})
	}
}

func (h *Handler) getUMKMProfile(r *http.Request, userID string) (map[string]any, error) {
	row := h.DB.QueryRow(r.Context(), `
		SELECT
			u.umkm_id,
			p.akun_id,
			u.nama_umkm,
			k.nama_kategori_usaha,
			u.deskripsi_usaha,
			u.tahun_berdiri,
			u.email_bisnis::text,
			u.jam_operasional,
			u.media_sosial_marketplace,
			p.nama_pelaku,
			p.nik,
			p.no_hp,
			l.alamat_detail,
			l.kabupaten_kota,
			l.provinsi,
			l.kecamatan,
			l.kelurahan,
			l.kode_pos,
			u.status_umkm_id,
			u.created_at,
			u.updated_at
		FROM user_mgmt.master_pelakuumkm p
		JOIN user_mgmt.master_umkm u
			ON u.pelaku_umkm_id = p.pelaku_umkm_id
		JOIN user_mgmt.master_lokasi l
			ON l.lokasi_id = u.lokasi_id
		LEFT JOIN ref.ref_kategoriusaha k
			ON k.kategori_usaha_id = u.kategori_usaha_id
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, userID)

	return scanAdminUMKMProfile(row)
}

func (h *Handler) getMitraProfile(r *http.Request, userID string) (map[string]any, error) {
	row := h.DB.QueryRow(r.Context(), `
		SELECT
			m.mitra_id,
			m.akun_id,
			m.nama_mitra,
			j.nama_jenis_mitra,
			m.nama_badan_hukum,
			m.nib,
			m.npwp,
			m.deskripsi_dukungan,
			m.nama_pic,
			m.jabatan_pic,
			m.kontak_pic,
			m.email_pic::text,
			l.alamat_detail,
			l.kabupaten_kota,
			l.provinsi,
			l.kecamatan,
			l.kelurahan,
			l.kode_pos,
			m.status_mitra_id,
			m.wilayah_operasional,
			s.nama_skala_kerjasama,
			pf.nama_bidang_kemitraan,
			st.nama_bentuk_dukungan,
			m.created_at,
			m.updated_at
		FROM user_mgmt.master_mitra m
		JOIN user_mgmt.master_lokasi l
			ON l.lokasi_id = m.lokasi_id
		JOIN ref.ref_jenismitra j
			ON j.jenis_mitra_id = m.jenis_mitra_id
		LEFT JOIN ref.ref_skalakerjasama s
			ON s.skala_kerjasama_id = m.skala_kerjasama_id
		WHERE m.akun_id = $1
		  AND m.is_deleted = FALSE
		LIMIT 1
	`, userID)

	return scanAdminMitraProfile(row)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanProfile(row scanner) (map[string]any, error) {
	var (
		id        string
		userID    string
		name      string
		category  *string
		desc      *string
		person    *string
		phone     *string
		address   *string
		city      *string
		province  *string
		createdAt any
		updatedAt any
	)

	if err := row.Scan(
		&id,
		&userID,
		&name,
		&category,
		&desc,
		&person,
		&phone,
		&address,
		&city,
		&province,
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}

	return map[string]any{
		"id":           id,
		"user_id":      userID,
		"name":         name,
		"category":     category,
		"description":  desc,
		"person":       person,
		"phone_number": phone,
		"address":      address,
		"city":         city,
		"province":     province,
		"created_at":   createdAt,
		"updated_at":   updatedAt,
	}, nil
}

func scanAdminUMKMProfile(row scanner) (map[string]any, error) {
	var (
		id                     string
		userID                 string
		businessName           string
		businessCategory       sql.NullString
		businessDescription    sql.NullString
		establishedYear        sql.NullInt16
		businessEmail          sql.NullString
		operatingHours         sql.NullString
		socialMediaMarketplace sql.NullString
		ownerName              string
		nik                    string
		phoneNumber            string
		address                string
		city                   string
		province               string
		district               string
		village                string
		postalCode             sql.NullString
		status                 string
		createdAt              any
		updatedAt              any
	)

	if err := row.Scan(
		&id,
		&userID,
		&businessName,
		&businessCategory,
		&businessDescription,
		&establishedYear,
		&businessEmail,
		&operatingHours,
		&socialMediaMarketplace,
		&ownerName,
		&nik,
		&phoneNumber,
		&address,
		&city,
		&province,
		&district,
		&village,
		&postalCode,
		&status,
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}

	profile := map[string]any{
		"id":                       id,
		"user_id":                  userID,
		"business_name":            businessName,
		"business_category":        nil,
		"business_description":     nil,
		"established_year":         nil,
		"business_email":           nil,
		"operating_hours":          nil,
		"social_media_marketplace": nil,
		"owner_name":               ownerName,
		"nik":                      nik,
		"phone_number":             phoneNumber,
		"address":                  address,
		"city":                     city,
		"province":                 province,
		"district":                 district,
		"village":                  village,
		"postal_code":              nil,
		"status":                   status,
		"created_at":               createdAt,
		"updated_at":               updatedAt,
	}

	if businessCategory.Valid {
		profile["business_category"] = businessCategory.String
	}
	if businessDescription.Valid {
		profile["business_description"] = businessDescription.String
	}
	if establishedYear.Valid {
		profile["established_year"] = establishedYear.Int16
	}
	if businessEmail.Valid {
		profile["business_email"] = businessEmail.String
	}
	if operatingHours.Valid {
		profile["operating_hours"] = operatingHours.String
	}
	if socialMediaMarketplace.Valid {
		profile["social_media_marketplace"] = socialMediaMarketplace.String
	}
	if postalCode.Valid {
		profile["postal_code"] = postalCode.String
	}

	return profile, nil
}

func scanAdminMitraProfile(row scanner) (map[string]any, error) {
	var (
		id                 string
		userID             string
		organizationName   string
		organizationType   string
		legalName          sql.NullString
		nib                sql.NullString
		npwp               sql.NullString
		description        sql.NullString
		contactPerson      string
		contactPersonTitle sql.NullString
		phoneNumber        sql.NullString
		email              sql.NullString
		address            string
		city               string
		province           string
		district           string
		village            string
		postalCode         sql.NullString
		status             string
		operationalArea    sql.NullString
		cooperationScale   sql.NullString
		partnershipField   sql.NullString
		supportType        sql.NullString
		createdAt          any
		updatedAt          any
	)

	if err := row.Scan(
		&id,
		&userID,
		&organizationName,
		&organizationType,
		&legalName,
		&nib,
		&npwp,
		&description,
		&contactPerson,
		&contactPersonTitle,
		&phoneNumber,
		&email,
		&address,
		&city,
		&province,
		&district,
		&village,
		&postalCode,
		&status,
		&operationalArea,
		&cooperationScale,
		&partnershipField,
		&supportType,
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}

	profile := map[string]any{
		"id":                   id,
		"user_id":              userID,
		"organization_name":    organizationName,
		"organization_type":    organizationType,
		"legal_name":           nil,
		"nib":                  nil,
		"npwp":                 nil,
		"description":          nil,
		"contact_person":       contactPerson,
		"contact_person_title": nil,
		"phone_number":         nil,
		"email":                nil,
		"address":              address,
		"city":                 city,
		"province":             province,
		"district":             district,
		"village":              village,
		"postal_code":          nil,
		"status":               status,
		"operational_area":     nil,
		"cooperation_scale":    nil,
		"partnership_field":    nil,
		"support_type":         nil,
		"created_at":           createdAt,
		"updated_at":           updatedAt,
	}

	if legalName.Valid {
		profile["legal_name"] = legalName.String
	}
	if nib.Valid {
		profile["nib"] = nib.String
	}
	if npwp.Valid {
		profile["npwp"] = npwp.String
	}
	if description.Valid {
		profile["description"] = description.String
	}
	if contactPersonTitle.Valid {
		profile["contact_person_title"] = contactPersonTitle.String
	}
	if phoneNumber.Valid {
		profile["phone_number"] = phoneNumber.String
	}
	if email.Valid {
		profile["email"] = email.String
	}
	if postalCode.Valid {
		profile["postal_code"] = postalCode.String
	}
	if operationalArea.Valid {
		profile["operational_area"] = operationalArea.String
	}
	if cooperationScale.Valid {
		profile["cooperation_scale"] = cooperationScale.String
	}
	if partnershipField.Valid {
		profile["partnership_field"] = partnershipField.String
	}

	if supportType.Valid {
		profile["support_type"] = supportType.String
	}

	return profile, nil
}

func handleProfileError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Profil belum dibuat.",
		})
		return
	}

	writeJSON(w, http.StatusInternalServerError, map[string]string{
		"error": "Gagal mengambil profil.",
	})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
