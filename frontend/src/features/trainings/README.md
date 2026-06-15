# 🎓 Training Feature - Frontend Documentation

## 📁 File Structure

```
trainings/
├── api.ts              # API fetch functions
├── hooks.ts            # React Query hooks  
├── types.ts            # Zod schemas & TypeScript types
├── store.ts            # Zustand state management
├── routes.tsx          # Route definitions
├── pages/              # Page components
│   ├── TrainingListPage.tsx
│   ├── TrainingDetailPage.tsx
│   ├── TrainingDashboardPage.tsx
│   ├── TrainingLessonPage.tsx
│   ├── TrainingEvaluationPage.tsx
│   ├── TrainingSuccessPage.tsx
│   ├── TrainingAfterSuccessPage.tsx
│   └── TermsModal.tsx
└── README.md           # This file
```

---

## 🔌 API Reference

### Base Configuration
- **Service**: Training Service (Microservice)
- **Port**: `8083`
- **Base URL**: `http://localhost:8083/api/v1`
- **Auth**: Bearer token (automatic via `http` client)

### Available Endpoints

#### 1. Get All Trainings
```typescript
import { getAllTrainings } from './api';

const trainings = await getAllTrainings();
// Returns: TrainingProgram[]
```

**Backend**: `GET /api/v1/trainings`

**Response**:
```json
{
  "trainings": [
    {
      "pelatihan_id": "uuid",
      "kode_pelatihan": "DM-001",
      "judul_pelatihan": "Digital Marketing",
      "durasi_jam": 10,
      "total_modul": 5,
      "harga": 500000,
      // ... other fields
    }
  ]
}
```

#### 2. Get Training By ID
```typescript
import { getTrainingById } from './api';

const training = await getTrainingById('training-uuid');
// Returns: TrainingProgram
```

**Backend**: `GET /api/v1/trainings/:id`

#### 3. Get Training Detail (with Modules)
```typescript
import { getTrainingDetail } from './api';

const detail = await getTrainingDetail('training-uuid');
// Returns: TrainingDetail { training, modules }
```

**Backend**: `GET /api/v1/trainings/:id/detail`

**Response**:
```json
{
  "training": { /* TrainingProgram */ },
  "modules": [
    {
      "modul_id": "uuid",
      "urutan_modul": 1,
      "judul_modul": "Module Title",
      "durasi_menit": 60,
      // ...
    }
  ]
}
```

#### 4. Enroll Training
```typescript
import { enrollTraining } from './api';

const result = await enrollTraining({
  umkm_id: 'user-uuid',
  pelatihan_id: 'training-uuid'
});
// Returns: { message: string, enrollment: Enrollment }
```

**Backend**: `POST /api/v1/trainings/enroll`

#### 5. Get User Enrollments
```typescript
import { getUserEnrollments } from './api';

const enrollments = await getUserEnrollments('user-uuid');
// Returns: Enrollment[]
```

**Backend**: `GET /api/v1/enrollments/user/:umkmID`

#### 6. Update Progress
```typescript
import { updateProgress } from './api';

await updateProgress({
  pendaftaran_pelatihan_id: 'enrollment-uuid',
  modul_selesai: 3,
  total_modul: 5
});
// Returns: { message: string }
```

**Backend**: `PATCH /api/v1/enrollments/progress`

#### 7. Complete Training
```typescript
import { completeTraining } from './api';

await completeTraining({
  pendaftaran_pelatihan_id: 'enrollment-uuid'
});
// Returns: { message: string }
```

**Backend**: `PATCH /api/v1/enrollments/complete`

---

## 🪝 React Query Hooks

### Queries (Read Data)

#### useTrainings()
Fetch all available trainings.

```typescript
import { useTrainings } from '../hooks';

function TrainingListPage() {
  const { 
    data: trainings,     // TrainingProgram[] | undefined
    isLoading,           // boolean
    error,               // Error | null
    refetch              // () => Promise<void>
  } = useTrainings();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {trainings?.map(training => (
        <TrainingCard key={training.pelatihan_id} training={training} />
      ))}
    </div>
  );
}
```

**Cache**: 5 minutes  
**Query Key**: `["trainings", "list"]`

---

#### useTraining(id)
Fetch basic training info by ID.

```typescript
import { useTraining } from '../hooks';

function TrainingCard({ id }: { id: string }) {
  const { data: training, isLoading } = useTraining(id);

  if (isLoading) return <Skeleton />;

  return <h3>{training?.judul_pelatihan}</h3>;
}
```

