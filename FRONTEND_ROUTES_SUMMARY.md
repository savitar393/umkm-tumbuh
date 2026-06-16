# 🗺️ Frontend Routes Summary - Training Service

## 📋 Quick Overview

**Base URL**: `http://localhost:5173`  
**Protected Routes**: `/umkm/*` (Requires UMKM role authentication)  
**Training Base**: `/umkm/trainings/*`

---

## 🎯 Training Routes Configuration

### Route Structure (Nested)

```typescript
// frontend/src/features/trainings/routes.tsx

export const trainingRoutes: RouteObject[] = [
  {
    path: "trainings",
    children: [
      {
        index: true,                          // /umkm/trainings
        element: <TrainingDashboardPage />,
      },
      {
        path: "list",                         // /umkm/trainings/list
        element: <TrainingListPage />,
      },
      {
        path: ":id",                          // /umkm/trainings/:id
        element: <TrainingDetailPage />,
      },
      {
        path: ":id/lesson/:lessonId",         // /umkm/trainings/:id/lesson/:lessonId
        element: <TrainingLessonPage />,
      },
      {
        path: ":id/evaluation",               // /umkm/trainings/:id/evaluation
        element: <TrainingEvaluationPage />,
      },
      {
        path: ":id/success",                  // /umkm/trainings/:id/success
        element: <TrainingSuccessPage />,
      },
      {
        path: ":id/verification",             // /umkm/trainings/:id/verification
        element: <TrainingAfterSuccessPage />,
      },
    ],
  },
];
```

---

## 📍 Complete Route List

| # | Path | Component | Description | Access |
|---|------|-----------|-------------|--------|
| 1 | `/umkm/trainings` | TrainingDashboardPage | My enrolled trainings | 🔒 Auth |
| 2 | `/umkm/trainings/list` | TrainingListPage | Browse all trainings | 🔒 Auth |
| 3 | `/umkm/trainings/:id` | TrainingDetailPage | Training detail + enroll | 🔒 Auth |
| 4 | `/umkm/trainings/:id/lesson/:lessonId` | TrainingLessonPage | Learn module | 🔒 Auth + Enrolled |
| 5 | `/umkm/trainings/:id/evaluation` | TrainingEvaluationPage | Final quiz | 🔒 Auth + Enrolled |
| 6 | `/umkm/trainings/:id/success` | TrainingSuccessPage | Completion page | 🔒 Auth + Completed |
| 7 | `/umkm/trainings/:id/verification` | TrainingAfterSuccessPage | Certificate access | 🔒 Auth + Completed |

---

## 🔗 Route Integration with Backend

### API Endpoint Mapping

| Frontend Route | Backend Endpoint | HTTP | Hook |
|----------------|------------------|------|------|
| `/trainings` | `/api/v1/enrollments/user/:umkmID` | GET | `useUserEnrollments()` |
| `/trainings/list` | `/api/v1/trainings` | GET | `useTrainings()` |
| `/trainings/:id` | `/api/v1/trainings/:id/detail` | GET | `useTrainingDetail()` |
| `/trainings/:id` | `/api/v1/trainings/enroll` | POST | `useEnrollTraining()` |
| `/trainings/:id/lesson/:lessonId` | `/api/v1/enrollments/progress` | PATCH | `useUpdateProgress()` |
| `/trainings/:id/evaluation` | `/api/v1/enrollments/complete` | PATCH | `useCompleteTraining()` |

---

