package access

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/middleware"
)

type queryRower interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

type Authorizer struct {
	db queryRower
}

func New(db queryRower) *Authorizer {
	return &Authorizer{db: db}
}

func RequireAdmin(ctx context.Context) error {
	if _, ok := middleware.GetUserID(ctx); !ok {
		return apperror.New(http.StatusUnauthorized, "User belum terautentikasi")
	}
	if role, _ := middleware.GetUserRole(ctx); role != "ADMIN" {
		return apperror.New(http.StatusForbidden, "Akses hanya untuk Admin")
	}
	return nil
}

func (a *Authorizer) AdminID(ctx context.Context) (string, error) {
	if err := RequireAdmin(ctx); err != nil {
		return "", err
	}
	actorID, _ := middleware.GetUserID(ctx)
	var adminID string
	err := a.db.QueryRow(ctx, `SELECT admin_id FROM auth.master_admin WHERE akun_id = $1`, actorID).Scan(&adminID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", apperror.New(http.StatusForbidden, "Profil admin tidak ditemukan")
	}
	return adminID, err
}

func (a *Authorizer) UMKM(ctx context.Context, id string, allowAdmin bool) error {
	const query = `SELECT EXISTS (
		SELECT 1 FROM user_mgmt.master_umkm u
		JOIN user_mgmt.master_pelakuumkm p ON p.pelaku_umkm_id = u.pelaku_umkm_id
		WHERE u.umkm_id = $1 AND p.akun_id = $2
		  AND NOT u.is_deleted AND NOT p.is_deleted
	)`
	return a.authorize(ctx, id, query, allowAdmin)
}

func (a *Authorizer) Enrollment(ctx context.Context, id string, allowAdmin bool) error {
	const query = `SELECT EXISTS (
		SELECT 1 FROM training.transaksi_pendaftaranpelatihan e
		JOIN user_mgmt.master_umkm u ON u.umkm_id = e.umkm_id
		JOIN user_mgmt.master_pelakuumkm p ON p.pelaku_umkm_id = u.pelaku_umkm_id
		WHERE e.pendaftaran_pelatihan_id = $1 AND p.akun_id = $2
		  AND NOT u.is_deleted AND NOT p.is_deleted
	)`
	return a.authorize(ctx, id, query, allowAdmin)
}

func (a *Authorizer) Certificate(ctx context.Context, id int64, allowAdmin bool) error {
	const query = `SELECT EXISTS (
		SELECT 1 FROM training.transaksi_sertifikatpelatihan c
		JOIN training.transaksi_pendaftaranpelatihan e ON e.pendaftaran_pelatihan_id = c.pendaftaran_pelatihan_id
		JOIN user_mgmt.master_umkm u ON u.umkm_id = e.umkm_id
		JOIN user_mgmt.master_pelakuumkm p ON p.pelaku_umkm_id = u.pelaku_umkm_id
		WHERE c.sertifikat_id = $1 AND p.akun_id = $2
		  AND NOT u.is_deleted AND NOT p.is_deleted
	)`
	return a.authorize(ctx, id, query, allowAdmin)
}

func (a *Authorizer) Document(ctx context.Context, id string) error {
	const query = `SELECT EXISTS (
		SELECT 1 FROM documents.master_dokumen
		WHERE dokumen_id = $1 AND uploader_akun_id = $2 AND status = 'AKTIF'
	)`
	return a.authorize(ctx, id, query, false)
}

func (a *Authorizer) authorize(ctx context.Context, id any, query string, allowAdmin bool) error {
	actorID, ok := middleware.GetUserID(ctx)
	if !ok {
		return apperror.New(http.StatusUnauthorized, "User belum terautentikasi")
	}
	role, _ := middleware.GetUserRole(ctx)
	if allowAdmin && role == "ADMIN" {
		return nil
	}
	if role != "UMKM" {
		return apperror.New(http.StatusForbidden, "Akses hanya untuk pemilik UMKM")
	}
	var owned bool
	if err := a.db.QueryRow(ctx, query, id, actorID).Scan(&owned); err != nil {
		return err
	}
	if !owned {
		return apperror.New(http.StatusForbidden, "Data tidak tersedia atau bukan milik Anda")
	}
	return nil
}