**Cache**: 5 minutes  
**Query Key**: `["trainings", "detail", id]`  
**Enabled**: Only if `id` is provided

---

#### useTrainingDetail(id)
Fetch training with all modules.

```typescript
import { useTrainingDetail } from '../hooks';
import { useParams } from 'react-router-dom';

function TrainingDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useTrainingDetail(id!);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>{data?.training.judul_pelatihan}</h1>
      <ModuleList modules={data?.modules ?? []} />
    </div>
  );
}
```

**Cache**: 5 minutes  
**Query Key**: `["trainings", "detail", id]`

---

#### useUserEnrollments(umkmId)
Fetch user's enrolled trainings.

```typescript
import { useUserEnrollments } from '../hooks';
import { getCurrentUser } from '@/shared/auth/currentUser';

function MyEnrollmentsPage() {
  const user = getCurrentUser();
  const { data: enrollments, isLoading } = useUserEnrollments(user.umkm_id);

  return (
    <div>
      <h2>My Trainings ({enrollments?.length ?? 0})</h2>
      {enrollments?.map(enrollment => (
        <EnrollmentCard 
          key={enrollment.pendaftaran_pelatihan_id} 
          enrollment={enrollment} 
        />
      ))}
    </div>
  );
}
```

**Cache**: 2 minutes (more frequent updates)  
**Query Key**: `["enrollments", "user", umkmId]`

---

### Mutations (Write Data)

#### useEnrollTraining()
Enroll user to a training.

```typescript
import { useEnrollTraining } from '../hooks';
import { getCurrentUser } from '@/shared/auth/currentUser';

function EnrollButton({ trainingId }: { trainingId: string }) {
  const user = getCurrentUser();
  const enrollMutation = useEnrollTraining();

  const handleEnroll = () => {
    enrollMutation.mutate({
      umkm_id: user.umkm_id,
      pelatihan_id: trainingId,
    }, {
      onSuccess: (data) => {
        alert(data.message); // "Berhasil mendaftar pelatihan"
        // Navigate to learning page
      },
      onError: (error) => {
        alert(error.message);
      }
    });
  };

  return (
    <button 
      onClick={handleEnroll}
      disabled={enrollMutation.isPending}
    >
      {enrollMutation.isPending ? 'Mendaftar...' : 'Daftar Pelatihan'}
    </button>
  );
}
```

**Auto-invalidates**: `["enrollments", "user", umkmId]`

---

#### useUpdateProgress()
Update learning progress.

```typescript
import { useUpdateProgress } from '../hooks';

function CompleteModuleButton({ 
  enrollmentId, 
  moduleNumber, 
  totalModules 
}) {
  const updateProgress = useUpdateProgress();

  const handleComplete = () => {
    updateProgress.mutate({
      pendaftaran_pelatihan_id: enrollmentId,
      modul_selesai: moduleNumber,
      total_modul: totalModules,
    }, {
      onSuccess: () => {
        // Navigate to next module
        console.log('Progress updated!');
      }
    });
  };

  return (
    <button 
      onClick={handleComplete}
      disabled={updateProgress.isPending}
    >
      Selesai & Lanjut
    </button>
  );
}
```

**Auto-invalidates**: All `["enrollments", ...]` queries

---

#### useCompleteTraining()
Mark training as completed.

```typescript
import { useCompleteTraining } from '../hooks';
import { useNavigate } from 'react-router-dom';

function FinalModuleButtons({ enrollmentId }) {
  const completeTraining = useCompleteTraining();
  const navigate = useNavigate();

  const handleComplete = () => {
    completeTraining.mutate(
      { pendaftaran_pelatihan_id: enrollmentId },
      {
        onSuccess: () => {
          navigate('/trainings/success');
        }
      }
    );
  };

  return (
    <button onClick={handleComplete}>
      🎉 Selesaikan Pelatihan
    </button>
  );
}
```

**Auto-invalidates**: All `["enrollments", ...]` queries

---

## 🗄️ Zustand Store

### State Structure

```typescript
interface TrainingStore {
  // Filters for training list
  filters: {
    category: string;
    search: string;
    level?: string;
  };

  // Lesson progress tracking
  lessonState: {
    currentModuleId: string | null;
    completedModules: string[];
  };

  // Currently selected training
  selectedTrainingId: string | null;

  // Actions
  setFilters: (filters: Partial<TrainingFilters>) => void;
  resetFilters: () => void;
  setCurrentModule: (moduleId: string) => void;
  markModuleCompleted: (moduleId: string) => void;
  resetLessonState: () => void;
  setSelectedTrainingId: (id: string | null) => void;
}
```

