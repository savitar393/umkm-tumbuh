# 🧭 Training Navigation Quick Reference

## 🗺️ Route Map

```
/umkm/trainings/
│
├── /                                    → 📊 Dashboard (My Enrollments)
│
├── /list                                → 📚 Browse All Trainings
│
├── /:id                                 → 📖 Training Detail + Enroll
│   │
│   ├── /lesson/:lessonId                → 🎓 Learn Module
│   │
│   ├── /evaluation                      → ✅ Final Quiz
│   │
│   ├── /success                         → 🎉 Completion Page
│   │
│   └── /verification                    → 🏆 Certificate Access
```

---

## 🎯 Navigation Patterns

### Pattern 1: First Time User Journey
```
Start → Browse → Detail → Enroll → Learn → Complete
```

```typescript
// 1. Land on dashboard (empty state)
navigate('/umkm/trainings')

// 2. Click "Browse Trainings"
navigate('/umkm/trainings/list')

// 3. Click training card
navigate(`/umkm/trainings/${trainingId}`)

// 4. Click "Enroll" → Then "Start Learning"
navigate(`/umkm/trainings/${trainingId}/lesson/${firstModuleId}`)

// 5. Complete each module (auto-navigate)
navigate(`/umkm/trainings/${trainingId}/lesson/${nextModuleId}`)

// 6. After last module → Evaluation
navigate(`/umkm/trainings/${trainingId}/evaluation`)

// 7. Pass evaluation → Success
navigate(`/umkm/trainings/${trainingId}/success`)

// 8. View certificate
navigate(`/umkm/trainings/${trainingId}/verification`)
```

### Pattern 2: Returning User Journey
```
Dashboard → Continue Learning → Resume Module
```

```typescript
// 1. Dashboard shows enrolled trainings
navigate('/umkm/trainings')

// 2. Click "Continue Learning" on in-progress training
const lastAccessedModule = enrollment.last_module_id;
navigate(`/umkm/trainings/${trainingId}/lesson/${lastAccessedModule}`)
```

### Pattern 3: Completed Training Access
```
Dashboard → View Certificate
```

```typescript
// 1. Dashboard shows completed trainings
navigate('/umkm/trainings')

// 2. Click "View Certificate"
navigate(`/umkm/trainings/${trainingId}/verification`)
```

---

## 💻 Code Examples

### Basic Navigation Hook
```typescript
import { useNavigate, useParams } from 'react-router-dom';

function useTrainingNavigation() {
  const navigate = useNavigate();
  const { id, lessonId } = useParams();

  return {
    // Navigate to pages
    goToDashboard: () => navigate('/umkm/trainings'),
    goToList: () => navigate('/umkm/trainings/list'),
    goToDetail: (trainingId: string) => navigate(`/umkm/trainings/${trainingId}`),
    goToLesson: (trainingId: string, moduleId: string) => 
      navigate(`/umkm/trainings/${trainingId}/lesson/${moduleId}`),
    goToEvaluation: (trainingId: string) => 
      navigate(`/umkm/trainings/${trainingId}/evaluation`),
    goToSuccess: (trainingId: string) => 
      navigate(`/umkm/trainings/${trainingId}/success`),
    goToVerification: (trainingId: string) => 
      navigate(`/umkm/trainings/${trainingId}/verification`),
    
    // Current route info
    currentTrainingId: id,
    currentLessonId: lessonId,
  };
}
```

### Usage in Components

#### Dashboard Component
```typescript
function TrainingDashboardPage() {
  const navigate = useNavigate();
  const { data: enrollments } = useUserEnrollments(user.umkm_id);

  return (
    <div>
      <h1>My Trainings</h1>
      
      {/* Empty state */}
      {enrollments?.length === 0 && (
        <button onClick={() => navigate('/umkm/trainings/list')}>
          Browse Trainings
        </button>
      )}

      {/* Enrolled trainings */}
      {enrollments?.map(enrollment => (
        <TrainingCard 
          key={enrollment.pendaftaran_pelatihan_id}
          enrollment={enrollment}
          onContinue={(trainingId, moduleId) => 
            navigate(`/umkm/trainings/${trainingId}/lesson/${moduleId}`)
          }
        />
      ))}
    </div>
  );
}
```

