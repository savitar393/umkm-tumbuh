// Contoh data untuk testing peta Indonesia
// Data dummy untuk menunjukkan persebaran omzet UMKM per provinsi

export const testMapData = [
  // Jawa - data tinggi
  { provinsi: "DKI Jakarta", kabupaten_kota: "Jakarta Pusat", total_umkm: 1250, total_umkm_aktif: 1100, total_laba: 12500000000, latitude_avg: -6.2088, longitude_avg: 106.8456 },
  { provinsi: "Jawa Barat", kabupaten_kota: "Bandung", total_umkm: 980, total_umkm_aktif: 850, total_laba: 8500000000, latitude_avg: -6.9175, longitude_avg: 107.6191 },
  { provinsi: "Jawa Tengah", kabupaten_kota: "Semarang", total_umkm: 720, total_umkm_aktif: 650, total_laba: 6500000000, latitude_avg: -6.9667, longitude_avg: 110.4167 },
  { provinsi: "Jawa Timur", kabupaten_kota: "Surabaya", total_umkm: 890, total_umkm_aktif: 780, total_laba: 9500000000, latitude_avg: -7.2504, longitude_avg: 112.7688 },
  
  // Sumatera - data sedang
  { provinsi: "Sumatera Utara", kabupaten_kota: "Medan", total_umkm: 450, total_umkm_aktif: 380, total_laba: 3800000000, latitude_avg: 3.5952, longitude_avg: 98.6722 },
  { provinsi: "Riau", kabupaten_kota: "Pekanbaru", total_umkm: 320, total_umkm_aktif: 280, total_laba: 3200000000, latitude_avg: 0.5071, longitude_avg: 101.4478 },
  { provinsi: "Sumatera Selatan", kabupaten_kota: "Palembang", total_umkm: 280, total_umkm_aktif: 240, total_laba: 2500000000, latitude_avg: -2.9761, longitude_avg: 104.7754 },
  
  // Kalimantan - data rendah
  { provinsi: "Kalimantan Timur", kabupaten_kota: "Samarinda", total_umkm: 180, total_umkm_aktif: 150, total_laba: 1800000000, latitude_avg: -0.5022, longitude_avg: 117.1536 },
  { provinsi: "Kalimantan Selatan", kabupaten_kota: "Banjarmasin", total_umkm: 150, total_umkm_aktif: 120, total_laba: 1200000000, latitude_avg: -3.3186, longitude_avg: 114.5944 },
  
  // Sulawesi - data sedang
  { provinsi: "Sulawesi Selatan", kabupaten_kota: "Makassar", total_umkm: 220, total_umkm_aktif: 190, total_laba: 2200000000, latitude_avg: -5.1477, longitude_avg: 119.4327 },
  { provinsi: "Sulawesi Utara", kabupaten_kota: "Manado", total_umkm: 120, total_umkm_aktif: 100, total_laba: 950000000, latitude_avg: 1.4748, longitude_avg: 124.8421 },
  
  // Bali & Nusa Tenggara
  { provinsi: "Bali", kabupaten_kota: "Denpasar", total_umkm: 190, total_umkm_aktif: 170, total_laba: 2100000000, latitude_avg: -8.6705, longitude_avg: 115.2126 },
  { provinsi: "Nusa Tenggara Barat", kabupaten_kota: "Mataram", total_umkm: 110, total_umkm_aktif: 90, total_laba: 850000000, latitude_avg: -8.5833, longitude_avg: 116.1167 },
  
  // Papua - data rendah
  { provinsi: "Papua", kabupaten_kota: "Jayapura", total_umkm: 60, total_umkm_aktif: 50, total_laba: 450000000, latitude_avg: -2.533, longitude_avg: 140.7169 },
  { provinsi: "Papua Barat", kabupaten_kota: "Manokwari", total_umkm: 40, total_umkm_aktif: 35, total_laba: 320000000, latitude_avg: -0.8615, longitude_avg: 134.062 },
  
  // Beberapa provinsi tidak ada data (akan ditampilkan dengan warna abu-abu)
  // Contoh: Aceh, Maluku, Maluku Utara, Gorontalo, dll tidak ada dalam data ini
];

