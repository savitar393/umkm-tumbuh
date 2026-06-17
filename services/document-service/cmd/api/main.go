package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const maxUploadSize = 10 << 20 // 10 MiB

type app struct {
	db          *pgxpool.Pool
	jwtSecret   string
	frontendURL string
}

type currentUser struct {
	ID    string
	Email string
	Role  string
}

type documentResponse struct {
	ID               string     `json:"id"`
	UploaderAccount  string     `json:"uploader_akun_id"`
	UploaderRole     string     `json:"uploader_role"`
	Category         string     `json:"kategori_dokumen"`
	Bucket           string     `json:"bucket_name"`
	ObjectKey        string     `json:"object_key"`
	OriginalFilename string     `json:"original_filename"`
	ContentType      string     `json:"content_type"`
	SizeBytes        int64      `json:"size_bytes"`
	PublicURL        *string    `json:"public_url"`
	Status           string     `json:"status"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}

type healthResponse struct {
	Service string `json:"service"`
	Status  string `json:"status"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func main() {
	ctx := context.Background()

	host := env("DOCUMENT_SERVICE_HOST", "0.0.0.0")
	port := env("DOCUMENT_SERVICE_PORT", "8083")
	frontendURL := env("FRONTEND_URL", "http://localhost:5173")
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))

	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("failed to create database pool: %v", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	app := &app{
		db:          db,
		jwtSecret:   jwtSecret,
		frontendURL: frontendURL,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/api/v1/health", app.handleHealth)
	mux.HandleFunc("/api/v1/documents/upload", app.withAuth(app.handleUploadDocument))
	mux.HandleFunc("/api/v1/documents/", app.withAuth(app.handleDocumentByID))
	mux.HandleFunc("/", app.handleNotFound)

	server := &http.Server{
		Addr:              host + ":" + port,
		Handler:           app.withCORS(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("document-service running on %s:%s", host, port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("document-service failed: %v", err)
	}
}

func (a *app) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Error: "Method not allowed."})
		return
	}

	writeJSON(w, http.StatusOK, healthResponse{
		Service: "document-service",
		Status:  "ok",
	})
}

func (a *app) handleUploadDocument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Error: "Method not allowed."})
		return
	}

	user, ok := userFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, errorResponse{Error: "User tidak ditemukan pada konteks."})
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "File terlalu besar atau format multipart tidak valid."})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Field file wajib diisi."})
		return
	}
	defer file.Close()

	if header.Size <= 0 {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "File kosong tidak dapat diunggah."})
		return
	}

	if header.Size > maxUploadSize {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Ukuran file maksimal 10 MiB."})
		return
	}

	category := normalizeCategory(r.FormValue("category"))
	bucket := bucketForCategory(category)

	if bucket == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Bucket untuk kategori dokumen belum dikonfigurasi."})
		return
	}

	storageClient, err := newS3Client(r.Context(), bucket)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	documentID := "DOC" + strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	extension := strings.ToLower(filepath.Ext(header.Filename))
	objectKey := fmt.Sprintf("%s/%s/%s%s", strings.ToLower(category), user.ID, documentID, extension)
	contentType := detectContentType(header.Filename, header.Header.Get("Content-Type"))
	publicURL := publicObjectURL(bucket, objectKey)

	if err := storageClient.putObject(r.Context(), objectKey, file, contentType); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "Gagal mengunggah file ke object storage."})
		return
	}

	document, err := a.insertDocumentMetadata(
		r.Context(),
		documentID,
		user,
		category,
		bucket,
		objectKey,
		header.Filename,
		contentType,
		header.Size,
		publicURL,
	)
	if err != nil {
		_ = storageClient.deleteObject(r.Context(), objectKey)
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "Gagal menyimpan metadata dokumen."})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"message":  "Dokumen berhasil diunggah.",
		"document": document,
	})
}

func (a *app) handleDocumentByID(w http.ResponseWriter, r *http.Request) {
	documentID := strings.TrimPrefix(r.URL.Path, "/api/v1/documents/")
	documentID = strings.TrimSpace(documentID)

	if documentID == "" {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "Dokumen tidak ditemukan."})
		return
	}

	switch r.Method {
	case http.MethodGet:
		a.handleGetDocument(w, r, documentID)
	case http.MethodDelete:
		a.handleDeleteDocument(w, r, documentID)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Error: "Method not allowed."})
	}
}

