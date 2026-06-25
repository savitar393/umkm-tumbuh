package profiles

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
		profile, err := h.getMitraProfile(r.Context(), user.ID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

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
		if message := validateUMKMProfileRequest(req); message != "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": message})
			return
		}

		profile, err := h.upsertUMKMProfile(r.Context(), user.ID, req)
		if err != nil {
			handleUpsertProfileError(w, "UMKM", err)
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		if message := validateMitraProfileRequest(req); message != "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": message})
			return
		}

		profile, err := h.upsertMitraProfile(r.Context(), user.ID, req)
		if err != nil {
			handleUpsertProfileError(w, "Mitra", err)
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	default:
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Role ini tidak dapat mengelola profil.",
		})
	}
}

func (h *Handler) SubmitRegistration(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if user.Role != "UMKM" && user.Role != "MITRA" {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Role ini tidak dapat mengirim pendaftaran.",
		})
		return
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Gagal memulai submit pendaftaran.",
		})
		return
	}
	defer tx.Rollback(r.Context())

	var (
		checklistComplete bool
		umkmID            sql.NullString
		mitraID           sql.NullString
		status            string
	)

	err = tx.QueryRow(r.Context(), `
		SELECT
			checklist_informasi_lengkap,
			umkm_id,
			mitra_id,
			status_verifikasi_id
		FROM user_mgmt.transaksi_registrasipengguna
		WHERE akun_id = $1
		FOR UPDATE
	`, user.ID).Scan(&checklistComplete, &umkmID, &mitraID, &status)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusForbidden, map[string]string{
				"error": "Data registrasi belum dibuat.",
			})
			return
		}

		log.Printf("failed to read registration before submit: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Gagal membaca data registrasi.",
		})
		return
	}

	if !checklistComplete {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Profil belum lengkap. Lengkapi data terlebih dahulu.",
		})
		return
	}

	if user.Role == "UMKM" && !umkmID.Valid {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Profil UMKM belum lengkap.",
		})
		return
	}

	if user.Role == "MITRA" && !mitraID.Valid {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Profil Mitra belum lengkap.",
		})
		return
	}

	if status == "DISETUJUI" {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "Pendaftaran sudah disetujui.",
		})
		return
	}

	if status == "DITOLAK" {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "Pendaftaran sudah ditolak. Silakan ajukan ulang jika fitur re-submit sudah tersedia.",
		})
		return
	}

	_, err = tx.Exec(r.Context(), `
		UPDATE user_mgmt.transaksi_registrasipengguna
		SET
			status_verifikasi_id = 'MENUNGGU',
			tanggal_submit = NOW()
		WHERE akun_id = $1
	`, user.ID)
	if err != nil {
		log.Printf("failed to submit registration: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengirim pendaftaran.",
		})
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Gagal menyelesaikan submit pendaftaran.",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Pendaftaran berhasil dikirim. Menunggu review Admin.",
	})
}

