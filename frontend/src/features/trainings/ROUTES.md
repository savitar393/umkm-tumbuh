# 🛣️ Training Routes Documentation

## 📋 Overview

Frontend routing untuk Training Service dengan struktur nested routes yang clean dan RESTful.

---

## 🗺️ Route Structure

### Base Path
- **UMKM Users**: `/umkm/trainings/*`
- **MITRA Users**: `/mitra/trainings/*` (jika ada akses)

### Route Tree
```
/umkm/trainings
├── /                           → Dashboard (My Enrollments)
├── /list                       → Browse Trainings (Catalog)
├── /:id                        → Training Detail
├── /:id/lesson/:lessonId       → Lesson/Module View
├── /:id/evaluation             → Final Evaluation
├── /:id/success                → Completion Success
└── /:id/verification           → Post-Completion
```

---

## 📍 Route Definitions

### 1. Training Dashboard
**Path**: `/umkm/trainings`  
**Component**: `TrainingDashboardPage`  
**Purpose**: User's enrolled trainings with progress tracking

**Features**:
- List of enrolled trainings
- Progress bars for each enrollment
- Quick access to continue learning
- Filter by status (in progress, completed)

**API Calls**:
```typescript
const { data: enrollments } = useUserEnrollments(currentUser.umkm_id);
```

**Backend Endpoint**: `GET /api/v1/enrollments/user/:umkmID`

**Example URL**: `http://localhost:5173/umkm/trainings`

---

### 2. Training List (Catalog)
**Path**: `/umkm/trainings/list`  
**Component**: `TrainingListPage`  
**Purpose**: Browse all available trainings

**Features**:
- Display all published trainings
- Search and filter functionality
- Category filtering
- Sort by popularity, date, rating
- Quick enroll button

**API Calls**:
```typescript
const { data: trainings } = useTrainings();
```

**Backend Endpoint**: `GET /api/v1/trainings`

**Example URL**: `http://localhost:5173/umkm/trainings/list`

**Query Params** (optional):
- `?search=digital%20marketing`
- `?category=business`
- `?sort=popular`

---

### 3. Training Detail
**Path**: `/umkm/trainings/:id`  
**Component**: `TrainingDetailPage`  
**Purpose**: Detailed information about a specific training

**Features**:
- Training overview (title, description, mentor)
- Module/lesson list with duration
- Enrollment button
- Preview modules (if available)
- Requirements and prerequisites
- Rating and reviews

**API Calls**:
```typescript
const { id } = useParams();
const { data: detail } = useTrainingDetail(id!);
const { data: enrollments } = useUserEnrollments(currentUser.umkm_id);

// Check if already enrolled
const isEnrolled = enrollments?.some(e => e.pelatihan_id === id);
```

**Backend Endpoint**: `GET /api/v1/trainings/:id/detail`

**Example URL**: `http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000`

**URL Parameters**:
- `:id` - Training ID (UUID)

**Navigation**:
- If not enrolled → Show "Enroll Now" button
- If enrolled → Show "Continue Learning" button → Navigate to first incomplete module
- If completed → Show "View Certificate" button

---

### 4. Lesson/Module View
**Path**: `/umkm/trainings/:id/lesson/:lessonId`  
**Component**: `TrainingLessonPage`  
**Purpose**: Individual lesson/module learning interface

**Features**:
- Video player or content display
- Module navigation (previous/next)
- Progress indicator
- Complete module button
- Notes and resources
- Module description

**API Calls**:
```typescript
const { id, lessonId } = useParams();
const { data: detail } = useTrainingDetail(id!);
const updateProgress = useUpdateProgress();

// Find current module
const currentModule = detail?.modules.find(m => m.modul_id === lessonId);

// On complete
const handleCompleteModule = () => {
  updateProgress.mutate({
    pendaftaran_pelatihan_id: enrollmentId,
    modul_selesai: currentModule.urutan_modul,
    total_modul: detail.modules.length,
  });
};
```

**Backend Endpoint**: `PATCH /api/v1/enrollments/progress`

**Example URL**: 
```
http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/lesson/660e8400-e29b-41d4-a716-446655440001
```

**URL Parameters**:
- `:id` - Training ID (UUID)
- `:lessonId` - Module ID (UUID)

**Navigation Flow**:
```
Module 1 → Complete → Module 2 → Complete → ... → Last Module → Complete → Evaluation
```

