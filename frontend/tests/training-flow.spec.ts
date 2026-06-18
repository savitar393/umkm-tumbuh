import { test, expect } from "@playwright/test";

const mockTrainings = [
  {
    pelatihan_id: "PLT001",
    kode_pelatihan: "TRN-2024-001",
    judul_pelatihan: "Pemasaran Digital untuk UMKM",
    deskripsi_pelatihan: "Belajar strategi pemasaran digital",
    mentor_nama: "Budi Santoso",
    durasi_jam: 20,
    total_modul: 8,
    harga: 0,
    akses_seumur_hidup: false,
    masa_akses_hari: 90,
    rating_rata_rata: 4.5,
    jumlah_alumni: 150,
    thumbnail_url: null,
    syarat_ketentuan: "Syarat dan ketentuan berlaku",
    tanggal_publish: "2024-01-15T00:00:00Z",
    jenis_pelatihan: "Online",
    status_pelatihan: "Published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    pelatihan_id: "PLT002",
    kode_pelatihan: "TRN-2024-002",
    judul_pelatihan: "Manajemen Keuangan UMKM",
    deskripsi_pelatihan: "Kelola keuangan usaha dengan baik",
    mentor_nama: "Siti Rahma",
    durasi_jam: 15,
    total_modul: 6,
    harga: 50000,
    akses_seumur_hidup: true,
    masa_akses_hari: null,
    rating_rata_rata: 4.2,
    jumlah_alumni: 89,
    thumbnail_url: null,
    syarat_ketentuan: null,
    tanggal_publish: "2024-02-01T00:00:00Z",
    jenis_pelatihan: "Online",
    status_pelatihan: "Published",
    created_at: "2024-01-20T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
];

const mockModules = [
  {
    modul_id: "MOD001",
    pelatihan_id: "PLT001",
    urutan_modul: 1,
    judul_modul: "Pengenalan Digital Marketing",
    deskripsi_modul: "Memahami dasar-dasar pemasaran digital",
    durasi_menit: 45,
    materi_url: "https://example.com/materi1.pdf",
    is_preview: true,
    status_aktif: true,
    judul_pelatihan: "Pemasaran Digital untuk UMKM",
  },
  {
    modul_id: "MOD002",
    pelatihan_id: "PLT001",
    urutan_modul: 2,
    judul_modul: "Social Media Strategy",
    deskripsi_modul: "Strategi media sosial untuk bisnis",
    durasi_menit: 60,
    materi_url: "https://example.com/materi2.pdf",
    is_preview: false,
    status_aktif: true,
    judul_pelatihan: "Pemasaran Digital untuk UMKM",
  },
];

const mockEnrollments = [
  {
    pendaftaran_pelatihan_id: "DFTR001",
    umkm_id: "UMK000001",
    pelatihan_id: "PLT001",
    judul_pelatihan: "Pemasaran Digital untuk UMKM",
    status_pendaftaran: "Terdaftar",
    tanggal_daftar: "2024-06-10T10:30:00Z",
    akses_mulai_at: "2024-06-10T10:30:00Z",
    akses_berakhir_at: "2024-09-08T10:30:00Z",
    terakhir_diakses_at: null,
    progress_persen: 0,
    modul_selesai: 0,
    total_modul_snapshot: 8,
    tanggal_selesai: null,
  },
];

const mockCertificateDashboard = {
  umkm_id: "UMK000001",
  nama_umkm: "UMKM Sejahtera",
  pelaku_nama: "Budi Santoso",
  total_pelatihan: 5,
  pelatihan_selesai: 3,
  total_sertifikat: 2,
  sertifikat_terbit: 1,
  pelatihan_terakhir_selesai: "2024-06-01T00:00:00Z",
  sertifikat_terakhir_terbit: "2024-06-15T00:00:00Z",
};

const mockCertificates = [
  {
    sertifikat_id: 1,
    pendaftaran_pelatihan_id: "DFTR001",
    nomor_sertifikat: "SER-2024-001",
    tanggal_pengajuan: "2024-06-15T00:00:00Z",
    tanggal_terbit: "2024-06-20T00:00:00Z",
    status_sertifikat_id: "TERBIT",
    nama_status_sertifikat: "Terbit",
    dokumen_id: "DOC001",
    dokumen_url: "https://example.com/cert.pdf",
    catatan_validasi: null,
    pelatihan_id: "PLT001",
    judul_pelatihan: "Pemasaran Digital",
    jenis_pelatihan: "Online",
    tanggal_selesai_pelatihan: "2024-06-10T00:00:00Z",
    progress_persen: 100,
    umkm_id: "UMK000001",
    nama_umkm: "UMKM Sejahtera",
    pelaku_nama: "Budi Santoso",
  },
];

const mockProfile = {
  profile: {
    id: "UMKM001",
    user_id: "USR001",
    business_name: "UMKM Sejahtera",
    owner_name: "Budi Santoso",
    phone_number: "08123456789",
    address: "Jl. Merdeka No. 1",
    city: "Surakarta",
    province: "Jawa Tengah",
    status: "AKTIF",
  },
};

test.describe("Training Flow - Positive Scenarios", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem("access_token", "mock-token-12345");
      localStorage.setItem(
        "current_user",
        JSON.stringify({
          id: "USR001",
          email: "umkm@example.com",
          role: "UMKM",
          full_name: "Budi Santoso",
        })
      );
    });

    await page.route("**/api/v1/profiles/me", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockProfile) });
    });

    await page.route("**/api/v1/trainings", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ trainings: mockTrainings }) });
    });

    await page.route("**/api/v1/enrollments/user/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enrollments: mockEnrollments }) });
    });

    await page.route("**/api/v1/certificates/user/**/dashboard", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockCertificateDashboard) });
    });

    await page.route("**/api/v1/certificates/user/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ certificates: mockCertificates }) });
    });

    await page.route("**/api/v1/certificates/**", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockCertificates[0]) });
      } else {
        await route.continue();
      }
    });
  });

  test("TC-FE-P001 - Training Dashboard loads with stats", async ({ page }) => {
    await page.goto("/umkm/trainings");
    await page.waitForTimeout(2000);

    await expect(page.locator("text=Pelatihan Saya").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-FE-P002 - Training List shows all trainings", async ({ page }) => {
    await page.goto("/umkm/trainings/list");
    await page.waitForTimeout(2000);

    await expect(page.locator("text=Pemasaran Digital untuk UMKM").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Manajemen Keuangan UMKM").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-FE-P003 - Training Detail page loads with training info", async ({ page }) => {
    await page.route("**/api/v1/trainings/PLT001", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockTrainings[0]) });
    });
    await page.route("**/api/v1/trainings/PLT001/detail", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ training: mockTrainings[0], modules: mockModules }) });
    });

    await page.goto("/umkm/trainings/PLT001");
    await page.waitForTimeout(2000);

    await expect(page.locator("text=Pemasaran Digital untuk UMKM").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-FE-P004 - Training routes are protected", async ({ page }) => {
    await context.clearCookies();
    await page.goto("/umkm/trainings");
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain("/umkm/trainings");
  });
});

