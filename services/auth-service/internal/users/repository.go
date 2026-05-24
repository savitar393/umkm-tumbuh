package users

import (
	"context"
	"errors"

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
			is_active, created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1
	`

	return scanUser(r.DB.QueryRow(ctx, query, email))
}

func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, created_at, updated_at
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
			is_active, created_at, updated_at
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

func (r *Repository) ListRegistrations(ctx context.Context, statusFilter string) ([]User, error) {
	query := `
		SELECT
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, created_at, updated_at
		FROM users
		WHERE role <> 'ADMIN'
	`

	args := []any{}

	if statusFilter != "" {
		args = append(args, statusFilter)
		query += " AND status = $1"
	}

	query += " ORDER BY created_at DESC"

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
	query := `
		UPDATE users
		SET
			status = $2,
			rejection_reason = $3,
			updated_at = NOW()
		WHERE id = $1
		  AND role <> 'ADMIN'
		RETURNING
			id, full_name, email, phone_number, nik,
			password_hash, role, status, rejection_reason,
			is_active, created_at, updated_at
	`

	return scanUser(r.DB.QueryRow(ctx, query, id, status, rejectionReason))
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