**State Management**:
```typescript
// Zustand store tracks completed modules
const { completedModules, markModuleCompleted } = useTrainingStore();

// On complete
markModuleCompleted(lessonId);
```

---

### 5. Final Evaluation
**Path**: `/umkm/trainings/:id/evaluation`  
**Component**: `TrainingEvaluationPage`  
**Purpose**: Final quiz/evaluation before completion

**Features**:
- Multiple choice questions
- Timer (optional)
- Submit answers
- Score calculation
- Pass/fail threshold
- Retry option (if failed)

**API Calls**:
```typescript
const { id } = useParams();
const completeTraining = useCompleteTraining();

// On pass evaluation
const handlePassEvaluation = () => {
  completeTraining.mutate(
    { pendaftaran_pelatihan_id: enrollmentId },
    {
      onSuccess: () => {
        navigate(`/umkm/trainings/${id}/success`);
      }
    }
  );
};
```

**Backend Endpoint**: `PATCH /api/v1/enrollments/complete`

**Example URL**: 
```
http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/evaluation
```

**URL Parameters**:
- `:id` - Training ID (UUID)

**Navigation**:
- Pass → `/trainings/:id/success`
- Fail → Stay on page with retry option

---

### 6. Completion Success
**Path**: `/umkm/trainings/:id/success`  
**Component**: `TrainingSuccessPage`  
**Purpose**: Congratulations page after completing training

**Features**:
- Success message with animation
- Training completion summary
- Certificate generation trigger
- Share achievement (optional)
- Next steps recommendations

**API Calls**:
```typescript
const { id } = useParams();
const { data: enrollments } = useUserEnrollments(currentUser.umkm_id);

const enrollment = enrollments?.find(e => e.pelatihan_id === id);
// Check: enrollment.status_pendaftaran === 'selesai'
```

**Example URL**: 
```
http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/success
```

**URL Parameters**:
- `:id` - Training ID (UUID)

**Navigation**:
- "View Certificate" → `/umkm/trainings/:id/verification` or `/umkm/certificates/:certId`
- "Browse More Trainings" → `/umkm/trainings/list`
- "Back to Dashboard" → `/umkm/trainings`

---

### 7. Post-Completion Verification
**Path**: `/umkm/trainings/:id/verification`  
**Component**: `TrainingAfterSuccessPage`  
**Purpose**: Post-completion actions and certificate access

**Features**:
- Certificate preview/download
- Training feedback form
- Review and rating
- Social share buttons
- Related trainings recommendations

**API Calls**:
```typescript
const { id } = useParams();
// May call certificate service
const { data: certificate } = useCertificate(enrollmentId);
```

**Example URL**: 
```
http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/verification
```

**URL Parameters**:
- `:id` - Training ID (UUID)

---

## 🔄 Navigation Flow

### New User Flow
```
1. Dashboard (/trainings)
   → Empty state, "Browse Trainings" button
   
2. Training List (/trainings/list)
   → Click training card
   
3. Training Detail (/trainings/:id)
   → Click "Enroll Now"
   → Enrollment successful
   → Click "Start Learning"
   
4. First Lesson (/trainings/:id/lesson/:lessonId)
   → Complete module
   → Auto-navigate to next module
   
5. Last Module → Complete
   → Navigate to Evaluation
   
6. Evaluation (/trainings/:id/evaluation)
   → Pass quiz
   → Submit
   
7. Success Page (/trainings/:id/success)
   → Celebration!
   → Click "View Certificate"
   
8. Verification (/trainings/:id/verification)
   → Download certificate
   → Share achievement
```

### Returning User Flow
```
1. Dashboard (/trainings)
   → See enrolled trainings with progress
   → Click "Continue Learning" on in-progress training
   
2. Resume Lesson (/trainings/:id/lesson/:lessonId)
   → Continue from last accessed module
```

---

## 🎯 Route Guards & Access Control

### Authentication Required
All training routes require authentication:
```typescript
{
  path: "/umkm",
  element: <RequireAuth allowedRole="UMKM" />,
  children: [...trainingRoutes],
}
```

### Enrollment Check (Optional Enhancement)
Some routes may require active enrollment:
```typescript
// In component
const { id } = useParams();
const { data: enrollments } = useUserEnrollments(currentUser.umkm_id);

const isEnrolled = enrollments?.some(e => e.pelatihan_id === id);

if (!isEnrolled) {
  navigate(`/umkm/trainings/${id}`); // Redirect to detail/enroll
}
```

