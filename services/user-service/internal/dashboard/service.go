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
	// 1. Resolve umkm_id — kalau belum punya profil UMKM, return kosong bukan error
	umkmID, namaUMKM, err := s.Repo.GetUMKMByAccount(ctx, accountID)
	if err != nil {
		return &UMKMDashboardData{
			NamaUMKM:     "Profil belum dibuat",
			LabaHarian:   []LabaHarianItem{},
			TrenMingguan: []TrenMingguan{},
			DateFrom:     dateFrom,
			DateTo:       dateTo,
		}, nil
	}

	// 2. Resolusi rentang tanggal
	minDB, maxDB, rangeErr := s.Repo.GetDefaultDateRange(ctx, umkmID)
	if rangeErr != nil || minDB == "" {
		now := time.Now()
		minDB = now.Format("2006-01") + "-01"
		maxDB = now.Format("2006-01-02")
	}

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

	// 6. Omzet bulanan
	omzetBulanIni, omzetBulanLalu, _ := s.Repo.GetOmzetBulanan(ctx, umkmID)
	var persenBulan float64
	if omzetBulanLalu > 0 {
		persenBulan = ((omzetBulanIni - omzetBulanLalu) / omzetBulanLalu) * 100
	}

	// 7. Laba harian (tabel)
	labaHarian, err := s.Repo.GetLabaHarian(ctx, umkmID, dateFrom, dateTo)
	if err != nil || labaHarian == nil {
		labaHarian = []LabaHarianItem{}
	}

	// 8. Tren — pakai 7 hari default (frontend minta data, kita selalu kirim 90 hari biar bisa filter 7/14/30/90 di FE)
	tren, err := s.Repo.GetTrenMingguan(ctx, umkmID, 90)
	if err != nil || tren == nil {
		tren = []TrenMingguan{}
	}

	// 9. Parse nama bulan dari dateFrom
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
		OmzetBulanIni:     omzetBulanIni,
		OmzetBulanLalu:    omzetBulanLalu,
		PersenVsBulanLalu: persenBulan,
		TotalItemTerjual:  totalItem,
		RataRataPerItem:   rataRata,
		LabaHarian:        labaHarian,
		TrenMingguan:      tren,
		TotalHari:         len(labaHarian),
		FilterBulan:       filterBulan,
		FilterTahun:       filterTahun,
		DateFrom:          dateFrom,
		DateTo:            dateTo,
		TrendDays:         90,
	}, nil
}

// ─── Mitra Dashboard ─────────────────────────────────────────────────────────

func (s *Service) GetMitraDashboard(ctx context.Context, accountID, selectedUMKMID, dateFrom, dateTo string) (*MitraDashboardData, error) {
	mitraID, namaMitra, err := s.Repo.GetMitraByAccount(ctx, accountID)
	if err != nil {
		return &MitraDashboardData{
			NamaMitra: "Profil belum dibuat",
			UMKMList:  []UMKMMitraItem{},
			Dashboard: nil,
		}, nil
	}

	umkmList, err := s.Repo.GetUMKMPartnersOfMitra(ctx, mitraID)
	if err != nil || umkmList == nil {
		umkmList = []UMKMMitraItem{}
	}

	if selectedUMKMID == "" && len(umkmList) > 0 {
		selectedUMKMID = umkmList[0].UMKMID
	}

	var dashboard *UMKMDashboardForMitra

	if selectedUMKMID != "" {
		namaUMKM := selectedUMKMID
		for _, u := range umkmList {
			if u.UMKMID == selectedUMKMID {
				namaUMKM = u.NamaUMKM
				break
			}
		}

		if dateFrom == "" || dateTo == "" {
			dFrom, dTo, rangeErr := s.Repo.GetDefaultDateRange(ctx, selectedUMKMID)
			if rangeErr != nil || dFrom == "" {
				now := time.Now()
				dateFrom = now.Format("2006-01") + "-01"
				dateTo = now.Format("2006-01-02")
			} else {
				dateFrom, dateTo = dFrom, dTo
			}
		}

		kategoriUsaha, _ := s.Repo.GetKategoriUsaha(ctx, selectedUMKMID)

		omzetHariIni, omzetKemarin, totalItem, tglTerkini, _ := s.Repo.GetOmzetSummary(ctx, selectedUMKMID)

		var persen float64
		if omzetKemarin > 0 {
			persen = ((omzetHariIni - omzetKemarin) / omzetKemarin) * 100
		}

		var rataRata float64
		if totalItem > 0 {
			rataRata = omzetHariIni / float64(totalItem)
		}

		omzetBulanIni, omzetBulanLalu, _ := s.Repo.GetOmzetBulanan(ctx, selectedUMKMID)
		var persenBulan float64
		if omzetBulanLalu > 0 {
			persenBulan = ((omzetBulanIni - omzetBulanLalu) / omzetBulanLalu) * 100
		}

		labaHarian, _ := s.Repo.GetLabaHarian(ctx, selectedUMKMID, dateFrom, dateTo)
		if labaHarian == nil {
			labaHarian = []LabaHarianItem{}
		}

		tren, _ := s.Repo.GetTrenMingguan(ctx, selectedUMKMID, 90)
		if tren == nil {
			tren = []TrenMingguan{}
		}

		dashboard = &UMKMDashboardForMitra{
			UMKMID:            selectedUMKMID,
			NamaUMKM:          namaUMKM,
			KategoriUsaha:     kategoriUsaha,
			TglTerkini:        tglTerkini,
			TotalOmzetHariIni: omzetHariIni,
			TotalOmzetKemarin: omzetKemarin,
			PersenVsKemarin:   persen,
			OmzetBulanIni:     omzetBulanIni,
			OmzetBulanLalu:    omzetBulanLalu,
			PersenVsBulanLalu: persenBulan,
			TotalItemTerjual:  totalItem,
			RataRataPerItem:   rataRata,
			LabaHarian:        labaHarian,
			TrenMingguan:      tren,
			TotalHari:         len(labaHarian),
			DateFrom:          dateFrom,
			DateTo:            dateTo,
			TrendDays:         90,
		}
	}

	return &MitraDashboardData{
		NamaMitra: namaMitra,
		UMKMList:  umkmList,
		Dashboard: dashboard,
	}, nil
}
