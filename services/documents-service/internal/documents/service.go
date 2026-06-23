package documents

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/apperror"
)

var allowedExtensions = map[string]string{
	".pdf": "application/pdf",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
}

var validDocumentTypes = map[string]bool{
	"KTP":                true,
	"NIB":                true,
	"PROPOSAL_KERJASAMA": true,
	"PERJANJIAN_KERJASAMA": true,
	"SERTIFIKAT_HALAL":   true,
	"PIRT":               true,
	"DOKUMEN_PENDUKUNG":  true,
}

const maxFileSize int64 = 10 * 1024 * 1024

type Service interface {
	Upload(ctx context.Context, file multipart.File, header *multipart.FileHeader, req UploadRequest) (*UploadResponse, error)
	Download(ctx context.Context, id string) (*Document, string, error)
	GetMetadata(ctx context.Context, id string) (*Document, error)
}

type service struct {
	repo      Repository
	uploadDir string
}

func NewService(repo Repository, uploadDir string) Service {
	return &service{
		repo:      repo,
		uploadDir: uploadDir,
	}
}

func (s *service) Upload(ctx context.Context, file multipart.File, header *multipart.FileHeader, req UploadRequest) (*UploadResponse, error) {
	if header.Size > maxFileSize {
		return nil, apperror.New(400, "File size exceeds maximum limit of 10MB")
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	mimeType, ok := allowedExtensions[ext]
	if !ok {
		return nil, apperror.New(400, "File type not allowed. Only PDF, JPG, and PNG files are accepted")
	}

	if !validDocumentTypes[req.JenisDokumenID] {
		return nil, apperror.New(400, fmt.Sprintf("Invalid document type: %s. Allowed types: NIB_KTP, PROPOSAL_KEMITRAAN, SERTIFIKAT_HALAL, DOKUMEN_KONTRAK", req.JenisDokumenID))
	}

	h := sha256.New()
	tee := io.TeeReader(file, h)

	now := time.Now()
	dateDir := now.Format("2006/01/02")
	storedFileName := fmt.Sprintf("%s_%d%s", strings.TrimSuffix(header.Filename, ext), now.UnixMilli(), ext)
	storagePath := filepath.Join(s.uploadDir, dateDir, storedFileName)
	objectKey := filepath.Join("local", dateDir, storedFileName)

	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err != nil {
		return nil, apperror.New(500, "Failed to create upload directory")
	}

	dst, err := os.Create(storagePath)
	if err != nil {
		return nil, apperror.New(500, "Failed to create file on disk")
	}
	defer dst.Close()

	written, err := io.Copy(dst, tee)
	if err != nil {
		os.Remove(storagePath)
		return nil, apperror.New(500, "Failed to save file")
	}

	checksum := fmt.Sprintf("%x", h.Sum(nil))

	bucketName := "local"

	doc := &Document{
		JenisDokumenID:  req.JenisDokumenID,
		StatusDokumenID: string(StatusUploaded),
		UploaderAkunID:  req.UploaderAkunID,
		OwnerType:       req.OwnerType,
		OwnerID:         req.OwnerID,
		ContextType:     req.ContextType,
		ContextID:       req.ContextID,
		OriginalFileName: header.Filename,
		StoredFileName:  storedFileName,
		FileExtension:   ext,
		MimeType:        mimeType,
		FileSizeBytes:   written,
		BucketName:      bucketName,
		ObjectKey:       objectKey,
		StoragePath:     storagePath,
		ChecksumSHA256:  checksum,
		IsPublic:        req.IsPublic,
		DisplayOrder:    req.DisplayOrder,
		Caption:         req.Caption,
		UploadedAt:      now,
		MetadataJSON:    map[string]any{},
	}

	if err := s.repo.Insert(ctx, doc); err != nil {
		os.Remove(storagePath)
		return nil, apperror.New(500, "Failed to store document metadata: "+err.Error())
	}

	return &UploadResponse{
		DokumenID:        doc.DokumenID,
		OriginalFileName: doc.OriginalFileName,
		FileSizeBytes:    doc.FileSizeBytes,
		MimeType:         doc.MimeType,
		ChecksumSHA256:   doc.ChecksumSHA256,
		StatusDokumenID:  doc.StatusDokumenID,
	}, nil
}

func (s *service) Download(ctx context.Context, id string) (*Document, string, error) {
	doc, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, "", apperror.New(404, err.Error())
	}

	if _, err := os.Stat(doc.StoragePath); os.IsNotExist(err) {
		return nil, "", apperror.New(404, "File not found on disk")
	}

	return doc, doc.StoragePath, nil
}

func (s *service) GetMetadata(ctx context.Context, id string) (*Document, error) {
	doc, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperror.New(404, err.Error())
	}

	return doc, nil
}
