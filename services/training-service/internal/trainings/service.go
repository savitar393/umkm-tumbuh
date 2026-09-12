package trainings

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/access"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
)

type Service struct {
	Repo   *Repository
	Access *access.Authorizer
}

func NewService(repo *Repository) *Service {
	return &Service{Repo: repo, Access: access.New(repo.DB)}
}

func (s *Service) GetAllTrainings(ctx context.Context) ([]TrainingProgramResponse, error) {
	return s.Repo.GetAllTrainings(ctx)
}

func (s *Service) GetTrainingByID(ctx context.Context, pelatihanID string) (*TrainingProgramResponse, error) {
	training, err := s.Repo.GetTrainingByID(ctx, pelatihanID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Pelatihan tidak ditemukan")
		}
		return nil, err
	}
	return training, nil
}

func (s *Service) GetTrainingDetail(ctx context.Context, pelatihanID string) (*TrainingDetailResponse, error) {
	training, err := s.GetTrainingByID(ctx, pelatihanID)
	if err != nil {
		return nil, err
	}

	modules, err := s.Repo.GetModulesByTrainingID(ctx, pelatihanID)
	if err != nil {
		return nil, err
	}

	return &TrainingDetailResponse{
		Training: *training,
		Modules:  modules,
	}, nil
}

// EnrollUser - fetch training sekali di service, lalu pass ke repo agar tidak double query
func (s *Service) EnrollUser(ctx context.Context, req EnrollRequest) (*EnrollmentResponse, error) {
	if err := s.Access.UMKM(ctx, req.UMKMID, false); err != nil {
		return nil, err
	}
	if req.UMKMID == "" || req.PelatihanID == "" {
		return nil, apperror.New(http.StatusBadRequest, "UMKM ID dan Pelatihan ID harus diisi")
	}

	// Fetch training SATU KALI di sini, lalu diteruskan ke repo
	training, err := s.GetTrainingByID(ctx, req.PelatihanID)
	if err != nil {
		return nil, err
	}

	return s.Repo.EnrollUser(ctx, req.UMKMID, req.PelatihanID, training)
}

func (s *Service) GetUserEnrollments(ctx context.Context, umkmID string) ([]EnrollmentResponse, error) {
	if err := s.Access.UMKM(ctx, umkmID, true); err != nil {
		return nil, err
	}
	if umkmID == "" {
		return nil, apperror.New(http.StatusBadRequest, "UMKM ID harus diisi")
	}

	return s.Repo.GetUserEnrollments(ctx, umkmID)
}

// UpdateProgress - update progress modul user
// Menghitung progress_persen otomatis dari modul_selesai / total_modul_snapshot
func (s *Service) UpdateProgress(ctx context.Context, req UpdateProgressRequest) error {
	if err := s.Access.Enrollment(ctx, req.PendaftaranID, false); err != nil {
		return err
	}
	if req.PendaftaranID == "" {
		return apperror.New(http.StatusBadRequest, "Pendaftaran ID harus diisi")
	}
	if req.ModulSelesai < 0 {
		return apperror.New(http.StatusBadRequest, "Modul selesai tidak boleh negatif")
	}
	if req.ModulSelesai > req.TotalModul {
		return apperror.New(http.StatusBadRequest, "Modul selesai tidak boleh melebihi total modul")
	}
	if req.TotalModul <= 0 {
		return apperror.New(http.StatusBadRequest, "Total modul harus lebih dari 0")
	}

	progressPersen := (float64(req.ModulSelesai) / float64(req.TotalModul)) * 100
	if progressPersen > 100 {
		progressPersen = 100
	}

	return s.Repo.UpdateProgress(ctx, req.PendaftaranID, req.ModulSelesai, progressPersen)
}

// CompleteTraining - tandai pelatihan selesai (progress = 100%)
func (s *Service) CompleteTraining(ctx context.Context, pendaftaranID string, dokumenEvaluasiID *string) error {
	if err := s.Access.Enrollment(ctx, pendaftaranID, false); err != nil {
		return err
	}
	if pendaftaranID == "" {
		return apperror.New(http.StatusBadRequest, "Pendaftaran ID harus diisi")
	}

	if dokumenEvaluasiID != nil {
		if err := s.Access.Document(ctx, *dokumenEvaluasiID); err != nil {
			return err
		}
	}
	return s.Repo.MarkTrainingComplete(ctx, pendaftaranID, dokumenEvaluasiID)
}

// ============= ADMIN SERVICE METHODS =============

func (s *Service) GetAllTrainingsAdmin(ctx context.Context, filters TrainingFilters) ([]TrainingProgramResponse, int, error) {
	if err := access.RequireAdmin(ctx); err != nil {
		return nil, 0, err
	}
	return s.Repo.GetAllTrainingsAdmin(ctx, filters)
}

func (s *Service) CreateTraining(ctx context.Context, req CreateTrainingRequest) (*TrainingProgramResponse, error) {
	if err := access.RequireAdmin(ctx); err != nil {
		return nil, err
	}
	// Validate required fields
	if req.JudulPelatihan == "" {
		return nil, apperror.New(http.StatusBadRequest, "Judul pelatihan wajib diisi")
	}
	if req.JenisPelatihanID == "" {
		return nil, apperror.New(http.StatusBadRequest, "Jenis pelatihan wajib dipilih")
	}
	if req.DurasiJam <= 0 {
		return nil, apperror.New(http.StatusBadRequest, "Durasi pelatihan harus lebih dari 0")
	}

	adminID, err := s.Access.AdminID(ctx)
	if err != nil {
		return nil, err
	}
	req.DibuatOlehAdminID = adminID
	return s.Repo.CreateTraining(ctx, req)
}

func (s *Service) UpdateTraining(ctx context.Context, pelatihanID string, req UpdateTrainingRequest) (*TrainingProgramResponse, error) {
	if err := access.RequireAdmin(ctx); err != nil {
		return nil, err
	}
	// Validate required fields
	if req.JudulPelatihan == "" {
		return nil, apperror.New(http.StatusBadRequest, "Judul pelatihan wajib diisi")
	}
	if req.JenisPelatihanID == "" {
		return nil, apperror.New(http.StatusBadRequest, "Jenis pelatihan wajib dipilih")
	}

	return s.Repo.UpdateTraining(ctx, pelatihanID, req)
}

func (s *Service) DeleteTraining(ctx context.Context, pelatihanID string) error {
	if err := access.RequireAdmin(ctx); err != nil {
		return err
	}
	return s.Repo.DeleteTraining(ctx, pelatihanID)
}

func (s *Service) UpdateTrainingStatus(ctx context.Context, pelatihanID, status string) error {
	if err := access.RequireAdmin(ctx); err != nil {
		return err
	}
	// Validate status
	validStatuses := map[string]bool{
		"DRAFT":     true,
		"PUBLISHED": true,
		"ONGOING":   true,
		"COMPLETED": true,
		"SCHEDULED": true,
		"ARCHIVED":  true,
	}

	if !validStatuses[status] {
		return apperror.New(http.StatusBadRequest, "Status pelatihan tidak valid")
	}

	return s.Repo.UpdateTrainingStatus(ctx, pelatihanID, status)
}

func (s *Service) GetTrainingStats(ctx context.Context) (*TrainingStatsResponse, error) {
	if err := access.RequireAdmin(ctx); err != nil {
		return nil, err
	}
	return s.Repo.GetTrainingStats(ctx)
}