---

## 🔗 Route Helpers

### Navigation Examples

```typescript
import { useNavigate, useParams } from 'react-router-dom';

function NavigationExamples() {
  const navigate = useNavigate();
  const { id, lessonId } = useParams();

  // Go to training list
  const goToList = () => navigate('/umkm/trainings/list');

  // Go to training detail
  const goToDetail = (trainingId: string) => 
    navigate(`/umkm/trainings/${trainingId}`);

  // Start learning (first module)
  const startLearning = (trainingId: string, firstModuleId: string) =>
    navigate(`/umkm/trainings/${trainingId}/lesson/${firstModuleId}`);

  // Next module
  const goToNextModule = (nextModuleId: string) =>
    navigate(`/umkm/trainings/${id}/lesson/${nextModuleId}`);

  // Go to evaluation
  const goToEvaluation = () => navigate(`/umkm/trainings/${id}/evaluation`);

  // Back to dashboard
  const goToDashboard = () => navigate('/umkm/trainings');
}
```

### Link Components

```typescript
import { Link } from 'react-router-dom';

// Training card in list
<Link to={`/umkm/trainings/${training.pelatihan_id}`}>
  <TrainingCard training={training} />
</Link>

// Breadcrumbs
<nav>
  <Link to="/umkm/trainings">My Trainings</Link> /
  <Link to="/umkm/trainings/list">All Trainings</Link> /
  <span>{training.judul_pelatihan}</span>
</nav>

// Continue learning button
<Link to={`/umkm/trainings/${training.pelatihan_id}/lesson/${lastModule.modul_id}`}>
  <button>Continue Learning</button>
</Link>
```

---

## 📊 Route Parameters

### URL Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `:id` | UUID | Training Program ID | `550e8400-e29b-41d4-a716-446655440000` |
| `:lessonId` | UUID | Module/Lesson ID | `660e8400-e29b-41d4-a716-446655440001` |

### Query Parameters (Optional)
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search query | `?search=digital` |
| `category` | string | Filter by category | `?category=business` |
| `sort` | string | Sort order | `?sort=popular` |
| `status` | string | Filter by status | `?status=in_progress` |

---

## 🔍 SEO & Meta Tags (Optional Enhancement)

```typescript
import { Helmet } from 'react-helmet-async';

function TrainingDetailPage() {
  const { data: detail } = useTrainingDetail(id!);

  return (
    <>
      <Helmet>
        <title>{detail?.training.judul_pelatihan} | UMKM Tumbuh</title>
        <meta name="description" content={detail?.training.deskripsi_pelatihan || ''} />
      </Helmet>
      {/* Page content */}
    </>
  );
}
```

---

## 🧪 Testing Routes

### Manual Testing Checklist
```typescript
// Test all routes are accessible
const routes = [
  '/umkm/trainings',
  '/umkm/trainings/list',
  '/umkm/trainings/550e8400-e29b-41d4-a716-446655440000',
  '/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/lesson/660e8400-e29b-41d4-a716-446655440001',
  '/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/evaluation',
  '/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/success',
  '/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/verification',
];

routes.forEach(route => {
  console.log(`Testing route: ${route}`);
  // Navigate and verify page loads
});
```

---

## 📝 Summary

| Route | Component | API Endpoint | Hook |
|-------|-----------|--------------|------|
| `/trainings` | TrainingDashboardPage | `GET /enrollments/user/:id` | `useUserEnrollments()` |
| `/trainings/list` | TrainingListPage | `GET /trainings` | `useTrainings()` |
| `/trainings/:id` | TrainingDetailPage | `GET /trainings/:id/detail` | `useTrainingDetail()` |
| `/trainings/:id/lesson/:lessonId` | TrainingLessonPage | `PATCH /enrollments/progress` | `useUpdateProgress()` |
| `/trainings/:id/evaluation` | TrainingEvaluationPage | `PATCH /enrollments/complete` | `useCompleteTraining()` |
| `/trainings/:id/success` | TrainingSuccessPage | - | - |
| `/trainings/:id/verification` | TrainingAfterSuccessPage | - | - |

**Total Routes**: 7  
**Protected**: ✅ Yes (RequireAuth)  
**API Integrated**: ✅ Yes  
**Status**: ✅ Ready to use

---

**Last Updated**: June 10, 2026
