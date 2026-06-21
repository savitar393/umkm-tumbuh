package users

import (
	"context"
	"errors"
	"fmt"
	"strings"

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
	query := `
		INSERT INTO users (
			id, full_name, email, phone_number, nik,
			password_hash, role, status, is_active
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.DB.Exec(
		ctx,
		query,
		user.ID,
		user.FullName,
		user.Email,
		user.PhoneNumber,
		user.NIK,
		user.PasswordHash,
		user.Role,
		user.Status,
		user.IsActive,
	)

	return err
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1
	`

	return scanUser(r.DB.QueryRow(ctx, query, email))
}

func (r *Repository) UpdateLastLoginAt(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET last_login_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.DB.Exec(ctx, query, id)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
		FROM users
		WHERE id = $1
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
	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
		FROM users
		WHERE email = $1
		   OR ($2::text IS NOT NULL AND phone_number = $2)
		   OR ($3::text IS NOT NULL AND nik = $3)
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

type ListRegistrationsResult struct {
	Users      []User
	TotalCount int
}

func (r *Repository) ListRegistrations(
	ctx context.Context,
	statusFilter string,
	search string,
	roleFilter string,
	inactiveMonths int,
	page int,
	limit int,
) (*ListRegistrationsResult, error) {
	args := []any{}
	argIdx := 1

	where := "WHERE role <> 'ADMIN'"

	if statusFilter != "" {
		where += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, statusFilter)
		argIdx++
	}

	if roleFilter != "" {
		where += fmt.Sprintf(" AND role = $%d", argIdx)
		args = append(args, roleFilter)
		argIdx++
	}

	if search != "" {
		where += fmt.Sprintf(" AND (LOWER(full_name) LIKE LOWER($%d) OR LOWER(email) LIKE LOWER($%d))", argIdx, argIdx+1)
		searchPattern := "%" + strings.TrimSpace(search) + "%"
		args = append(args, searchPattern, searchPattern)
		argIdx += 2
	}

	if inactiveMonths > 0 {
		where += fmt.Sprintf(" AND (last_login_at IS NULL OR last_login_at < NOW() - $%d::interval)", argIdx)
		args = append(args, fmt.Sprintf("%d months", inactiveMonths))
		argIdx++
	}

	var totalCount int
	countQuery := "SELECT COUNT(*) FROM users " + where
	if err := r.DB.QueryRow(ctx, countQuery, args...).Scan(&totalCount); err != nil {
		return nil, err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	dataQuery := fmt.Sprintf(`
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
		FROM users
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.DB.Query(ctx, dataQuery, args...)
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

	return &ListRegistrationsResult{
		Users:      result,
		TotalCount: totalCount,
	}, nil
}

type StatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

func (r *Repository) CountByStatus(ctx context.Context) ([]StatusCount, error) {
	query := `
		SELECT status, COUNT(*) AS count
		FROM users
		WHERE role <> 'ADMIN'
		GROUP BY status
		ORDER BY status
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []StatusCount{}
	for rows.Next() {
		var sc StatusCount
		if err := rows.Scan(&sc.Status, &sc.Count); err != nil {
			return nil, err
		}
		result = append(result, sc)
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
	catatanValidasi *string,
	reviewedBy string,
) (*User, error) {
	isActive := status == StatusApproved

	query := `
		UPDATE users
		SET
			status = $2,
			rejection_reason = $3,
			catatan_validasi = $4,
			reviewed_at = NOW(),
			reviewed_by = $5,
			is_active = $6,
			updated_at = NOW()
		WHERE id = $1
		  AND role <> 'ADMIN'
		RETURNING
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
	`

	return scanUser(r.DB.QueryRow(ctx, query, id, status, rejectionReason, catatanValidasi, reviewedBy, isActive))
}

func (r *Repository) UpdateAccountStatus(
	ctx context.Context,
	id string,
	isActive bool,
) (*User, error) {
	query := `
		UPDATE users
		SET
			is_active = $2,
			updated_at = NOW()
		WHERE id = $1
		  AND role <> 'ADMIN'
		RETURNING
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
	`

	return scanUser(r.DB.QueryRow(ctx, query, id, isActive))
}

func (r *Repository) DeactivateAccountWithReason(
	ctx context.Context,
	id string,
	rejectionReason string,
	catatanValidasi string,
) (*User, error) {
	query := `
		UPDATE users
		SET
			is_active = false,
			rejection_reason = $2,
			catatan_validasi = $3,
			updated_at = NOW()
		WHERE id = $1
		  AND role <> 'ADMIN'
		  AND is_active = true
		RETURNING
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
	`

	return scanUser(r.DB.QueryRow(ctx, query, id, rejectionReason, catatanValidasi))
}

func (r *Repository) RequestReactivation(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET reactivation_requested_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.DB.Exec(ctx, query, id)
	return err
}

func (r *Repository) ReactivateAccount(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET is_active = true,
		    rejection_reason = NULL,
		    reactivation_requested_at = NULL,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.DB.Exec(ctx, query, id)
	return err
}

func (r *Repository) CountReactivationRequests(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE reactivation_requested_at IS NOT NULL AND role <> 'ADMIN'`
	var count int
	err := r.DB.QueryRow(ctx, query).Scan(&count)
	return count, err
}

func (r *Repository) ListReactivationRequests(ctx context.Context, page int, limit int) (*ListRegistrationsResult, error) {
	offset := (page - 1) * limit

	var totalCount int
	err := r.DB.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE reactivation_requested_at IS NOT NULL AND role <> 'ADMIN'`).Scan(&totalCount)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
		FROM users
		WHERE reactivation_requested_at IS NOT NULL AND role <> 'ADMIN'
		ORDER BY reactivation_requested_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.DB.Query(ctx, query, limit, offset)
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

	return &ListRegistrationsResult{
		Users:      result,
		TotalCount: totalCount,
	}, nil
}

func (r *Repository) IncrementFailedAttempts(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET failed_attempts = failed_attempts + 1,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.DB.Exec(ctx, query, id)
	return err
}

func (r *Repository) LockAccount(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET account_locked_until = NOW() + INTERVAL '15 minutes',
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.DB.Exec(ctx, query, id)
	return err
}

func (r *Repository) ResetFailedAttempts(ctx context.Context, id string) error {
	query := `
		UPDATE users
		SET failed_attempts = 0,
		    account_locked_until = NULL,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.DB.Exec(ctx, query, id)
	return err
}

func (r *Repository) FindByIDWithoutPassword(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			role, status, rejection_reason,
			is_active, submitted_at, reviewed_at, reviewed_by,
			catatan_validasi, failed_attempts, account_locked_until,
			last_login_at, reactivation_requested_at, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1
	`

	return scanUserWithoutPassword(r.DB.QueryRow(ctx, query, id))
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
		&user.SubmittedAt,
		&user.ReviewedAt,
		&user.ReviewedBy,
		&user.CatatanValidasi,
		&user.FailedAttempts,
		&user.AccountLockedUntil,
		&user.LastLoginAt,
		&user.ReactivationRequestedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func scanUserWithoutPassword(row userScanner) (*User, error) {
	var user User

	err := row.Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.PhoneNumber,
		&user.NIK,
		&user.Role,
		&user.Status,
		&user.RejectionReason,
		&user.IsActive,
		&user.SubmittedAt,
		&user.ReviewedAt,
		&user.ReviewedBy,
		&user.CatatanValidasi,
		&user.FailedAttempts,
		&user.AccountLockedUntil,
		&user.LastLoginAt,
		&user.ReactivationRequestedAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