## 🚦 Route Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Journey Flow                         │
└─────────────────────────────────────────────────────────────┘

    NEW USER                         RETURNING USER
       │                                    │
       v                                    v
  ┌─────────┐                         ┌─────────┐
  │Dashboard│                         │Dashboard│
  │ (empty) │                         │(w/data) │
  └────┬────┘                         └────┬────┘
       │                                    │
       │ "Browse"                           │ "Continue"
       v                                    │
  ┌─────────┐                              │
  │  List   │                              │
  │Trainings│                              │
  └────┬────┘                              │
       │                                    │
       │ Click card                         │
       v                                    v
  ┌─────────┐                         ┌─────────┐
  │ Detail  │                         │ Lesson  │
  │+ Enroll │                         │ (resume)│
  └────┬────┘                         └────┬────┘
       │                                    │
       │ "Enroll" → "Start"                 │
       v                                    │
  ┌─────────┐                              │
  │ Lesson  │◄─────────────────────────────┘
  │ Module  │
  └────┬────┘
       │
       │ Complete modules (loop)
       v
  ┌─────────┐
  │ Lesson  │
  │  Next   │
  └────┬────┘
       │
       │ Last module complete
       v
  ┌──────────┐
  │Evaluation│
  │  (Quiz)  │
  └────┬─────┘
       │
       │ Pass
       v
  ┌─────────┐
  │ Success │
  │   🎉    │
  └────┬────┘
       │
       │ "View Certificate"
       v
  ┌────────────┐
  │Verification│
  │Certificate │
  └────────────┘
```

---

## 📱 Example URLs

### Development URLs
```
Dashboard:      http://localhost:5173/umkm/trainings
List:           http://localhost:5173/umkm/trainings/list
Detail:         http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000
Lesson:         http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/lesson/660e8400-e29b-41d4-a716-446655440001
Evaluation:     http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/evaluation
Success:        http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/success
Verification:   http://localhost:5173/umkm/trainings/550e8400-e29b-41d4-a716-446655440000/verification
```

### Production URLs (Example)
```
Dashboard:      https://umkm-tumbuh.com/umkm/trainings
List:           https://umkm-tumbuh.com/umkm/trainings/list
Detail:         https://umkm-tumbuh.com/umkm/trainings/550e8400-e29b-41d4-a716-446655440000
...
```

---

## 🔒 Route Protection

### Authentication Guard
```typescript
// frontend/src/app/router.tsx