### Usage Examples

#### Filter Training List
```typescript
import { useTrainingStore } from '../store';

function TrainingFilters() {
  const { filters, setFilters } = useTrainingStore();

  return (
    <div>
      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Cari pelatihan..."
      />
      
      <select
        value={filters.category}
        onChange={(e) => setFilters({ category: e.target.value })}
      >
        <option>Semua Pelatihan</option>
        <option>Digital Marketing</option>
        <option>Financial Management</option>
      </select>
    </div>
  );
}
```

#### Track Module Progress
```typescript
import { useTrainingStore } from '../store';

function LessonPage() {
  const { 
    lessonState, 
    setCurrentModule, 
    markModuleCompleted 
  } = useTrainingStore();

  const handleModuleStart = (moduleId: string) => {
    setCurrentModule(moduleId);
  };

  const handleModuleComplete = (moduleId: string) => {
    markModuleCompleted(moduleId);
  };

  const isCompleted = (moduleId: string) => {
    return lessonState.completedModules.includes(moduleId);
  };

  // Component JSX...
}
```

#### Persist Selected Training
```typescript
import { useTrainingStore } from '../store';

function TrainingCard({ training }) {
  const setSelectedTrainingId = useTrainingStore(
    (state) => state.setSelectedTrainingId
  );

  const handleClick = () => {
    setSelectedTrainingId(training.pelatihan_id);
    // Navigate...
  };

  // Component JSX...
}
```

**Note**: `lessonState` and `selectedTrainingId` are persisted to localStorage automatically.

---

## 📘 Type Definitions

### Core Types

```typescript
// Training Program
type TrainingProgram = {
  pelatihan_id: string;
  kode_pelatihan: string;
  judul_pelatihan: string;
  deskripsi_pelatihan: string | null;
  mentor_nama: string | null;
  durasi_jam: number;
  total_modul: number;
  harga: number;
  akses_seumur_hidup: boolean;
  masa_akses_hari: number | null;
  rating_rata_rata: number | null;
  jumlah_alumni: number;
  thumbnail_url: string | null;
  syarat_ketentuan: string | null;
  tanggal_publish: string | null;
  jenis_pelatihan: string;
  status_pelatihan: string;
  created_at: string;
  updated_at: string;
};

// Training Module
type TrainingModule = {
  modul_id: string;
  pelatihan_id: string;
  urutan_modul: number;
  judul_modul: string;
  deskripsi_modul: string | null;
  durasi_menit: number;
  materi_url: string | null;
  is_preview: boolean;
  status_aktif: boolean;
  judul_pelatihan: string;
};

// Enrollment
type Enrollment = {
  pendaftaran_pelatihan_id: string;
  umkm_id: string;
  pelatihan_id: string;
  judul_pelatihan: string;
  status_pendaftaran: string;
  tanggal_daftar: string;
  akses_mulai_at: string | null;
  akses_berakhir_at: string | null;
  terakhir_diakses_at: string | null;
  progress_persen: number;
  modul_selesai: number;
  total_modul_snapshot: number;
  tanggal_selesai: string | null;
};

// Training Detail (composite)
type TrainingDetail = {
  training: TrainingProgram;
  modules: TrainingModule[];
};
```

### Request Types

```typescript
interface EnrollRequest {
  umkm_id: string;
  pelatihan_id: string;
}

interface UpdateProgressRequest {
  pendaftaran_pelatihan_id: string;
  modul_selesai: number;
  total_modul: number;
}

interface CompleteTrainingRequest {
  pendaftaran_pelatihan_id: string;
}
```

---

## 🎯 Common Patterns

### Pattern 1: List → Detail → Enroll Flow

```typescript
// 1. List Page
function TrainingListPage() {
  const { data: trainings } = useTrainings();
  
  return trainings?.map(training => (
    <Link to={`/trainings/${training.pelatihan_id}`}>
      <TrainingCard training={training} />
    </Link>
  ));
}

// 2. Detail Page
function TrainingDetailPage() {
  const { id } = useParams();
  const { data } = useTrainingDetail(id!);
  
  return (
    <div>
      <TrainingInfo training={data?.training} />
      <ModuleList modules={data?.modules} />
      <EnrollButton trainingId={id!} />
    </div>
  );
}

// 3. Enroll Button
function EnrollButton({ trainingId }) {
  const user = getCurrentUser();
  const enrollMutation = useEnrollTraining();
  
  const handleEnroll = () => {
    enrollMutation.mutate({
      umkm_id: user.umkm_id,
      pelatihan_id: trainingId,
    });
  };
  
  return <button onClick={handleEnroll}>Daftar</button>;
}
```

