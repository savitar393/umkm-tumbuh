package certificates

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
)

type Service struct {
	Repo    *Repository
	certDir string
}

func NewService(repo *Repository, certDir string) *Service {
	return &Service{Repo: repo, certDir: certDir}
}

func (s *Service) GetUserDashboard(ctx context.Context, umkmID string) (*CertificateDashboardResponse, error) {
	if umkmID == "" {
		return nil, apperror.New(http.StatusBadRequest, "UMKM ID harus diisi")
	}

	dashboard, err := s.Repo.GetUserCertificateDashboard(ctx, umkmID)
	if err != nil {
		return nil, err
	}

	if dashboard == nil {
		return nil, apperror.New(http.StatusNotFound, "Data dashboard tidak ditemukan")
	}

	return dashboard, nil
}

func (s *Service) GetUserCertificates(ctx context.Context, umkmID string) ([]CertificateResponse, error) {
	if umkmID == "" {
		return nil, apperror.New(http.StatusBadRequest, "UMKM ID harus diisi")
	}

	certs, err := s.Repo.GetUserCertificates(ctx, umkmID)
	if err != nil {
		return nil, err
	}

	if certs == nil {
		certs = []CertificateResponse{}
	}

	return certs, nil
}

func (s *Service) GetCertificateByID(ctx context.Context, sertifikatID int64) (*CertificateResponse, error) {
	cert, err := s.Repo.GetCertificateByID(ctx, sertifikatID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Sertifikat tidak ditemukan")
		}
		return nil, err
	}

	return cert, nil
}

func (s *Service) RequestCertificate(ctx context.Context, req RequestCertificateRequest) (*RequestCertificateResponse, error) {
	if req.PendaftaranPelatihanID == "" {
		return nil, apperror.New(http.StatusBadRequest, "Pendaftaran Pelatihan ID harus diisi")
	}

	cert, err := s.Repo.RequestCertificate(ctx, req.PendaftaranPelatihanID)
	if err != nil {
		return nil, err
	}

	return &RequestCertificateResponse{
		Message:     "Sertifikat berhasil diajukan, menunggu verifikasi admin",
		Certificate: *cert,
	}, nil
}

func (s *Service) ApproveCertificate(ctx context.Context, sertifikatID int64) (*CertificateResponse, error) {
	cert, err := s.Repo.GetCertificateByID(ctx, sertifikatID)
	if err != nil {
		return nil, err
	}
	if cert.StatusSertifikatID == "TERBIT" {
		return cert, nil
	}

	if err := s.Repo.ApproveCertificate(ctx, sertifikatID); err != nil {
		return nil, err
	}

	cert, err = s.Repo.GetCertificateByID(ctx, sertifikatID)
	if err != nil {
		return nil, err
	}

	if _, err := s.GenerateCertificatePDF(cert); err != nil {
		return nil, err
	}

	return cert, nil
}

func (s *Service) ListCertificatesByStatus(ctx context.Context, status, search, sortBy, sortOrder string, page, limit int) (*ListCertificatesResponse, error) {
	offset := (page - 1) * limit

	certs, err := s.Repo.ListCertificatesByStatus(ctx, status, search, sortBy, sortOrder, limit, offset)
	if err != nil {
		return nil, err
	}
	if certs == nil {
		certs = []CertificateResponse{}
	}

	total, err := s.Repo.CountCertificatesByStatus(ctx, status, search)
	if err != nil {
		return nil, err
	}

	return &ListCertificatesResponse{
		Certificates: certs,
		Total:        total,
		Page:         page,
		Limit:        limit,
	}, nil
}

func (s *Service) GetCertificateStats(ctx context.Context) (*CertificateStatsResponse, error) {
	return s.Repo.GetCertificateStats(ctx)
}

func (s *Service) RejectCertificate(ctx context.Context, sertifikatID int64, catatan string) (*CertificateResponse, error) {
	cert, err := s.Repo.GetCertificateByID(ctx, sertifikatID)
	if err != nil {
		return nil, err
	}
	if cert.StatusSertifikatID != "DIAJUKAN" {
		return nil, apperror.New(http.StatusBadRequest, "Hanya sertifikat dengan status DIAJUKAN yang dapat ditolak")
	}
	if err := s.Repo.RejectCertificate(ctx, sertifikatID, catatan); err != nil {
		return nil, err
	}
	return s.Repo.GetCertificateByID(ctx, sertifikatID)
}

func (s *Service) GetCertificatePDFPath(ctx context.Context, sertifikatID int64) (string, error) {
	cert, err := s.Repo.GetCertificateByID(ctx, sertifikatID)
	if err != nil {
		return "", err
	}
	if cert.StatusSertifikatID != "TERBIT" {
		return "", apperror.New(http.StatusBadRequest, "Sertifikat belum diterbitkan")
	}

	fileName := fmt.Sprintf("cert_%d.pdf", cert.SertifikatID)
	filePath := filepath.Join(s.certDir, fileName)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		if _, err := s.GenerateCertificatePDF(cert); err != nil {
			return "", err
		}
	}

	return filePath, nil
}
