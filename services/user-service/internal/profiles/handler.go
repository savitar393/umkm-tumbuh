package profiles

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	switch user.Role {
	case "UMKM":
		profile, err := h.getUMKMProfile(r.Context(), user.ID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		writeJSON(w, http.StatusNotImplemented, map[string]string{
			"error": "Profil Mitra belum diimplementasikan pada production schema.",
		})

	default:
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Role ini tidak memiliki profil pengguna.",
		})
	}
}

func (h *Handler) UpsertMe(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var req UpsertProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid."})
		return
	}

	switch user.Role {
	case "UMKM":
		if strings.TrimSpace(req.BusinessName) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Nama usaha wajib diisi."})
			return
		}

		if !isValidNIK(req.NIK) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "NIK wajib diisi 16 digit angka."})
			return
		}

		if strings.TrimSpace(req.OwnerName) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Nama pemilik wajib diisi."})
			return
		}

		if strings.TrimSpace(req.PhoneNumber) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Nomor HP wajib diisi."})
			return
		}

		if strings.TrimSpace(req.Address) == "" || strings.TrimSpace(req.City) == "" || strings.TrimSpace(req.Province) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Alamat, kota/kabupaten, dan provinsi wajib diisi."})
			return
		}

		profile, err := h.upsertUMKMProfile(r.Context(), user.ID, req)
		if err != nil {
			log.Printf("failed to upsert UMKM profile: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan profil UMKM."})
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		writeJSON(w, http.StatusNotImplemented, map[string]string{
			"error": "Profil Mitra belum diimplementasikan pada production schema.",
		})

	default:
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Role ini tidak dapat mengelola profil.",
		})
	}
}