{
  path: "/umkm",
  element: <RequireAuth allowedRole="UMKM" />,  // ✅ Authentication required
  children: [
    ...trainingRoutes,  // All training routes protected
  ],
}
```

### Role-Based Access
- **UMKM Users**: ✅ Full access to `/umkm/trainings/*`
- **MITRA Users**: ⚠️ No access to trainings (not in mitra children)
- **ADMIN Users**: ⚠️ No access to trainings (admin has separate routes)
- **Public**: ❌ Redirected to login

---

## 🧪 Testing Routes

### Manual Test Commands

**1. Open in Browser**
```bash
# Start frontend
cd e:\umkm-tumbuh\frontend
npm run dev

# Open routes
start http://localhost:5173/umkm/trainings
start http://localhost:5173/umkm/trainings/list
```

**2. Check Route Registration**
```javascript
// In browser console
console.log('Current route:', window.location.pathname);

// Test navigation
window.history.pushState({}, '', '/umkm/trainings/list');
```

**3. Verify Protected Routes**
```javascript
// Without auth token (should redirect to login)
localStorage.removeItem('access_token');
window.location.href = '/umkm/trainings';
```

---

## 📊 Route Performance

### Expected Load Times
| Route | Target | Notes |
|-------|--------|-------|
| Dashboard | < 1s | Fetches user enrollments |
| List | < 2s | Fetches all trainings |
| Detail | < 1s | Fetches training + modules |
| Lesson | < 500ms | Cached training data |
| Others | < 500ms | Minimal API calls |

### Optimization Tips
```typescript
// Prefetch training detail when hovering list item
const queryClient = useQueryClient();

const handleMouseEnter = (trainingId: string) => {
  queryClient.prefetchQuery({
    queryKey: trainingKeys.detail(trainingId),
    queryFn: () => getTrainingDetail(trainingId),
  });
};
```

---

## 🎨 Route Components Status

| Component | File Location | API Integration | Status |
|-----------|---------------|-----------------|--------|
| TrainingDashboardPage | `pages/TrainingDashboardPage.tsx` | ✅ useUserEnrollments | ⚠️ Needs hooks integration |
| TrainingListPage | `pages/TrainingListPage.tsx` | ✅ useTrainings | ⚠️ Needs hooks integration |
| TrainingDetailPage | `pages/TrainingDetailPage.tsx` | ✅ useTrainingDetail | ⚠️ Needs hooks integration |
| TrainingLessonPage | `pages/TrainingLessonPage.tsx` | ✅ useUpdateProgress | ⚠️ Needs hooks integration |
| TrainingEvaluationPage | `pages/TrainingEvaluationPage.tsx` | ✅ useCompleteTraining | ⚠️ Needs hooks integration |
| TrainingSuccessPage | `pages/TrainingSuccessPage.tsx` | ❌ No API needed | ✅ Ready |
| TrainingAfterSuccessPage | `pages/TrainingAfterSuccessPage.tsx` | ❌ No API needed | ✅ Ready |

**Note**: Components exist but need to integrate the hooks we created!

---

## 🔄 Migration from Old Routes

### Old Route Structure (Flat)
```typescript
// ❌ Old way - Flat routes
{
  path: "trainings",
  element: <TrainingDashboardPage />,
},
{
  path: "trainings/list",
  element: <TrainingListPage />,
},
// ... more routes
```

### New Route Structure (Nested) ✅
```typescript
// ✅ New way - Nested routes
{
  path: "trainings",
  children: [
    { index: true, element: <TrainingDashboardPage /> },
    { path: "list", element: <TrainingListPage /> },
    // ... more routes
  ],
}
```

**Benefits**:
- Cleaner structure
- Better organization
- Easier to add shared layouts
- More React Router v6 idiomatic

---

## 📝 Next Steps

### Immediate (Now)
1. ✅ Routes configured
2. ✅ API hooks created
3. ⬜ **Update components to use hooks**
4. ⬜ **Add navigation between pages**

### Components to Update
```typescript
// Example: Update TrainingListPage.tsx

// ❌ Before (dummy data)
const trainings = [
  { id: 1, title: "Training 1" },
  { id: 2, title: "Training 2" },
];

// ✅ After (real API data)
import { useTrainings } from '../hooks';

function TrainingListPage() {
  const { data: trainings, isLoading } = useTrainings();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {trainings?.map(training => (
        <TrainingCard key={training.pelatihan_id} training={training} />
      ))}
    </div>
  );
}
```

### Short Term (This Week)
1. Test all routes manually
2. Add error boundaries
3. Add loading states
4. Implement breadcrumbs
5. Add route transitions

### Long Term (Next Sprint)
1. Add route analytics
2. Implement route preloading
3. Add SEO meta tags
4. Optimize bundle splitting

---

## 📚 Documentation Links

1. **Route Configuration**: `frontend/src/features/trainings/routes.tsx`
2. **Route Details**: `frontend/src/features/trainings/ROUTES.md`
3. **Navigation Guide**: `frontend/src/features/trainings/NAVIGATION_GUIDE.md`
4. **API Hooks**: `frontend/src/features/trainings/hooks.ts`
5. **Setup Guide**: `TRAINING_SETUP_GUIDE.md`

---

## ✅ Verification Checklist

### Route Configuration
- [x] Routes defined in routes.tsx
- [x] Nested structure implemented
- [x] All page components imported
- [x] Routes registered in app router

### API Integration
- [x] HTTP client configured
- [x] API functions created
- [x] React Query hooks ready
- [x] Types and schemas defined

### Components
- [ ] Dashboard uses useUserEnrollments
- [ ] List uses useTrainings
- [ ] Detail uses useTrainingDetail
- [ ] Lesson uses useUpdateProgress
- [ ] Evaluation uses useCompleteTraining

### Navigation
- [ ] Links between pages work
- [ ] Back button works
- [ ] Breadcrumbs implemented
- [ ] Active states work

### Testing
- [ ] All routes accessible
- [ ] Authentication works
- [ ] Data fetching works
- [ ] Navigation flow smooth

---

## 🎯 Summary

**Status**: ✅ **ROUTES CONFIGURED & READY**

- **Total Routes**: 7
- **Route Type**: Nested (React Router v6)
- **Protection**: Auth required (RequireAuth)
- **API Integration**: Ready
- **Components**: Exist, need hook integration

**Next Action**: Update page components to use the API hooks!

---

**Last Updated**: June 10, 2026  
**Author**: AI Assistant  
**Project**: UMKM TUMBUH - Training Service Integration
