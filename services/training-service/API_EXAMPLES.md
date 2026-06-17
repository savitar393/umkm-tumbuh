# Training Service - API Examples

Contoh penggunaan Training Service API dengan curl dan JavaScript fetch.

## Base URL
```
http://localhost:8083/api/v1
```

## 📍 Endpoints

### 1. Get All Trainings

**Request:**
```bash
curl http://localhost:8083/api/v1/trainings
```

**Response:**
```json
{
  "trainings": [
    {
      "pelatihan_id": "PLT001",
      "kode_pelatihan": "TRN-2024-001",
      "judul_pelatihan": "Pemasaran Digital untuk UMKM",
      "deskripsi_pelatihan": "Belajar strategi pemasaran digital...",
      "mentor_nama": "Budi Santoso",
      "durasi_jam": 20,
      "total_modul": 8,
      "harga": 0,
      "akses_seumur_hidup": false,
      "masa_akses_hari": 90,
      "rating_rata_rata": 4.5,
      "jumlah_alumni": 150,
      "thumbnail_url": "https://...",
      "jenis_pelatihan": "Online",
       "status_pelatihan": "PUBLISHED"
    }
  ]
}
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:8083/api/v1/trainings');
const data = await response.json();
console.log(data.trainings);
```

### 2. Get Training Detail with Modules

**Request:**
```bash
curl http://localhost:8083/api/v1/trainings/PLT001/detail
```

**Response:**
```json
{
  "training": {
    "pelatihan_id": "PLT001",
    "judul_pelatihan": "Pemasaran Digital untuk UMKM",
    "total_modul": 8,
    ...
  },
  "modules": [
    {
      "modul_id": "MOD001",
      "urutan_modul": 1,
      "judul_modul": "Pengenalan Digital Marketing",
      "durasi_menit": 45,
      "is_preview": true,
      "materi_url": "https://..."
    },
    {
      "modul_id": "MOD002",
      "urutan_modul": 2,
      "judul_modul": "Social Media Strategy",
      "durasi_menit": 60,
      "is_preview": false,
      "materi_url": "https://..."
    }
  ]
}
```

**JavaScript:**
```javascript
const pelatihanId = 'PLT001';
const response = await fetch(
  `http://localhost:8083/api/v1/trainings/${pelatihanId}/detail`
);
const { training, modules } = await response.json();
```

### 3. Enroll User to Training

**Request:**
```bash
curl -X POST http://localhost:8083/api/v1/trainings/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "UMKM123ABC456DEF7890",
    "pelatihan_id": "PLT001"
  }'
```

**Response:**
```json
{
  "message": "Berhasil mendaftar pelatihan",
  "enrollment": {
    "pendaftaran_pelatihan_id": "DFTR12345678901234567890",
    "umkm_id": "UMKM123ABC456DEF7890",
    "pelatihan_id": "PLT001",
    "judul_pelatihan": "Pemasaran Digital untuk UMKM",
       "status_pendaftaran": "TERDAFTAR",
       "tanggal_daftar": "2026-06-10T10:30:00Z",
       "akses_mulai_at": "2026-06-10T10:30:00Z",
       "akses_berakhir_at": "2026-09-08T10:30:00Z",
       "progress_persen": 0,
       "modul_selesai": 0,
       "total_modul_snapshot": 8
     }
   }
 }
 ```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:8083/api/v1/trainings/enroll', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    umkm_id: 'UMKM123ABC456DEF7890',
    pelatihan_id: 'PLT001'
  })
});
const data = await response.json();
console.log(data.message);
```

### 4. Get User Enrollments

**Request:**
```bash
curl http://localhost:8083/api/v1/enrollments/user/UMKM123ABC456DEF7890
```

**Response:**
```json
{
  "enrollments": [
    {
      "pendaftaran_pelatihan_id": "DFTR12345678901234567890",
      "umkm_id": "UMKM123ABC456DEF7890",
      "pelatihan_id": "PLT001",
      "judul_pelatihan": "Pemasaran Digital untuk UMKM",
       "status_pendaftaran": "TERDAFTAR",
       "progress_persen": 37.5,
      "modul_selesai": 3,
      "total_modul_snapshot": 8,
      "tanggal_daftar": "2026-06-10T10:30:00Z",
      "terakhir_diakses_at": "2026-06-10T15:20:00Z"
    },
    {
      "pendaftaran_pelatihan_id": "DFTR98765432109876543210",
      "umkm_id": "UMKM123ABC456DEF7890",
      "pelatihan_id": "PLT002",
      "judul_pelatihan": "Manajemen Keuangan UMKM",
      "status_pendaftaran": "SELESAI",
      "progress_persen": 100,
      "modul_selesai": 6,
      "total_modul_snapshot": 6,
      "tanggal_daftar": "2026-05-01T08:00:00Z",
      "tanggal_selesai": "2026-05-25T16:45:00Z"
    }
  ]
}
```

**JavaScript:**
```javascript
const umkmId = 'UMKM123ABC456DEF7890';
const response = await fetch(
  `http://localhost:8083/api/v1/enrollments/user/${umkmId}`
);
const { enrollments } = await response.json();
```

## 🔄 Error Responses

### 400 Bad Request
```json
{
  "error": "UMKM ID dan Pelatihan ID harus diisi"
}
```

### 404 Not Found
```json
{
  "error": "Pelatihan tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "error": "Terjadi kesalahan pada server"
}
```

## 💡 Integration Tips

### React Component Example
```typescript
// services/trainingService.ts
export const trainingService = {
  async getAllTrainings() {
    const response = await fetch('http://localhost:8083/api/v1/trainings');
    return response.json();
  },

  async getTrainingDetail(pelatihanId: string) {
    const response = await fetch(
      `http://localhost:8083/api/v1/trainings/${pelatihanId}/detail`
    );
    return response.json();
  },

  async enrollTraining(umkmId: string, pelatihanId: string) {
    const response = await fetch(
      'http://localhost:8083/api/v1/trainings/enroll',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ umkm_id: umkmId, pelatihan_id: pelatihanId })
      }
    );
    return response.json();
  },

  async getUserEnrollments(umkmId: string) {
    const response = await fetch(
      `http://localhost:8083/api/v1/enrollments/user/${umkmId}`
    );
    return response.json();
  }
};

// Component
function TrainingList() {
  const [trainings, setTrainings] = useState([]);

  useEffect(() => {
    trainingService.getAllTrainings()
      .then(data => setTrainings(data.trainings));
  }, []);

  return (
    <div>
      {trainings.map(training => (
        <div key={training.pelatihan_id}>
          <h3>{training.judul_pelatihan}</h3>
          <p>{training.deskripsi_pelatihan}</p>
        </div>
      ))}
    </div>
  );
}
```

## 📝 Notes

1. Semua timestamps dalam format ISO 8601 (UTC)
2. Progress dihitung otomatis berdasarkan modul selesai
3. Enrollment otomatis set `akses_mulai_at` ke NOW
4. `akses_berakhir_at` dihitung dari `masa_akses_hari` pelatihan
5. Status pendaftaran: TERDAFTAR, SELESAI, EXPIRED