func (a *app) handleGetDocument(w http.ResponseWriter, r *http.Request, documentID string) {
	document, err := a.findDocumentByID(r.Context(), documentID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, errorResponse{Error: "Dokumen tidak ditemukan."})
			return
		}

		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "Gagal memuat dokumen."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"document": document,
	})
}

func (a *app) handleDeleteDocument(w http.ResponseWriter, r *http.Request, documentID string) {
	document, err := a.findDocumentByID(r.Context(), documentID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, errorResponse{Error: "Dokumen tidak ditemukan."})
			return
		}

		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "Gagal memuat dokumen."})
		return
	}

	if document.Status == "DIHAPUS" {
		writeJSON(w, http.StatusOK, map[string]string{
			"message": "Dokumen sudah dihapus.",
		})
		return
	}

	storageClient, err := newS3Client(r.Context(), document.Bucket)
	if err == nil {
		_ = storageClient.deleteObject(r.Context(), document.ObjectKey)
	}

	if err := a.markDocumentDeleted(r.Context(), documentID); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "Gagal menghapus metadata dokumen."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Dokumen berhasil dihapus.",
	})
}

func (a *app) handleNotFound(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotFound, errorResponse{Error: "Endpoint not found."})
}

func (a *app) insertDocumentMetadata(
	ctx context.Context,
	documentID string,
	user currentUser,
	category string,
	bucket string,
	objectKey string,
	originalFilename string,
	contentType string,
	sizeBytes int64,
	publicURL *string,
) (documentResponse, error) {
	const query = `
		INSERT INTO documents.master_dokumen (
			dokumen_id,
			uploader_akun_id,
			uploader_role,
			kategori_dokumen,
			bucket_name,
			object_key,
			original_filename,
			content_type,
			size_bytes,
			public_url
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING
			dokumen_id,
			uploader_akun_id,
			uploader_role,
			kategori_dokumen,
			bucket_name,
			object_key,
			original_filename,
			content_type,
			size_bytes,
			public_url,
			status,
			created_at,
			updated_at,
			deleted_at
	`

	return scanDocument(a.db.QueryRow(
		ctx,
		query,
		documentID,
		user.ID,
		user.Role,
		category,
		bucket,
		objectKey,
		originalFilename,
		contentType,
		sizeBytes,
		publicURL,
	))
}

func (a *app) findDocumentByID(ctx context.Context, documentID string) (documentResponse, error) {
	const query = `
		SELECT
			dokumen_id,
			uploader_akun_id,
			uploader_role,
			kategori_dokumen,
			bucket_name,
			object_key,
			original_filename,
			content_type,
			size_bytes,
			public_url,
			status,
			created_at,
			updated_at,
			deleted_at
		FROM documents.master_dokumen
		WHERE dokumen_id = $1
	`

	return scanDocument(a.db.QueryRow(ctx, query, documentID))
}

func (a *app) markDocumentDeleted(ctx context.Context, documentID string) error {
	const query = `
		UPDATE documents.master_dokumen
		SET status = 'DIHAPUS',
		    deleted_at = NOW()
		WHERE dokumen_id = $1
	`

	_, err := a.db.Exec(ctx, query, documentID)
	return err
}

type documentRow interface {
	Scan(dest ...any) error
}

func scanDocument(row documentRow) (documentResponse, error) {
	var document documentResponse

	err := row.Scan(
		&document.ID,
		&document.UploaderAccount,
		&document.UploaderRole,
		&document.Category,
		&document.Bucket,
		&document.ObjectKey,
		&document.OriginalFilename,
		&document.ContentType,
		&document.SizeBytes,
		&document.PublicURL,
		&document.Status,
		&document.CreatedAt,
		&document.UpdatedAt,
		&document.DeletedAt,
	)

	return document, err
}

type s3Client struct {
	client *s3.Client
	bucket string
}