// Data untuk menunjukkan semua provinsi dengan warna berbeda berdasarkan omzet
export const allProvincesSummary = [
  { provinsi: "DKI Jakarta", total_umkm: 1250, total_laba: 12500000000 },
  { provinsi: "Jawa Barat", total_umkm: 980, total_laba: 8500000000 },
  { provinsi: "Jawa Tengah", total_umkm: 720, total_laba: 6500000000 },
  { provinsi: "Jawa Timur", total_umkm: 890, total_laba: 9500000000 },
  { provinsi: "Banten", total_umkm: 310, total_laba: 2800000000 },
  { provinsi: "DI Yogyakarta", total_umkm: 180, total_laba: 1600000000 },
  { provinsi: "Bali", total_umkm: 190, total_laba: 2100000000 },
  { provinsi: "Nusa Tenggara Barat", total_umkm: 110, total_laba: 850000000 },
  { provinsi: "Nusa Tenggara Timur", total_umkm: 95, total_laba: 700000000 },
  { provinsi: "Aceh", total_umkm: 0, total_laba: 0 },
  { provinsi: "Sumatera Utara", total_umkm: 450, total_laba: 3800000000 },
  { provinsi: "Sumatera Barat", total_umkm: 210, total_laba: 1800000000 },
  { provinsi: "Riau", total_umkm: 320, total_laba: 3200000000 },
  { provinsi: "Jambi", total_umkm: 130, total_laba: 1100000000 },
  { provinsi: "Sumatera Selatan", total_umkm: 280, total_laba: 2500000000 },
  { provinsi: "Bengkulu", total_umkm: 75, total_laba: 650000000 },
  { provinsi: "Lampung", total_umkm: 160, total_laba: 1400000000 },
  { provinsi: "Kepulauan Bangka Belitung", total_umkm: 90, total_laba: 750000000 },
  { provinsi: "Kepulauan Riau", total_umkm: 120, total_laba: 1100000000 },
  { provinsi: "Kalimantan Barat", total_umkm: 140, total_laba: 1150000000 },
  { provinsi: "Kalimantan Tengah", total_umkm: 85, total_laba: 700000000 },
  { provinsi: "Kalimantan Selatan", total_umkm: 150, total_laba: 1200000000 },
  { provinsi: "Kalimantan Timur", total_umkm: 180, total_laba: 1800000000 },
  { provinsi: "Kalimantan Utara", total_umkm: 45, total_laba: 400000000 },
  { provinsi: "Sulawesi Utara", total_umkm: 120, total_laba: 950000000 },
  { provinsi: "Sulawesi Tengah", total_umkm: 95, total_laba: 800000000 },
  { provinsi: "Sulawesi Selatan", total_umkm: 220, total_laba: 2200000000 },
  { provinsi: "Sulawesi Tenggara", total_umkm: 80, total_laba: 650000000 },
  { provinsi: "Gorontalo", total_umkm: 55, total_laba: 450000000 },
  { provinsi: "Sulawesi Barat", total_umkm: 65, total_laba: 550000000 },
  { provinsi: "Maluku", total_umkm: 50, total_laba: 400000000 },
  { provinsi: "Maluku Utara", total_umkm: 40, total_laba: 350000000 },
  { provinsi: "Papua", total_umkm: 60, total_laba: 450000000 },
  { provinsi: "Papua Barat", total_umkm: 40, total_laba: 320000000 },
  { provinsi: "Papua Selatan", total_umkm: 0, total_laba: 0 },
  { provinsi: "Papua Tengah", total_umkm: 0, total_laba: 0 },
  { provinsi: "Papua Pegunungan", total_umkm: 0, total_laba: 0 },
  { provinsi: "Papua Barat Daya", total_umkm: 0, total_laba: 0 },
];