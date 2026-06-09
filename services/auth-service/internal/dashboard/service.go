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

// GetDashboard returns all dashboard data in one call (efficient for frontend)
func (s *Service) GetDashboard(ctx context.Context) (*DashboardResponse, error) {
	summary, err := s.Repo.GetSummary(ctx)
	if err != nil {
		return nil, err
	}

	mapData, err := s.Repo.GetMapData(ctx)
	if err != nil {
		return nil, err
	}

	registrationTrend, err := s.Repo.GetRegistrationTrend(ctx, "180") // 6 bulan terakhir
	if err != nil {
		return nil, err
	}

	statusDistribution, err := s.Repo.GetStatusDistribution(ctx)
	if err != nil {
		return nil, err
	}

	labaTrend, err := s.Repo.GetLabaTrend(ctx, "180")
	if err != nil {
		return nil, err
	}

	topWilayah, err := s.Repo.GetTopWilayah(ctx, 5)
	if err != nil {
		return nil, err
	}

	kategoriPerforma, err := s.Repo.GetKategoriPerforma(ctx)
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