func (h *Handler) getUMKMProfile(ctx context.Context, accountID string) (map[string]any, error) {
	row := h.DB.QueryRow(ctx, `
		SELECT
			u.umkm_id,
			p.akun_id,
			u.nama_umkm,
			k.nama_kategori_usaha,
			u.deskripsi_usaha,
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
		JOIN ref.ref_kategoriusaha k
			ON k.kategori_usaha_id = u.kategori_usaha_id
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, accountID)

	return scanUMKMProfile(row)
}

func (h *Handler) upsertUMKMProfile(ctx context.Context, accountID string, req UpsertProfileRequest) (map[string]any, error) {
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	account, err := getAccount(ctx, tx, accountID)
	if err != nil {
		return nil, err
	}

	categoryID, err := ensureBusinessCategory(ctx, tx, req.BusinessCategory)
	if err != nil {
		return nil, err
	}

	ids, err := getExistingUMKMIDs(ctx, tx, accountID)
	if err != nil {
		return nil, err
	}

	if ids.PelakuUMKMID == "" {
		ids.PelakuUMKMID = newID("PLK")
	}

	if ids.LokasiID == "" {
		ids.LokasiID = newID("LOK")
	}

	if ids.UMKMID == "" {
		ids.UMKMID = newID("UMKM")
	}

	address := trim(req.Address)
	city := trim(req.City)
	province := trim(req.Province)
	district := valueOrDefault(req.District, "BELUM DIISI")
	village := valueOrDefault(req.Village, "BELUM DIISI")
	postalCode := nullableTrim(req.PostalCode)

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_lokasi (
			lokasi_id, provinsi, kabupaten_kota, kecamatan,
			kelurahan, kode_pos, alamat_detail
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (lokasi_id)
		DO UPDATE SET
			provinsi = EXCLUDED.provinsi,
			kabupaten_kota = EXCLUDED.kabupaten_kota,
			kecamatan = EXCLUDED.kecamatan,
			kelurahan = EXCLUDED.kelurahan,
			kode_pos = EXCLUDED.kode_pos,
			alamat_detail = EXCLUDED.alamat_detail,
			updated_at = NOW()
	`, ids.LokasiID, province, city, district, village, postalCode, address)
	if err != nil {
		return nil, err
	}

	ownerName := trim(req.OwnerName)
	phoneNumber := trim(req.PhoneNumber)
	nik := trim(req.NIK)

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_pelakuumkm (
			pelaku_umkm_id, akun_id, nama_pelaku, nik,
			no_hp, email, alamat, status_aktif
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
		ON CONFLICT (akun_id)
		DO UPDATE SET
			nama_pelaku = EXCLUDED.nama_pelaku,
			nik = EXCLUDED.nik,
			no_hp = EXCLUDED.no_hp,
			email = EXCLUDED.email,
			alamat = EXCLUDED.alamat,
			status_aktif = TRUE,
			is_deleted = FALSE,
			deleted_at = NULL,
			updated_at = NOW()
	`, ids.PelakuUMKMID, accountID, ownerName, nik, phoneNumber, account.Email, address)
	if err != nil {
		return nil, err
	}

	businessName := trim(req.BusinessName)
	businessDescription := nullableTrim(req.BusinessDescription)

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_umkm (
			umkm_id, kode_umkm, pelaku_umkm_id, lokasi_id,
			jenis_umkm_id, skala_usaha_id, kategori_usaha_id,
			status_umkm_id, nama_umkm, deskripsi_usaha,
			nomor_whatsapp, email_bisnis, tanggal_terdaftar
		)
		VALUES (
			$1, $2, $3, $4,
			'UMKM', 'MIKRO', $5,
			'AKTIF', $6, $7,
			$8, $9, CURRENT_DATE
		)
		ON CONFLICT (umkm_id)
		DO UPDATE SET
			lokasi_id = EXCLUDED.lokasi_id,
			kategori_usaha_id = EXCLUDED.kategori_usaha_id,
			nama_umkm = EXCLUDED.nama_umkm,
			deskripsi_usaha = EXCLUDED.deskripsi_usaha,
			nomor_whatsapp = EXCLUDED.nomor_whatsapp,
			email_bisnis = EXCLUDED.email_bisnis,
			is_deleted = FALSE,
			deleted_at = NULL,
			updated_at = NOW()
	`, ids.UMKMID, "KODE-"+ids.UMKMID, ids.PelakuUMKMID, ids.LokasiID, categoryID, businessName, businessDescription, phoneNumber, account.Email)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE user_mgmt.transaksi_registrasipengguna
		SET
			umkm_id = $2,
			mitra_id = NULL,
			checklist_informasi_lengkap = TRUE
		WHERE akun_id = $1
	`, accountID, ids.UMKMID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return h.getUMKMProfile(ctx, accountID)
}

type accountInfo struct {
	ID    string
	Email string
	Role  string
}

func getAccount(ctx context.Context, tx pgx.Tx, accountID string) (accountInfo, error) {
	var account accountInfo

	err := tx.QueryRow(ctx, `
		SELECT akun_id, email::text, peran_id
		FROM auth.master_akunpengguna
		WHERE akun_id = $1
		  AND status_aktif = TRUE
	`, accountID).Scan(&account.ID, &account.Email, &account.Role)

	return account, err
}

type existingUMKMIDs struct {
	PelakuUMKMID string
	UMKMID       string
	LokasiID     string
}

func getExistingUMKMIDs(ctx context.Context, tx pgx.Tx, accountID string) (existingUMKMIDs, error) {
	var ids existingUMKMIDs

	err := tx.QueryRow(ctx, `
		SELECT
			p.pelaku_umkm_id,
			COALESCE(u.umkm_id, ''),
			COALESCE(u.lokasi_id, '')
		FROM user_mgmt.master_pelakuumkm p
		LEFT JOIN user_mgmt.master_umkm u
			ON u.pelaku_umkm_id = p.pelaku_umkm_id
			AND u.is_deleted = FALSE
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		LIMIT 1
	`, accountID).Scan(&ids.PelakuUMKMID, &ids.UMKMID, &ids.LokasiID)

	if errors.Is(err, pgx.ErrNoRows) {
		return existingUMKMIDs{}, nil
	}

	return ids, err
}

func ensureBusinessCategory(ctx context.Context, tx pgx.Tx, categoryName string) (string, error) {
	categoryName = strings.TrimSpace(categoryName)
	if categoryName == "" {
		categoryName = "Umum"
	}

	var existingID string
	err := tx.QueryRow(ctx, `
		SELECT kategori_usaha_id
		FROM ref.ref_kategoriusaha
		WHERE lower(nama_kategori_usaha) = lower($1)
		LIMIT 1
	`, categoryName).Scan(&existingID)

	if err == nil {
		return existingID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	categoryID := makeCategoryID(categoryName)

	_, err = tx.Exec(ctx, `
		INSERT INTO ref.ref_kategoriusaha (
			kategori_usaha_id, nama_kategori_usaha
		)
		VALUES ($1, $2)
		ON CONFLICT (kategori_usaha_id)
		DO UPDATE SET nama_kategori_usaha = EXCLUDED.nama_kategori_usaha
	`, categoryID, categoryName)

	return categoryID, err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanUMKMProfile(row scanner) (map[string]any, error) {
	var (
		id         string
		userID     string
		name       string
		category   string
		desc       *string
		ownerName  string
		nik        string
		phone      string
		address    string
		city       string
		province   string
		district   string
		village    string
		postalCode *string
		status     string
		createdAt  time.Time
		updatedAt  time.Time
	)

	if err := row.Scan(
		&id,
		&userID,
		&name,
		&category,
		&desc,
		&ownerName,
		&nik,
		&phone,
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

	return map[string]any{
		"id":                   id,
		"user_id":              userID,
		"business_name":        name,
		"business_category":    category,
		"business_description": desc,
		"owner_name":           ownerName,
		"nik":                  nik,
		"phone_number":         phone,
		"address":              address,
		"city":                 city,
		"province":             province,
		"district":             district,
		"village":              village,
		"postal_code":          postalCode,
		"status":               status,
		"created_at":           createdAt,
		"updated_at":           updatedAt,
	}, nil
}

func handleProfileError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Profil belum dibuat.",
		})
		return
	}

	log.Printf("failed to get profile: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{
		"error": "Gagal mengambil profil.",
	})
}

func trim(value string) string {
	return strings.TrimSpace(value)
}

func nullableTrim(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return &value
}

func valueOrDefault(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}

	return value
}

func isValidNIK(value string) bool {
	value = strings.TrimSpace(value)
	matched, _ := regexp.MatchString(`^[0-9]{16}$`, value)
	return matched
}

func newID(prefix string) string {
	raw := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	return prefix + raw[:16]
}

func makeCategoryID(categoryName string) string {
	categoryName = strings.ToUpper(strings.TrimSpace(categoryName))
	categoryName = strings.ReplaceAll(categoryName, " ", "_")

	var builder strings.Builder
	for _, r := range categoryName {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
			builder.WriteRune(r)
		}
	}

	result := builder.String()
	if result == "" {
		result = "UMUM"
	}

	if len(result) > 30 {
		result = result[:30]
	}

	return result
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
