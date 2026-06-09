package dashboard

import (
	"context"
	"time"
)

type Service struct {
	Repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{Repo: repo}
}

// ─── UMKM Dashboard ──────────────────────────────────────────────────────────

func (s *Service) GetUMKMDashboard(ctx context.Context, accountID, dateFrom, dateTo string) (*UMKMDashboardData, error) {
	// 1. Resolve umkm_id
	umkmID, namaUMKM, err := s.Repo.GetUMKMByAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}

	// 2. Resolusi rentang tanggal — selalu gunakan rentang dari data yang ada
	minDB, maxDB, rangeErr := s.Repo.GetDefaultDateRange(ctx, umkmID)
	if rangeErr != nil || minDB == "" {
		now := time.Now()
		minDB = now.Format("2006-01") + "-01"
		maxDB = now.Format("2006-01-02")
	}

	// Kalau ada param dari user, pakai. Kalau tidak, default ke seluruh bulan dari data terbaru.
	if dateTo == "" {
		dateTo = maxDB
	}
	if dateFrom == "" {
		t, _ := time.Parse("2006-01-02", maxDB)
		dateFrom = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location()).Format("2006-01-02")
	}

	// 3. Omzet summary (2 hari terkini)
	omzetHariIni, omzetKemarin, totalItem, tglTerkini, err := s.Repo.GetOmzetSummary(ctx, umkmID)
	if err != nil {
		omzetHariIni, omzetKemarin, totalItem, tglTerkini = 0, 0, 0, ""
	}

	// 4. Persen perubahan vs kemarin
	var persen float64
	if omzetKemarin > 0 {
		persen = ((omzetHariIni - omzetKemarin) / omzetKemarin) * 100
	}

	// 5. Rata-rata per item
	var rataRata float64
	if totalItem > 0 {
		rataRata = omzetHariIni / float64(totalItem)
	}

	// 6. Laba harian (tabel)
	labaHarian, err := s.Repo.GetLabaHarian(ctx, umkmID, dateFrom, dateTo)
	if err != nil || labaHarian == nil {
		labaHarian = []LabaHarianItem{}
	}

	// 7. Tren mingguan (7 hari)
	tren, err := s.Repo.GetTrenMingguan(ctx, umkmID, 7)
	if err != nil || tren == nil {
		tren = []TrenMingguan{}
	}

	// 8. Parse nama bulan dari dateFrom
	filterBulan := ""
	filterTahun := time.Now().Year()
	if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
		filterBulan = t.Format("January 2006")
		filterTahun = t.Year()
	}

	return &UMKMDashboardData{
		NamaUMKM:          namaUMKM,
		TglTerkini:        tglTerkini,
		TotalOmzetHariIni: omzetHariIni,
		TotalOmzetKemarin: omzetKemarin,
		PersenVsKemarin:   persen,
		TotalItemTerjual:  totalItem,
		RataRataPerItem:   rataRata,
		LabaHarian:        labaHarian,
		TrenMingguan:      tren,
		TotalHari:         len(labaHarian),
		FilterBulan:       filterBulan,
		FilterTahun:       filterTahun,
		DateFrom:          dateFrom,
		DateTo:            dateTo,
	}, nil
}

// ─── Mitra Dashboard ─────────────────────────────────────────────────────────

func (s *Service) GetMitraDashboard(ctx context.Context, accountID, selectedUMKMID string) (*MitraDashboardData, error) {
	// 1. Resolve mitra_id
	mitraID, namaMitra, err := s.Repo.GetMitraByAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}

	// 2. Daftar UMKM mitra
	umkmList, err := s.Repo.GetUMKMPartnersOfMitra(ctx, mitraID)
	if err != nil || umkmList == nil {
		umkmList = []UMKMMitraItem{}
	}

	// 3. Tentukan UMKM yang akan ditampilkan
	if selectedUMKMID == "" && len(umkmList) > 0 {
		selectedUMKMID = umkmList[0].UMKMID
	}

	var dashboard *UMKMDashboardForMitra

	if selectedUMKMID != "" {
		// Cari nama UMKM
		namaUMKM := selectedUMKMID
		for _, u := range umkmList {
			if u.UMKMID == selectedUMKMID {
				namaUMKM = u.NamaUMKM
				break
			}
		}

		// Gunakan tanggal dari data terbaru UMKM tersebut
		dateFrom, dateTo, rangeErr := s.Repo.GetDefaultDateRange(ctx, selectedUMKMID)
		if rangeErr != nil || dateFrom == "" {
			now := time.Now()
			dateFrom = now.Format("2006-01") + "-01"
			dateTo = now.Format("2006-01-02")
		} else {
			// Ambil bulan dari tanggal terbaru
			t, _ := time.Parse("2006-01-02", dateTo)
			dateFrom = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location()).Format("2006-01-02")
		}

		// Omzet summary
		omzetHariIni, omzetKemarin, totalItem, tglTerkini, _ := s.Repo.GetOmzetSummary(ctx, selectedUMKMID)

		var persen float64
		if omzetKemarin > 0 {
			persen = ((omzetHariIni - omzetKemarin) / omzetKemarin) * 100
		}

		var rataRata float64
		if totalItem > 0 {
			rataRata = omzetHariIni / float64(totalItem)
		}

		labaHarian, _ := s.Repo.GetLabaHarian(ctx, selectedUMKMID, dateFrom, dateTo)
		if labaHarian == nil {
			labaHarian = []LabaHarianItem{}
		}

		tren, _ := s.Repo.GetTrenMingguan(ctx, selectedUMKMID, 7)
		if tren == nil {
			tren = []TrenMingguan{}
		}

		dashboard = &UMKMDashboardForMitra{
			UMKMID:            selectedUMKMID,
			NamaUMKM:          namaUMKM,
			TglTerkini:        tglTerkini,
			TotalOmzetHariIni: omzetHariIni,
			TotalOmzetKemarin: omzetKemarin,
			PersenVsKemarin:   persen,
			TotalItemTerjual:  totalItem,
			RataRataPerItem:   rataRata,
			LabaHarian:        labaHarian,
			TrenMingguan:      tren,
			TotalHari:         len(labaHarian),
			DateFrom:          dateFrom,
			DateTo:            dateTo,
		}
	}

	return &MitraDashboardData{
		NamaMitra: namaMitra,
		UMKMList:  umkmList,
		Dashboard: dashboard,
	}, nil
}
