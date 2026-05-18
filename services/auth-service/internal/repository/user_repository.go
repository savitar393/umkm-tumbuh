package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/model"
)

type UserRepository struct {
	DB *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
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

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
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

func (r *UserRepository) FindDuplicate(
	ctx context.Context,
	email string,
	phoneNumber *string,
	nik *string,
) (*model.User, error) {
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

func scanUser(row pgx.Row) (*model.User, error) {
	var user model.User

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
