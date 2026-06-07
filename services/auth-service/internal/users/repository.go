package users

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

func (r *Repository) Create(ctx context.Context, user *User) error {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	queryAccount := `
		INSERT INTO auth.master_akunpengguna (
			akun_id, peran_id, nama_lengkap, email, no_hp,
			password_hash, status_aktif
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	phoneNumber := ""
	if user.PhoneNumber != nil {
		phoneNumber = *user.PhoneNumber
	}

	if _, err := tx.Exec(
		ctx,
		queryAccount,
		user.ID,
		user.Role,
		user.FullName,
		user.Email,
		phoneNumber,
		user.PasswordHash,
		user.IsActive,
	); err != nil {
		return err
	}

	if user.Role == RoleAdmin {
		queryAdmin := `
			INSERT INTO auth.master_admin (
				admin_id, akun_id, kode_admin, is_active
			)
			VALUES ($1, $2, $3, 'active')
			ON CONFLICT (akun_id) DO NOTHING
		`

		if _, err := tx.Exec(ctx, queryAdmin, user.ID, user.ID, "ADM-"+user.ID); err != nil {
			return err
		}
	} else {
		queryRegistration := `
			INSERT INTO user_mgmt.transaksi_registrasipengguna (
				akun_id,
				status_verifikasi_id,
				kode_registrasi,
				tanggal_submit,
				checklist_informasi_lengkap
			)
			VALUES ($1, $2, $3, NOW(), FALSE)
		`

		registrationCode := fmt.Sprintf("REG-%s", user.ID)

		if _, err := tx.Exec(
			ctx,
			queryRegistration,
			user.ID,
			user.Status,
			registrationCode,
		); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := userSelectQuery() + `
		WHERE a.email = $1
		LIMIT 1
	`

	return scanUser(r.DB.QueryRow(ctx, query, email))
}

func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) {
	query := userSelectQuery() + `
		WHERE a.akun_id = $1
		LIMIT 1
	`

	return scanUser(r.DB.QueryRow(ctx, query, id))
}

func (r *Repository) FindDuplicate(
	ctx context.Context,
	email string,
	phoneNumber *string,
	nik *string,
) (*User, error) {
	query := userSelectQuery() + `
		WHERE a.email = $1
		   OR ($2::text IS NOT NULL AND a.no_hp = $2)
		   OR ($3::text IS NOT NULL AND p.nik = $3)
		LIMIT 1
	`

	user, err := scanUser(r.DB.QueryRow(ctx, query, email, phoneNumber, nik))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return user, nil
}

func (r *Repository) ListRegistrations(ctx context.Context, statusFilter string) ([]User, error) {
	query := userSelectQuery() + `
		WHERE a.peran_id <> 'ADMIN'
	`

	args := []any{}

	if statusFilter != "" {
		args = append(args, statusFilter)
		query += " AND COALESCE(reg.status_verifikasi_id, 'APPROVED') = $1"
	}

	query += " ORDER BY a.created_at DESC"

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []User{}

	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, err
		}

		result = append(result, *user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

func (r *Repository) UpdateRegistrationStatus(
	ctx context.Context,
	id string,
	status string,
	rejectionReason *string,
) (*User, error) {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	query := `
		UPDATE user_mgmt.transaksi_registrasipengguna
		SET
			status_verifikasi_id = $2::varchar(30),
			tanggal_review = NOW(),
			tanggal_aktivasi = CASE
				WHEN $2::varchar(30) = 'DISETUJUI'::varchar(30) THEN NOW()
				ELSE tanggal_aktivasi
			END,
			catatan_validasi = $3::text
		WHERE akun_id = $1
		RETURNING akun_id
	`

	var accountID string
	if err := tx.QueryRow(ctx, query, id, status, rejectionReason).Scan(&accountID); err != nil {
		return nil, err
	}

	if status == StatusRejected {
		_, err = tx.Exec(
			ctx,
			`UPDATE auth.master_akunpengguna SET status_aktif = FALSE WHERE akun_id = $1`,
			id,
		)
		if err != nil {
			return nil, err
		}
	}

	if status == StatusApproved {
		_, err = tx.Exec(
			ctx,
			`UPDATE auth.master_akunpengguna SET status_aktif = TRUE WHERE akun_id = $1`,
			id,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.FindByID(ctx, id)
}

func userSelectQuery() string {
	return `
		SELECT
			a.akun_id,
			a.nama_lengkap,
			a.email::text,
			NULLIF(a.no_hp, ''),
			p.nik,
			a.password_hash,
			a.peran_id,
			CASE
				WHEN a.peran_id = 'ADMIN' THEN 'DISETUJUI'
				ELSE COALESCE(reg.status_verifikasi_id, 'MENUNGGU')
			END AS status,
			reg.catatan_validasi,
			a.status_aktif,
			a.created_at,
			a.updated_at
		FROM auth.master_akunpengguna a
		LEFT JOIN user_mgmt.master_pelakuumkm p
			ON p.akun_id = a.akun_id
		LEFT JOIN user_mgmt.transaksi_registrasipengguna reg
			ON reg.akun_id = a.akun_id
	`
}

type userScanner interface {
	Scan(dest ...any) error
}

func scanUser(row userScanner) (*User, error) {
	var user User

	err := row.Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.PhoneNumber,
		&user.NIK,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.RejectionReason,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