func newS3Client(ctx context.Context, bucket string) (*s3Client, error) {
	endpoint := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_ENDPOINT"))
	accessKey := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("OBJECT_STORAGE_SECRET_KEY"))
	region := strings.TrimSpace(env("OBJECT_STORAGE_REGION", "garage"))

	if endpoint == "" || accessKey == "" || secretKey == "" {
		return nil, errors.New("object storage endpoint/access key/secret key belum lengkap")
	}

	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return &s3Client{
		client: client,
		bucket: bucket,
	}, nil
}

func (c *s3Client) putObject(ctx context.Context, key string, body io.Reader, contentType string) error {
	_, err := c.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})

	return err
}

func (c *s3Client) deleteObject(ctx context.Context, key string) error {
	_, err := c.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})

	return err
}

func normalizeCategory(value string) string {
	value = strings.ToUpper(strings.TrimSpace(value))

	switch value {
	case "PRODUCT_IMAGE", "CERTIFICATE", "PARTNERSHIP_FILE", "GENERAL_DOCUMENT":
		return value
	default:
		return "GENERAL_DOCUMENT"
	}
}

func bucketForCategory(category string) string {
	switch category {
	case "PRODUCT_IMAGE":
		return env("OBJECT_STORAGE_BUCKET_PRODUCT_IMAGES", "product-images")
	case "CERTIFICATE":
		return env("OBJECT_STORAGE_BUCKET_CERTIFICATES", "certificates")
	case "PARTNERSHIP_FILE":
		return env("OBJECT_STORAGE_BUCKET_PARTNERSHIP_FILES", "partnership-files")
	default:
		return env("OBJECT_STORAGE_BUCKET_DOCUMENTS", "documents")
	}
}

func detectContentType(filename string, headerValue string) string {
	headerValue = strings.TrimSpace(headerValue)
	if headerValue != "" {
		return headerValue
	}

	extension := strings.ToLower(filepath.Ext(filename))
	contentType := mime.TypeByExtension(extension)

	if contentType != "" {
		return contentType
	}

	return "application/octet-stream"
}

func publicObjectURL(bucket string, objectKey string) *string {
	publicEndpoint := strings.TrimRight(strings.TrimSpace(os.Getenv("OBJECT_STORAGE_PUBLIC_ENDPOINT")), "/")

	if publicEndpoint == "" {
		return nil
	}

	value := publicEndpoint + "/" + bucket + "/" + strings.TrimLeft(objectKey, "/")
	return &value
}

type contextKey string

const currentUserKey contextKey = "current_user"

func (a *app) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := a.authenticate(r)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, errorResponse{Error: err.Error()})
			return
		}

		ctx := context.WithValue(r.Context(), currentUserKey, user)
		next(w, r.WithContext(ctx))
	}
}

func (a *app) authenticate(r *http.Request) (currentUser, error) {
	tokenString, err := extractBearerToken(r.Header.Get("Authorization"))
	if err != nil {
		return currentUser{}, err
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(a.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return currentUser{}, errors.New("token tidak valid atau sudah kedaluwarsa")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return currentUser{}, errors.New("token tidak valid")
	}

	userID, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	role, _ := claims["role"].(string)

	role = strings.ToUpper(role)

	if userID == "" || role == "" {
		return currentUser{}, errors.New("token tidak valid")
	}

	return currentUser{
		ID:    userID,
		Email: email,
		Role:  role,
	}, nil
}

func extractBearerToken(authorizationHeader string) (string, error) {
	authorizationHeader = strings.TrimSpace(authorizationHeader)

	const prefix = "Bearer "
	if !strings.HasPrefix(authorizationHeader, prefix) {
		return "", errors.New("authorization header tidak valid")
	}

	token := strings.TrimSpace(strings.TrimPrefix(authorizationHeader, prefix))
	if token == "" {
		return "", errors.New("token tidak ditemukan")
	}

	return token, nil
}

func userFromContext(ctx context.Context) (currentUser, bool) {
	user, ok := ctx.Value(currentUserKey).(currentUser)
	return user, ok
}

func (a *app) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin == a.frontendURL || origin == "http://localhost:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization,Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func env(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("failed to write JSON response: %v", err)
	}
}
