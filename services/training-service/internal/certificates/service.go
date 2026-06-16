package certificates

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
)

type Service struct {
	Repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{Repo: repo}
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
		Message:     "Pengajuan sertifikat berhasil",
		Certificate: *cert,
	}, nil
}
