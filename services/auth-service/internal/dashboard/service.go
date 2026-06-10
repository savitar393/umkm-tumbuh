package dashboard

import (
	"context"
)

type Service struct {
	Repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{Repo: repo}
}

// GetDashboard — tanpa filter (backward compatible)
func (s *Service) GetDashboard(ctx context.Context) (*DashboardResponse, error) {
	return s.GetDashboardWithFilter(ctx, DashboardFilter{})
}

// GetDashboardWithFilter — dengan filter opsional dari query params
func (s *Service) GetDashboardWithFilter(ctx context.Context, f DashboardFilter) (*DashboardResponse, error) {
	days := f.Days
	if days == "" {
		days = "180"
	}

	summary, err := s.Repo.GetSummaryFiltered(ctx, f.Provinsi, f.StatusUMKM)
	if err != nil {
		return nil, err
	}

	mapData, err := s.Repo.GetMapDataFiltered(ctx, f.Provinsi)
	if err != nil {
		return nil, err
	}

	registrationTrend, err := s.Repo.GetRegistrationTrendFiltered(ctx, days, f.Provinsi)
	if err != nil {
		return nil, err
	}

	statusDistribution, err := s.Repo.GetStatusDistributionFiltered(ctx, f.Provinsi)
	if err != nil {
		return nil, err
	}

	labaTrend, err := s.Repo.GetLabaTrendFiltered(ctx, days, f.Provinsi)
	if err != nil {
		return nil, err
	}

	topWilayah, err := s.Repo.GetTopWilayahFiltered(ctx, 5, f.Provinsi)
	if err != nil {
		return nil, err
	}

	kategoriPerforma, err := s.Repo.GetKategoriPerformaFiltered(ctx, f.Provinsi)
	if err != nil {
		return nil, err
	}

	atensi, err := s.Repo.GetAtensi(ctx)
	if err != nil {
		return nil, err
	}

	return &DashboardResponse{
		Summary:            summary,
		MapData:            mapData,
		RegistrationTrend:  registrationTrend,
		StatusDistribution: statusDistribution,
		LabaTrend:          labaTrend,
		TopWilayah:         topWilayah,
		KategoriPerforma:   kategoriPerforma,
		Atensi:             atensi,
	}, nil
}