func (h *Handler) getUMKMProfile(ctx context.Context, accountID string) (map[string]any, error) {
	row := h.DB.QueryRow(ctx, `
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

	businessEmail := nullableTrim(req.BusinessEmail)
	if businessEmail == nil {
		businessEmail = nullableTrim(account.Email)
	}

	var establishedYear any
	if req.EstablishedYear != nil {
		if *req.EstablishedYear < 1900 || *req.EstablishedYear > 2100 {
			return nil, errors.New("tahun berdiri harus berada di antara 1900 dan 2100")
		}
		establishedYear = *req.EstablishedYear
	}

	operatingHours := nullableTrim(req.OperatingHours)
	socialMediaMarketplace := nullableTrim(req.SocialMediaMarketplace)

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_umkm (
			umkm_id, kode_umkm, pelaku_umkm_id, lokasi_id,
			jenis_umkm_id, skala_usaha_id, kategori_usaha_id,
			status_umkm_id, nama_umkm, deskripsi_usaha,
			nomor_whatsapp, email_bisnis, tahun_berdiri,
			jam_operasional, media_sosial_marketplace,
			tanggal_terdaftar
		)
		VALUES (
			$1, $2, $3, $4,
			$5, 'MIKRO', $5,
			'AKTIF', $6, $7,
			$8, $9, $10,
			$11, $12,
			CURRENT_DATE
		)
		ON CONFLICT (umkm_id)
		DO UPDATE SET
			lokasi_id = EXCLUDED.lokasi_id,
			kategori_usaha_id = EXCLUDED.kategori_usaha_id,
			nama_umkm = EXCLUDED.nama_umkm,
			deskripsi_usaha = EXCLUDED.deskripsi_usaha,
			nomor_whatsapp = EXCLUDED.nomor_whatsapp,
			email_bisnis = EXCLUDED.email_bisnis,
			tahun_berdiri = EXCLUDED.tahun_berdiri,
			jam_operasional = EXCLUDED.jam_operasional,
			media_sosial_marketplace = EXCLUDED.media_sosial_marketplace,
			is_deleted = FALSE,
			deleted_at = NULL,
			updated_at = NOW()
	`, ids.UMKMID, "KODE-"+ids.UMKMID, ids.PelakuUMKMID, ids.LokasiID, categoryID, businessName, businessDescription, phoneNumber, businessEmail, establishedYear, operatingHours, socialMediaMarketplace)
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
		id                     string
		userID                 string
		name                   string
		category               string
		desc                   sql.NullString
		establishedYear        sql.NullInt16
		businessEmail          sql.NullString
		operatingHours         sql.NullString
		socialMediaMarketplace sql.NullString
		ownerName              string
		nik                    string
		phone                  string
		address                string
		city                   string
		province               string
		district               string
		village                string
		postalCode             sql.NullString
		status                 string
		createdAt              time.Time
		updatedAt              time.Time
	)

	if err := row.Scan(
		&id,
		&userID,
		&name,
		&category,
		&desc,
		&establishedYear,
		&businessEmail,
		&operatingHours,
		&socialMediaMarketplace,
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

	profile := map[string]any{
		"id":                       id,
		"user_id":                  userID,
		"business_name":            name,
		"business_category":        category,
		"business_description":     nil,
		"established_year":         nil,
		"business_email":           nil,
		"operating_hours":          nil,
		"social_media_marketplace": nil,
		"owner_name":               ownerName,
		"nik":                      nik,
		"phone_number":             phone,
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

	if desc.Valid {
		profile["business_description"] = desc.String
	}
	if establishedYear.Valid {
		profile["established_year"] = int(establishedYear.Int16)
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

func (h *Handler) getMitraProfile(ctx context.Context, accountID string) (map[string]any, error) {
	row := h.DB.QueryRow(ctx, `
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
	`, accountID)

	return scanMitraProfile(row)
}

func (h *Handler) upsertMitraProfile(ctx context.Context, accountID string, req UpsertProfileRequest) (map[string]any, error) {
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	account, err := getAccount(ctx, tx, accountID)
	if err != nil {
		return nil, err
	}

	mitraTypeID, err := ensureMitraType(ctx, tx, req.OrganizationType)
	if err != nil {
		return nil, err
	}

	cooperationScaleID, err := ensureCooperationScale(ctx, tx, req.CooperationScale)
	if err != nil {
		return nil, err
	}

	partnershipFieldID, err := ensurePartnershipField(ctx, tx, req.PartnershipField)
	if err != nil {
		return nil, err
	}

	supportTypeID, err := ensureSupportType(ctx, tx, req.SupportType)
	if err != nil {
		return nil, err
	}

	ids, err := getExistingMitraIDs(ctx, tx, accountID)
	if err != nil {
		return nil, err
	}

	if ids.MitraID == "" {
		ids.MitraID = newID("MTR")
	}

	if ids.LokasiID == "" {
		ids.LokasiID = newID("LOK")
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

	organizationName := trim(req.OrganizationName)
	contactPerson := trim(req.ContactPerson)
	phoneNumber := trim(req.PhoneNumber)

	nib, err := optionalFixedDigits(req.NIB, 13, "NIB perusahaan")
	if err != nil {
		return nil, err
	}

	npwp, err := optionalFixedDigits(req.NPWP, 15, "NPWP Badan")
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_mitra (
			mitra_id, kode_mitra, akun_id, lokasi_id,
			jenis_mitra_id, status_mitra_id, skala_kerjasama_id,
			nama_mitra, nama_badan_hukum, nib, npwp,
			nama_pic, jabatan_pic, kontak_pic, email_pic,
			alamat_mitra, wilayah_operasional, deskripsi_dukungan
		)
		VALUES (
			$1, $2, $3, $4,
			$5, 'AKTIF', $6,
			$7, $8, $9, $10,
			$11, $12, $13, $14,
			$15, $16, $17
		)
		ON CONFLICT (akun_id)
		DO UPDATE SET
			lokasi_id = EXCLUDED.lokasi_id,
			jenis_mitra_id = EXCLUDED.jenis_mitra_id,
			skala_kerjasama_id = EXCLUDED.skala_kerjasama_id,
			nama_mitra = EXCLUDED.nama_mitra,
			nama_badan_hukum = EXCLUDED.nama_badan_hukum,
			nib = EXCLUDED.nib,
			npwp = EXCLUDED.npwp,
			nama_pic = EXCLUDED.nama_pic,
			jabatan_pic = EXCLUDED.jabatan_pic,
			kontak_pic = EXCLUDED.kontak_pic,
			email_pic = EXCLUDED.email_pic,
			alamat_mitra = EXCLUDED.alamat_mitra,
			wilayah_operasional = EXCLUDED.wilayah_operasional,
			deskripsi_dukungan = EXCLUDED.deskripsi_dukungan,
			is_deleted = FALSE,
			deleted_at = NULL,
			updated_at = NOW()
	`, ids.MitraID, "KODE-"+ids.MitraID, accountID, ids.LokasiID,
		mitraTypeID, cooperationScaleID,
		organizationName, nullableTrim(req.LegalName), nullableTrim(nib), nullableTrim(npwp),
		contactPerson, nullableTrim(req.ContactPersonTitle), phoneNumber, account.Email,
		address, nullableTrim(req.OperationalArea), nullableTrim(req.SupportDescription),
	)
	if err != nil {
		return nil, err
	}

	if err := replaceMitraPartnershipField(ctx, tx, ids.MitraID, partnershipFieldID); err != nil {
		return nil, err
	}

	if err := replaceMitraSupportType(ctx, tx, ids.MitraID, supportTypeID); err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE user_mgmt.transaksi_registrasipengguna
		SET
			mitra_id = $2,
			umkm_id = NULL,
			checklist_informasi_lengkap = TRUE
		WHERE akun_id = $1
	`, accountID, ids.MitraID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return h.getMitraProfile(ctx, accountID)
}

type existingMitraIDs struct {
	MitraID  string
	LokasiID string
}

func getExistingMitraIDs(ctx context.Context, tx pgx.Tx, accountID string) (existingMitraIDs, error) {
	var ids existingMitraIDs

	err := tx.QueryRow(ctx, `
		SELECT mitra_id, lokasi_id
		FROM user_mgmt.master_mitra
		WHERE akun_id = $1
		  AND is_deleted = FALSE
		LIMIT 1
	`, accountID).Scan(&ids.MitraID, &ids.LokasiID)

	if errors.Is(err, pgx.ErrNoRows) {
		return existingMitraIDs{}, nil
	}

	return ids, err
}

func ensureMitraType(ctx context.Context, tx pgx.Tx, typeName string) (string, error) {
	typeName = strings.TrimSpace(typeName)
	if typeName == "" {
		typeName = "Lainnya"
	}

	var existingID string
	err := tx.QueryRow(ctx, `
		SELECT jenis_mitra_id
		FROM ref.ref_jenismitra
		WHERE lower(nama_jenis_mitra) = lower($1)
		LIMIT 1
	`, typeName).Scan(&existingID)

	if err == nil {
		return existingID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	typeID := makeCategoryID(typeName)

	_, err = tx.Exec(ctx, `
		INSERT INTO ref.ref_jenismitra (
			jenis_mitra_id, nama_jenis_mitra
		)
		VALUES ($1, $2)
		ON CONFLICT (jenis_mitra_id)
		DO UPDATE SET nama_jenis_mitra = EXCLUDED.nama_jenis_mitra
	`, typeID, typeName)

	return typeID, err
}

func ensureCooperationScale(ctx context.Context, tx pgx.Tx, scaleName string) (*string, error) {
	scaleName = strings.TrimSpace(scaleName)
	if scaleName == "" {
		defaultScale := "LOKAL"
		return &defaultScale, nil
	}

	var existingID string
	err := tx.QueryRow(ctx, `
		SELECT skala_kerjasama_id
		FROM ref.ref_skalakerjasama
		WHERE lower(nama_skala_kerjasama) = lower($1)
		   OR lower(skala_kerjasama_id) = lower($1)
		LIMIT 1
	`, scaleName).Scan(&existingID)

	if err == nil {
		return &existingID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	scaleID := makeCategoryID(scaleName)

	_, err = tx.Exec(ctx, `
		INSERT INTO ref.ref_skalakerjasama (
			skala_kerjasama_id, nama_skala_kerjasama
		)
		VALUES ($1, $2)
		ON CONFLICT (skala_kerjasama_id)
		DO UPDATE SET nama_skala_kerjasama = EXCLUDED.nama_skala_kerjasama
	`, scaleID, scaleName)

	return &scaleID, err
}

func ensurePartnershipField(ctx context.Context, tx pgx.Tx, fieldName string) (*string, error) {
	fieldName = strings.TrimSpace(fieldName)
	if fieldName == "" {
		return nil, nil
	}

	var existingID string
	err := tx.QueryRow(ctx, `
		SELECT bidang_kemitraan_id
		FROM ref.ref_bidangkemitraan
		WHERE lower(nama_bidang_kemitraan) = lower($1)
		   OR lower(bidang_kemitraan_id) = lower($1)
		LIMIT 1
	`, fieldName).Scan(&existingID)

	if err == nil {
		return &existingID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	fieldID := makeCategoryID(fieldName)

	_, err = tx.Exec(ctx, `
		INSERT INTO ref.ref_bidangkemitraan (
			bidang_kemitraan_id, nama_bidang_kemitraan
		)
		VALUES ($1, $2)
		ON CONFLICT (bidang_kemitraan_id)
		DO UPDATE SET nama_bidang_kemitraan = EXCLUDED.nama_bidang_kemitraan
	`, fieldID, fieldName)
	if err != nil {
		return nil, err
	}

	return &fieldID, nil
}

func ensureSupportType(ctx context.Context, tx pgx.Tx, supportName string) (*string, error) {
	supportName = strings.TrimSpace(supportName)
	if supportName == "" {
		return nil, nil
	}

	var existingID string
	err := tx.QueryRow(ctx, `
		SELECT bentuk_dukungan_id
		FROM ref.ref_bentukdukungan
		WHERE lower(nama_bentuk_dukungan) = lower($1)
		   OR lower(bentuk_dukungan_id) = lower($1)
		LIMIT 1
	`, supportName).Scan(&existingID)

	if err == nil {
		return &existingID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	supportID := makeCategoryID(supportName)

	_, err = tx.Exec(ctx, `
		INSERT INTO ref.ref_bentukdukungan (
			bentuk_dukungan_id, nama_bentuk_dukungan
		)
		VALUES ($1, $2)
		ON CONFLICT (bentuk_dukungan_id)
		DO UPDATE SET nama_bentuk_dukungan = EXCLUDED.nama_bentuk_dukungan
	`, supportID, supportName)
	if err != nil {
		return nil, err
	}

	return &supportID, nil
}

func replaceMitraPartnershipField(ctx context.Context, tx pgx.Tx, mitraID string, fieldID *string) error {
	_, err := tx.Exec(ctx, `
		DELETE FROM user_mgmt.master_mitrabidangkemitraan
		WHERE mitra_id = $1
	`, mitraID)
	if err != nil {
		return err
	}

	if fieldID == nil {
		return nil
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_mitrabidangkemitraan (
			mitra_id, bidang_kemitraan_id
		)
		VALUES ($1, $2)
		ON CONFLICT (mitra_id, bidang_kemitraan_id) DO NOTHING
	`, mitraID, *fieldID)

	return err
}

func replaceMitraSupportType(ctx context.Context, tx pgx.Tx, mitraID string, supportID *string) error {
	_, err := tx.Exec(ctx, `
		DELETE FROM user_mgmt.master_mitrabentukdukungan
		WHERE mitra_id = $1
	`, mitraID)
	if err != nil {
		return err
	}

	if supportID == nil {
		return nil
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_mitrabentukdukungan (
			mitra_id, bentuk_dukungan_id
		)
		VALUES ($1, $2)
		ON CONFLICT (mitra_id, bentuk_dukungan_id) DO NOTHING
	`, mitraID, *supportID)

	return err
}

func scanMitraProfile(row scanner) (map[string]any, error) {
	var (
		id                 string
		userID             string
		name               string
		organizationType   string
		legalName          *string
		nib                *string
		npwp               *string
		description        *string
		contactPerson      string
		contactPersonTitle *string
		phone              *string
		email              *string
		address            string
		city               string
		province           string
		district           string
		village            string
		postalCode         *string
		status             string
		operationalArea    *string
		cooperationScale   *string
		createdAt          time.Time
		updatedAt          time.Time
	)

	if err := row.Scan(
		&id,
		&userID,
		&name,
		&organizationType,
		&legalName,
		&nib,
		&npwp,
		&description,
		&contactPerson,
		&contactPersonTitle,
		&phone,
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
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}

	return map[string]any{
		"id":                   id,
		"user_id":              userID,
		"organization_name":    name,
		"organization_type":    organizationType,
		"legal_name":           legalName,
		"nib":                  nib,
		"npwp":                 npwp,
		"description":          description,
		"contact_person":       contactPerson,
		"contact_person_title": contactPersonTitle,
		"phone_number":         phone,
		"email":                email,
		"address":              address,
		"city":                 city,
		"province":             province,
		"district":             district,
		"village":              village,
		"postal_code":          postalCode,
		"status":               status,
		"operational_area":     operationalArea,
		"cooperation_scale":    cooperationScale,
		"created_at":           createdAt,
		"updated_at":           updatedAt,
	}, nil
}

func (h *Handler) ListMitra(w http.ResponseWriter, r *http.Request) {
	searchQuery := strings.TrimSpace(r.URL.Query().Get("q"))

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 9
	}

	offset := (page - 1) * limit

	query := `
		SELECT
			m.mitra_id,
			m.nama_mitra,
			j.nama_jenis_mitra,
			l.kabupaten_kota,
			l.provinsi,
			m.deskripsi_dukungan,
			m.wilayah_operasional,
			COUNT(*) OVER() as total_count
		FROM user_mgmt.master_mitra m
		JOIN user_mgmt.master_lokasi l ON l.lokasi_id = m.lokasi_id
		JOIN ref.ref_jenismitra j ON j.jenis_mitra_id = m.jenis_mitra_id
		WHERE m.is_deleted = FALSE
	`

	var args []interface{}
	argIndex := 1

	if searchQuery != "" {
		query += fmt.Sprintf(
			" AND (m.nama_mitra ILIKE $%d OR j.nama_jenis_mitra ILIKE $%d)",
			argIndex, argIndex,
		)
		args = append(args, "%"+searchQuery+"%")
		argIndex++
	}

	query += fmt.Sprintf(
		" ORDER BY m.nama_mitra ASC LIMIT $%d OFFSET $%d",
		argIndex, argIndex+1,
	)
	args = append(args, limit, offset)

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("failed to query mitra list: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal mengambil daftar mitra."})
		return
	}
	defer rows.Close()

	type mitraItem struct {
		ID              string  `json:"id"`
		Name            string  `json:"name"`
		Type            string  `json:"type"`
		City            string  `json:"city"`
		Province        string  `json:"province"`
		Description     *string `json:"description"`
		OperationalArea *string `json:"operational_area"`
	}

	var mitraList []mitraItem
	var totalCount int

	for rows.Next() {
		var item mitraItem
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Type,
			&item.City, &item.Province,
			&item.Description, &item.OperationalArea,
			&totalCount,
		); err != nil {
			log.Printf("failed to scan mitra row: %v", err)
			continue
		}
		mitraList = append(mitraList, item)
	}

	totalPages := (totalCount + limit - 1) / limit

	writeJSON(w, http.StatusOK, map[string]any{
		"mitra": mitraList,
		"pagination": map[string]int{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": totalPages,
		},
	})
}

func (h *Handler) ListUMKM(w http.ResponseWriter, r *http.Request) {
	searchQuery := strings.TrimSpace(r.URL.Query().Get("q"))

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 50 {
		limit = 9
	}

	offset := (page - 1) * limit

	query := `
		SELECT
			u.umkm_id,
			u.nama_umkm,
			k.nama_kategori_usaha,
			l.kabupaten_kota,
			l.provinsi,
			u.deskripsi_usaha,
			COUNT(*) OVER() as total_count
		FROM user_mgmt.master_umkm u
		JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
		JOIN ref.ref_kategoriusaha k ON k.kategori_usaha_id = u.kategori_usaha_id
		WHERE u.is_deleted = FALSE
	`

	var args []interface{}
	argIndex := 1

	if searchQuery != "" {
		query += fmt.Sprintf(
			" AND (u.nama_umkm ILIKE $%d OR k.nama_kategori_usaha ILIKE $%d)",
			argIndex, argIndex,
		)
		args = append(args, "%"+searchQuery+"%")
		argIndex++
	}

	query += fmt.Sprintf(
		" ORDER BY u.nama_umkm ASC LIMIT $%d OFFSET $%d",
		argIndex, argIndex+1,
	)
	args = append(args, limit, offset)

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		log.Printf("failed to query umkm list: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal mengambil daftar UMKM."})
		return
	}
	defer rows.Close()

	type umkmItem struct {
		ID          string  `json:"id"`
		Name        string  `json:"name"`
		Type        string  `json:"type"`
		City        string  `json:"city"`
		Province    string  `json:"province"`
		Description *string `json:"description"`
	}

	var umkmList []umkmItem
	var totalCount int

	for rows.Next() {
		var item umkmItem
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Type,
			&item.City, &item.Province,
			&item.Description,
			&totalCount,
		); err != nil {
			log.Printf("failed to scan umkm row: %v", err)
			continue
		}
		umkmList = append(umkmList, item)
	}

	totalPages := (totalCount + limit - 1) / limit

	writeJSON(w, http.StatusOK, map[string]any{
		"umkm": umkmList,
		"pagination": map[string]int{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": totalPages,
		},
	})
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

func optionalFixedDigits(value string, length int, fieldName string) (string, error) {
	digits := digitsOnly(strings.TrimSpace(value))

	if digits == "" {
		return "", nil
	}

	if len(digits) != length {
		return "", fmt.Errorf("%s wajib %d digit jika diisi", fieldName, length)
	}

	return digits, nil
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

func validateUMKMProfileRequest(req UpsertProfileRequest) string {
	if strings.TrimSpace(req.BusinessName) == "" {
		return "Nama usaha wajib diisi."
	}

	if strings.TrimSpace(req.BusinessCategory) == "" {
		return "Kategori usaha wajib diisi."
	}

	if strings.TrimSpace(req.BusinessDescription) == "" {
		return "Deskripsi usaha wajib diisi."
	}

	if strings.TrimSpace(req.OwnerName) == "" {
		return "Nama pemilik wajib diisi."
	}

	if !isValidNIK(req.NIK) {
		return "NIK wajib diisi 16 digit angka."
	}

	if !isValidPhoneNumber(req.PhoneNumber) {
		return "Nomor WhatsApp wajib 8–13 digit setelah kode +62."
	}

	if strings.TrimSpace(req.Address) == "" {
		return "Alamat usaha wajib diisi."
	}

	if strings.TrimSpace(req.City) == "" {
		return "Kota/kabupaten wajib diisi."
	}

	if strings.TrimSpace(req.Province) == "" {
		return "Provinsi wajib diisi."
	}

	return ""
}

func validateMitraProfileRequest(req UpsertProfileRequest) string {
	if strings.TrimSpace(req.OrganizationName) == "" {
		return "Nama organisasi wajib diisi."
	}

	if strings.TrimSpace(req.OrganizationType) == "" {
		return "Jenis mitra wajib dipilih."
	}

	if strings.TrimSpace(req.ContactPerson) == "" {
		return "Nama PIC wajib diisi."
	}

	if !isValidPhoneNumber(req.PhoneNumber) {
		return "Nomor WhatsApp PIC wajib 8–13 digit setelah kode +62."
	}

	if strings.TrimSpace(req.NIB) != "" && !isValidNIB(req.NIB) {
		return "NIB wajib 13 digit jika diisi."
	}

	if strings.TrimSpace(req.Address) == "" {
		return "Alamat kantor wajib diisi."
	}

	if strings.TrimSpace(req.City) == "" {
		return "Kota/kabupaten wajib diisi."
	}

	if strings.TrimSpace(req.Province) == "" {
		return "Provinsi wajib diisi."
	}

	if strings.TrimSpace(req.OperationalArea) == "" {
		return "Wilayah operasional wajib diisi."
	}

	if strings.TrimSpace(req.CooperationScale) == "" {
		return "Skala kerja sama wajib dipilih."
	}

	if strings.TrimSpace(req.SupportDescription) == "" {
		return "Deskripsi tujuan kemitraan wajib diisi."
	}

	return ""
}

func isValidEmail(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	_, err := mail.ParseAddress(value)
	return err == nil
}

func isValidPhoneNumber(value string) bool {
	digits := digitsOnly(value)

	if strings.HasPrefix(digits, "62") {
		digits = strings.TrimPrefix(digits, "62")
	}

	if strings.HasPrefix(digits, "0") {
		digits = strings.TrimPrefix(digits, "0")
	}

	return len(digits) >= 8 && len(digits) <= 13
}

func isValidNIB(value string) bool {
	return len(digitsOnly(value)) == 13
}

func digitsOnly(value string) string {
	var builder strings.Builder

	for _, char := range value {
		if char >= '0' && char <= '9' {
			builder.WriteRune(char)
		}
	}

	return builder.String()
}

func handleUpsertProfileError(w http.ResponseWriter, profileType string, err error) {
	var pgErr *pgconn.PgError

	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23503":
			log.Printf("failed to upsert %s profile: foreign key violation: %s", profileType, pgErr.Message)
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "Data referensi tidak valid. Periksa kategori, jenis mitra, atau skala kerja sama.",
			})
			return

		case "23505":
			log.Printf("failed to upsert %s profile: unique violation: %s", profileType, pgErr.Message)
			writeJSON(w, http.StatusConflict, map[string]string{
				"error": "Data profil sudah digunakan oleh akun lain.",
			})
			return

		case "23502":
			log.Printf("failed to upsert %s profile: not-null violation: %s", profileType, pgErr.Message)
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "Data profil belum lengkap.",
			})
			return
		}
	}

	log.Printf("failed to upsert %s profile: %v", profileType, err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{
		"error": "Gagal menyimpan profil. Coba lagi beberapa saat.",
	})
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