### Pattern 2: Learning Flow with Progress

```typescript
function LessonPage() {
  const { enrollmentId } = useParams();
  const { lessonState, markModuleCompleted } = useTrainingStore();
  const updateProgress = useUpdateProgress();
  const [currentModule, setCurrentModule] = useState(1);

  const handleCompleteModule = () => {
    // 1. Update local state
    markModuleCompleted(`module-${currentModule}`);
    
    // 2. Sync with backend
    updateProgress.mutate({
      pendaftaran_pelatihan_id: enrollmentId,
      modul_selesai: currentModule,
      total_modul: 5,
    });
    
    // 3. Navigate to next
    setCurrentModule(prev => prev + 1);
  };

  return (
    <div>
      <VideoPlayer moduleId={currentModule} />
      <button onClick={handleCompleteModule}>
        Next Module
      </button>
    </div>
  );
}
```

### Pattern 3: Conditional Rendering Based on Enrollment

```typescript
function TrainingActionButton({ trainingId }) {
  const user = getCurrentUser();
  const { data: enrollments } = useUserEnrollments(user.umkm_id);
  
  const enrollment = enrollments?.find(
    e => e.pelatihan_id === trainingId
  );

  if (!enrollment) {
    return <EnrollButton trainingId={trainingId} />;
  }

  if (enrollment.status_pendaftaran === 'selesai') {
    return <ViewCertificateButton enrollmentId={enrollment.pendaftaran_pelatihan_id} />;
  }

  return (
    <Link to={`/trainings/${trainingId}/learn`}>
      <button>Lanjutkan Belajar ({enrollment.progress_persen}%)</button>
    </Link>
  );
}
```

---

## 🚦 Status & Error Handling

### Loading States

```typescript
function TrainingList() {
  const { data, isLoading, isFetching, isError, error } = useTrainings();

  if (isLoading) {
    return <Skeleton count={3} />;
  }

  if (isError) {
    return (
      <ErrorMessage>
        {error.message || 'Failed to load trainings'}
        <button onClick={() => refetch()}>Retry</button>
      </ErrorMessage>
    );
  }

  if (isFetching) {
    // Data available tapi sedang refetch
    return (
      <>
        <RefreshIndicator />
        <TrainingList data={data} />
      </>
    );
  }

  return <TrainingList data={data} />;
}
```

### Mutation States

```typescript
function EnrollButton({ trainingId }) {
  const enrollMutation = useEnrollTraining();

  return (
    <>
      <button
        onClick={() => enrollMutation.mutate(/* ... */)}
        disabled={enrollMutation.isPending}
      >
        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll'}
      </button>

      {enrollMutation.isError && (
        <ErrorText>{enrollMutation.error.message}</ErrorText>
      )}

      {enrollMutation.isSuccess && (
        <SuccessText>Successfully enrolled!</SuccessText>
      )}
    </>
  );
}
```

---

## 🔄 Cache Management

### Manual Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { trainingKeys } from '../hooks';

function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate specific query
    queryClient.invalidateQueries({
      queryKey: trainingKeys.list()
    });

    // Or invalidate all training queries
    queryClient.invalidateQueries({
      queryKey: trainingKeys.all
    });
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

### Manual Refetch

```typescript
function TrainingList() {
  const { data, refetch } = useTrainings();

  return (
    <>
      <button onClick={() => refetch()}>Refresh</button>
      {/* ... */}
    </>
  );
}
```

---

## 📚 Further Reading

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Zod Docs](https://zod.dev/)
- [React Router Docs](https://reactrouter.com/)

---

## 🐛 Debugging Tips

### 1. Check Network Requests
```javascript
// Browser DevTools Console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('8083'))
  .forEach(r => console.log(r.name, r.duration));
```

### 2. Inspect React Query Cache
```javascript
// Install React Query DevTools first
// Then check the DevTools tab in browser
```

### 3. Check Zustand State
```javascript
// Browser Console
JSON.parse(localStorage.getItem('training-storage'));
```

### 4. Debug Hook Returns
```typescript
const result = useTrainings();
console.log('useTrainings result:', result);
// Check: data, isLoading, error, etc.
```

---

**Last Updated**: June 10, 2026