#### Training List Component
```typescript
function TrainingListPage() {
  const navigate = useNavigate();
  const { data: trainings } = useTrainings();

  return (
    <div>
      <h1>Browse Trainings</h1>
      
      <div className="training-grid">
        {trainings?.map(training => (
          <div 
            key={training.pelatihan_id}
            onClick={() => navigate(`/umkm/trainings/${training.pelatihan_id}`)}
          >
            <h3>{training.judul_pelatihan}</h3>
            <p>{training.durasi_jam} jam</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Training Detail Component
```typescript
function TrainingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: detail } = useTrainingDetail(id!);
  const { data: enrollments } = useUserEnrollments(user.umkm_id);
  const enrollMutation = useEnrollTraining();

  const enrollment = enrollments?.find(e => e.pelatihan_id === id);
  const isEnrolled = !!enrollment;

  const handleEnroll = () => {
    enrollMutation.mutate({
      umkm_id: user.umkm_id,
      pelatihan_id: id!,
    }, {
      onSuccess: () => {
        // After enroll, start learning
        const firstModule = detail?.modules[0];
        navigate(`/umkm/trainings/${id}/lesson/${firstModule.modul_id}`);
      }
    });
  };

  const handleStartLearning = () => {
    const firstIncompleteModule = detail?.modules.find(
      m => !enrollment?.completed_modules.includes(m.modul_id)
    ) || detail?.modules[0];
    
    navigate(`/umkm/trainings/${id}/lesson/${firstIncompleteModule.modul_id}`);
  };

  return (
    <div>
      <h1>{detail?.training.judul_pelatihan}</h1>
      
      {!isEnrolled ? (
        <button onClick={handleEnroll}>
          Enroll Now
        </button>
      ) : (
        <button onClick={handleStartLearning}>
          {enrollment.progress_persen === 0 ? 'Start Learning' : 'Continue Learning'}
        </button>
      )}

      <ModuleList modules={detail?.modules} />
    </div>
  );
}
```

#### Lesson Component
```typescript
function TrainingLessonPage() {
  const { id, lessonId } = useParams();
  const navigate = useNavigate();
  const { data: detail } = useTrainingDetail(id!);
  const updateProgress = useUpdateProgress();

  const currentModule = detail?.modules.find(m => m.modul_id === lessonId);
  const currentIndex = detail?.modules.findIndex(m => m.modul_id === lessonId) ?? 0;
  const nextModule = detail?.modules[currentIndex + 1];
  const isLastModule = currentIndex === (detail?.modules.length ?? 0) - 1;

  const handleCompleteModule = () => {
    updateProgress.mutate({
      pendaftaran_pelatihan_id: enrollmentId,
      modul_selesai: currentModule!.urutan_modul,
      total_modul: detail!.modules.length,
    }, {
      onSuccess: () => {
        if (isLastModule) {
          // Last module → Go to evaluation
          navigate(`/umkm/trainings/${id}/evaluation`);
        } else {
          // Go to next module
          navigate(`/umkm/trainings/${id}/lesson/${nextModule.modul_id}`);
        }
      }
    });
  };

  return (
    <div>
      <h2>{currentModule?.judul_modul}</h2>
      <VideoPlayer url={currentModule?.materi_url} />
      
      <button onClick={handleCompleteModule}>
        {isLastModule ? 'Complete & Go to Evaluation' : 'Complete & Next'}
      </button>
    </div>
  );
}
```

#### Evaluation Component
```typescript
function TrainingEvaluationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const completeTraining = useCompleteTraining();
  const [score, setScore] = useState(0);

  const handleSubmit = () => {
    if (score >= 70) { // Pass threshold
      completeTraining.mutate(
        { pendaftaran_pelatihan_id: enrollmentId },
        {
          onSuccess: () => {
            navigate(`/umkm/trainings/${id}/success`);
          }
        }
      );
    } else {
      alert('You need 70% to pass. Please retry.');
    }
  };

  return (
    <div>
      <h1>Final Evaluation</h1>
      <Quiz onScoreChange={setScore} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

#### Success Page Component
```typescript
function TrainingSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <h1>🎉 Congratulations!</h1>
      <p>You have successfully completed the training!</p>
      
      <button onClick={() => navigate(`/umkm/trainings/${id}/verification`)}>
        View Certificate
      </button>
      
      <button onClick={() => navigate('/umkm/trainings/list')}>
        Browse More Trainings
      </button>
    </div>
  );
}
```

---

## 🔗 Link Components

### Navigation Links
```typescript
import { Link } from 'react-router-dom';

// Back to dashboard
<Link to="/umkm/trainings">← Back to My Trainings</Link>

// Browse all
<Link to="/umkm/trainings/list">Browse All Trainings</Link>

// Training detail
<Link to={`/umkm/trainings/${training.pelatihan_id}`}>
  View Details
</Link>

// Continue learning
<Link to={`/umkm/trainings/${enrollment.pelatihan_id}/lesson/${lastModuleId}`}>
  Continue Learning
</Link>

// View certificate
<Link to={`/umkm/trainings/${training.pelatihan_id}/verification`}>
  View Certificate
</Link>
```

### Breadcrumbs
```typescript
function Breadcrumbs() {
  const { id, lessonId } = useParams();
  const { data: detail } = useTrainingDetail(id!);
  const currentModule = detail?.modules.find(m => m.modul_id === lessonId);

  return (
    <nav className="breadcrumbs">
      <Link to="/umkm/trainings">My Trainings</Link>
      <span>/</span>
      <Link to="/umkm/trainings/list">All Trainings</Link>
      <span>/</span>
      <Link to={`/umkm/trainings/${id}`}>
        {detail?.training.judul_pelatihan}
      </Link>
      {lessonId && (
        <>
          <span>/</span>
          <span>{currentModule?.judul_modul}</span>
        </>
      )}
    </nav>
  );
}
```

---

## 🎨 Navigation UI Components

### Sidebar Menu
```typescript
function TrainingSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/umkm/trainings', label: 'My Trainings', icon: '📊' },
    { path: '/umkm/trainings/list', label: 'Browse', icon: '📚' },
  ];

  return (
    <nav>
      {menuItems.map(item => (
        <Link 
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

### Training Progress Tracker
```typescript
function ProgressTracker({ trainingId, modules, currentModuleId }) {
  const navigate = useNavigate();

  return (
    <div className="progress-tracker">
      {modules.map((module, index) => (
        <div 
          key={module.modul_id}
          className={`module-step ${module.modul_id === currentModuleId ? 'active' : ''}`}
          onClick={() => navigate(`/umkm/trainings/${trainingId}/lesson/${module.modul_id}`)}
        >
          <span>{index + 1}</span>
          <p>{module.judul_modul}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔍 Route State Management

### Passing State via Navigate
```typescript
// From list to detail with state
navigate(`/umkm/trainings/${trainingId}`, {
  state: { fromList: true }
});

// In detail page
const location = useLocation();
const fromList = location.state?.fromList;

if (fromList) {
  // Show back button to list
}
```

### URL Query Parameters
```typescript
// Navigate with search params
navigate('/umkm/trainings/list?search=digital&category=business');

// Read search params
const [searchParams] = useSearchParams();
const search = searchParams.get('search');
const category = searchParams.get('category');
```

---

## 🛡️ Protected Navigation

### Enrollment Guard
```typescript
function RequireEnrollment({ children, trainingId }) {
  const { data: enrollments } = useUserEnrollments(user.umkm_id);
  const navigate = useNavigate();

  const isEnrolled = enrollments?.some(e => e.pelatihan_id === trainingId);

  useEffect(() => {
    if (!isEnrolled) {
      navigate(`/umkm/trainings/${trainingId}`);
    }
  }, [isEnrolled]);

  return isEnrolled ? children : null;
}

// Usage
<Route 
  path="trainings/:id/lesson/:lessonId" 
  element={
    <RequireEnrollment trainingId={id}>
      <TrainingLessonPage />
    </RequireEnrollment>
  } 
/>
```

---

## 📍 Deep Linking

### Share Training Link
```typescript
// Copy training URL
const shareUrl = `${window.location.origin}/umkm/trainings/${trainingId}`;
navigator.clipboard.writeText(shareUrl);

// Open in new tab
window.open(`/umkm/trainings/${trainingId}`, '_blank');
```

### Email Links
```html
<!-- Email template -->
<a href="https://umkm-tumbuh.com/umkm/trainings/550e8400-e29b-41d4-a716-446655440000">
  Continue your Digital Marketing training
</a>
```

---

## ✅ Navigation Checklist

### Development
- [ ] All routes accessible
- [ ] No broken links
- [ ] Back button works correctly
- [ ] Breadcrumbs update properly
- [ ] Active states work

### User Experience
- [ ] Intuitive flow
- [ ] Clear call-to-actions
- [ ] Progress visible
- [ ] Easy to go back
- [ ] No dead ends

### Performance
- [ ] Fast navigation (< 300ms)
- [ ] Smooth transitions
- [ ] No unnecessary re-renders
- [ ] Cached data used

---

## 🎯 Quick Reference Table

| Action | From | To | Code |
|--------|------|----|----- |
| Browse trainings | Dashboard | List | `navigate('/umkm/trainings/list')` |
| View detail | List | Detail | `navigate(\`/umkm/trainings/\${id}\`)` |
| Enroll | Detail | Detail | `enrollMutation.mutate()` (stays on page) |
| Start learning | Detail | Lesson | `navigate(\`/umkm/trainings/\${id}/lesson/\${moduleId}\`)` |
| Next module | Lesson | Lesson | `navigate(\`/umkm/trainings/\${id}/lesson/\${nextId}\`)` |
| To evaluation | Last Lesson | Evaluation | `navigate(\`/umkm/trainings/\${id}/evaluation\`)` |
| Complete | Evaluation | Success | `navigate(\`/umkm/trainings/\${id}/success\`)` |
| View certificate | Success | Verification | `navigate(\`/umkm/trainings/\${id}/verification\`)` |
| Back to dashboard | Any | Dashboard | `navigate('/umkm/trainings')` |

---

**Pro Tip**: Create a custom hook `useTrainingNavigation()` yang combine semua navigation helpers untuk reusability! 🚀

---

**Last Updated**: June 10, 2026