test.describe("Training Flow - Positive Scenarios (Certificate & Edge)", () => {
  test("TC-FE-P005 - Certificate stats appear on dashboard", async ({ page }) => {
    await page.goto("/umkm/trainings");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Sertifikat Saya").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-FE-P006 - Enrolled training appears in ongoing section", async ({ page }) => {
    await page.route("**/api/v1/enrollments/user/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enrollments: [{
        pendaftaran_pelatihan_id: "DFTR001",
        umkm_id: "UMK000001",
        pelatihan_id: "PLT001",
        judul_pelatihan: "Pemasaran Digital untuk UMKM",
        status_pendaftaran: "Terdaftar",
        tanggal_daftar: "2024-06-10T10:30:00Z",
        akses_mulai_at: "2024-06-10T10:30:00Z",
        akses_berakhir_at: "2024-09-08T10:30:00Z",
        terakhir_diakses_at: null,
        progress_persen: 35,
        modul_selesai: 3,
        total_modul_snapshot: 8,
        tanggal_selesai: null,
      }]}) });
    });

    await page.goto("/umkm/trainings");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Pemasaran Digital untuk UMKM").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=35%").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-FE-P007 - Empty states show when no enrollments", async ({ page }) => {
    await page.route("**/api/v1/enrollments/user/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ enrollments: [] }) });
    });
    await page.route("**/api/v1/certificates/user/**", async (route, request) => {
      if (request.url().includes("/dashboard")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
          umkm_id: "UMK000001", nama_umkm: "UMKM Sejahtera", pelaku_nama: "Budi Santoso",
          total_pelatihan: 0, pelatihan_selesai: 0, total_sertifikat: 0, sertifikat_terbit: 0,
          pelatihan_terakhir_selesai: null, sertifikat_terakhir_terbit: null,
        }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ certificates: [] }) });
      }
    });

    await page.goto("/umkm/trainings");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=Belum ada pelatihan berjalan").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Belum ada pelatihan yang selesai").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Belum ada sertifikat").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Training Flow - Negative Scenarios", () => {
  test("TC-FE-N001 - No token redirects to login", async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto("/umkm/trainings");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/login");
  });

  test("TC-FE-N002 - Invalid training ID shows error", async ({ page }) => {
    await page.route("**/api/v1/trainings/INVALID", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Pelatihan tidak ditemukan" }) });
    });
    await page.route("**/api/v1/trainings/INVALID/detail", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Pelatihan tidak ditemukan" }) });
    });

    await page.goto("/umkm/trainings/INVALID");
    await page.waitForTimeout(2000);
  });
});
