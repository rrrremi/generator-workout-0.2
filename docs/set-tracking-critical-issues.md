# Per-Set Workout Tracking - Critical Issues Log

**Feature:** Dynamic per-set workout tracking with modal editor
**Date:** 2025-10-12
**Status:** ✅ Critical issues resolved - Ready for testing
**Last Updated:** 2025-10-12 (Critical fixes completed)

---

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### 1. **Data Integrity - No Transaction Wrapping**
**Severity:** CRITICAL  
**Impact:** Data corruption, inconsistent state

**Problem:**
The PUT endpoint performs multiple database operations without transaction wrapping:
1. Deletes from `workout_set_entries`
2. Inserts new entries
3. Updates `workout_exercises`
4. Updates `workouts.workout_data`
5. Calls `calculateWorkoutSummary()`

If any step fails mid-way, database is left in inconsistent state.

**Location:** `app/api/workouts/exercises/[workoutExerciseId]/sets/route.ts` lines 193-269

**Fix Required:**
```typescript
// Wrap all operations in a transaction
const { data, error } = await supabase.rpc('update_workout_sets_transaction', {
  workout_exercise_id: workoutExerciseId,
  set_details: sanitizedDetails,
  workout_id: workoutId
})
```

**Priority:** P0 - Block production deployment

---

### 2. **Race Condition on Rapid Saves**
**Severity:** CRITICAL  
**Impact:** Duplicate entries, data loss

**Problem:**
No debouncing or request cancellation. If user clicks save multiple times rapidly:
- Multiple DELETE operations execute
- Multiple INSERT operations execute
- Last request wins, but intermediate states are lost

**Location:** `app/protected/workouts/[id]/page.tsx` line 442 (`persistSetDetails`)

**Fix Required:**
```typescript
// Add request cancellation
const abortControllerRef = useRef<AbortController | null>(null)

const persistSetDetails = useCallback(async () => {
  // Cancel previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }
  
  abortControllerRef.current = new AbortController()
  
  // Disable save button immediately
  setIsSavingSetDetails(true)
  
  // ... rest of save logic with signal: abortControllerRef.current.signal
}, [])
```

**Priority:** P0 - Block production deployment

---

### 3. **No Validation on Save - Empty Sets Allowed**
**Severity:** CRITICAL  
**Impact:** Meaningless data, database bloat

**Problem:**
User can save sets with all fields empty (no reps, no weight, no rest, no notes). This creates database rows with no useful information.

**Location:** 
- Client: `app/protected/workouts/[id]/page.tsx` line 432
- API: `app/api/workouts/exercises/[workoutExerciseId]/sets/route.ts` line 139

**Current Check:**
```typescript
if (editingSetDetails.length === 0) {
  setSetDetailsError('Add at least one set.')
  return
}
```

**Fix Required:**
```typescript
// Validate at least one field is filled per set
const hasValidData = editingSetDetails.some(set => 
  set.reps !== null || 
  set.weight_kg !== null || 
  set.rest_seconds !== null || 
  (set.notes && set.notes.trim().length > 0)
)

if (!hasValidData) {
  setSetDetailsError('Please fill in at least one field (reps, weight, or rest time)')
  setTimeout(() => setSetDetailsError(null), 3000)
  return
}
```

**Priority:** P0 - Block production deployment

---

### 4. **Stale Data After Exercise Reorder**
**Severity:** CRITICAL  
**Impact:** Saves to wrong exercise, data corruption

**Problem:**
If user:
1. Opens set editor for Exercise A (index 2)
2. Reorders exercises (Exercise A moves to index 4)
3. Saves set editor

The save uses the old `editingSetIndex` (2) and updates the wrong exercise.

**Location:** `app/protected/workouts/[id]/page.tsx` lines 315-373

**Fix Required:**
```typescript
// Close set editor when exercises are reordered
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  // ... existing reorder logic
  
  // Close set editor if open
  if (editingSetIndex !== null) {
    closeSetEditor()
    // Show warning
    setError('Set editor closed due to exercise reorder')
    setTimeout(() => setError(null), 3000)
  }
  
  // ... rest of logic
}, [editingSetIndex, closeSetEditor])
```

**Priority:** P0 - Block production deployment

---

### 5. **Order Index Logic is Fragile**
**Severity:** CRITICAL  
**Impact:** Wrong exercise selected, data corruption

**Problem:**
The order_index detection logic assumes either all exercises are 0-based or all are 1-based:

```typescript
const exerciseIndex = typeof workoutExercise.order_index === 'number' 
  ? (workoutExercise.order_index === 0 || existingExercises.length === 0 
      ? workoutExercise.order_index 
      : workoutExercise.order_index - 1)
  : existingExercises.findIndex((ex: any) => ex?.id === workoutExercise.exercise_id)
```

This breaks if:
- Data is inconsistent (mixed 0-based and 1-based)
- `existingExercises.length === 0` but order_index > 0
- Fallback to `findIndex` fails silently

**Location:** `app/api/workouts/exercises/[workoutExerciseId]/sets/route.ts` lines 185-187

**Fix Required:**
```typescript
// Fetch all workout_exercises to determine indexing scheme
const { data: allExercises } = await supabase
  .from('workout_exercises')
  .select('order_index')
  .eq('workout_id', workoutId)
  .order('order_index')

const hasZeroIndex = allExercises?.some(ex => ex.order_index === 0)
const exerciseIndex = hasZeroIndex 
  ? workoutExercise.order_index 
  : workoutExercise.order_index - 1

// Validate bounds
if (exerciseIndex < 0 || exerciseIndex >= existingExercises.length) {
  console.error('Order index mismatch:', {
    order_index: workoutExercise.order_index,
    calculated_index: exerciseIndex,
    exercises_count: existingExercises.length
  })
  return NextResponse.json({ 
    error: 'Exercise index out of bounds. Please refresh and try again.' 
  }, { status: 500 })
}
```

**Priority:** P0 - Block production deployment

---

### 6. **No Focus Trap in Modal**
**Severity:** CRITICAL (Accessibility)  
**Impact:** Keyboard users can't navigate, WCAG violation

**Problem:**
Modal has no focus trap. When user tabs through inputs:
- Focus escapes to background page
- Can interact with hidden elements
- Can't return to modal without mouse
- Violates WCAG 2.1 Level A (2.1.2 No Keyboard Trap)

**Location:** `app/protected/workouts/[id]/page.tsx` lines 1503-1645

**Fix Required:**
```bash
npm install focus-trap-react
```

```typescript
import FocusTrap from 'focus-trap-react'

// Wrap modal content
<FocusTrap>
  <motion.div
    // ... existing modal props
  >
    {/* modal content */}
  </motion.div>
</FocusTrap>
```

**Priority:** P0 - Legal/compliance requirement

---

### 7. **No ARIA Labels or Roles**
**Severity:** CRITICAL (Accessibility)  
**Impact:** Screen readers can't use feature, WCAG violation

**Problem:**
- Modal has no `role="dialog"` or `aria-labelledby`
- Inputs have no `aria-label` or associated `<label>` with `htmlFor`
- Error messages not announced with `aria-live`
- Save/Cancel buttons not clearly labeled for screen readers

**Location:** `app/protected/workouts/[id]/page.tsx` lines 1503-1645

**Fix Required:**
```typescript
<motion.div
  role="dialog"
  aria-labelledby="set-editor-title"
  aria-describedby="set-editor-description"
  aria-modal="true"
  // ... existing props
>
  <h3 id="set-editor-title" className="...">Edit Sets</h3>
  <p id="set-editor-description" className="...">
    {workout.workout_data.exercises[editingSetIndex]?.name}
  </p>
  
  {/* Inputs with proper labels */}
  <label htmlFor={`set-${idx}-reps`} className="...">Reps</label>
  <input
    id={`set-${idx}-reps`}
    aria-label={`Reps for set ${detail.set_number}`}
    // ... existing props
  />
  
  {/* Error with live region */}
  {setDetailsError && (
    <div role="alert" aria-live="assertive" className="...">
      {setDetailsError}
    </div>
  )}
</motion.div>
```

**Priority:** P0 - Legal/compliance requirement

---

### 8. **No Rate Limiting**
**Severity:** CRITICAL (Security)  
**Impact:** API abuse, database overload, DoS

**Problem:**
No rate limiting on PUT endpoint. Malicious user or buggy client can:
- Spam save button 1000x/second
- Overwhelm database with DELETE/INSERT operations
- Cause service degradation for all users

**Location:** `app/api/workouts/exercises/[workoutExerciseId]/sets/route.ts`

**Fix Required:**
```typescript
// Add rate limiting middleware
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function PUT(request: NextRequest, { params }) {
  const ip = request.ip ?? 'anonymous'
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }
  
  // ... rest of PUT logic
}
```

**Alternative (simpler):**
```typescript
// In-memory rate limiting (resets on server restart)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = requestCounts.get(userId)
  
  if (!userLimit || now > userLimit.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60000 }) // 1 minute
    return true
  }
  
  if (userLimit.count >= 10) {
    return false
  }
  
  userLimit.count++
  return true
}
```

**Priority:** P0 - Security vulnerability

---

### 9. **No Input Sanitization on Notes**
**Severity:** CRITICAL (Security)  
**Impact:** XSS vulnerability, data injection

**Problem:**
Notes field accepts any string without sanitization. If notes are ever rendered as HTML elsewhere in the app (e.g., in reports, exports, admin panel), this creates XSS vulnerability.

**Location:** 
- Client: `app/protected/workouts/[id]/page.tsx` line 424
- API: `app/api/workouts/exercises/[workoutExerciseId]/sets/route.ts` line 42

**Current Code:**
```typescript
const sanitizedNotes = typeof notes === 'string' && notes.trim().length > 0 
  ? notes.trim() 
  : null
```

**Fix Required:**
```typescript
// Install sanitization library
npm install dompurify
npm install @types/dompurify --save-dev

// In API route
import DOMPurify from 'isomorphic-dompurify'

const sanitizedNotes = typeof notes === 'string' && notes.trim().length > 0
  ? DOMPurify.sanitize(notes.trim(), { 
      ALLOWED_TAGS: [], // Strip all HTML
      ALLOWED_ATTR: []
    }).substring(0, 500) // Enforce max length
  : null
```

**Priority:** P0 - Security vulnerability

---

### 10. **Denormalized Data Without Sync Strategy**
**Severity:** CRITICAL (Architecture)  
**Impact:** Data inconsistency, stale data bugs

**Problem:**
Set details are stored in TWO places:
1. `workout_set_entries` table (source of truth)
2. `workout_data.exercises.set_details` JSONB (denormalized copy)

If these get out of sync (e.g., direct database edit, failed update, race condition):
- UI shows wrong data
- Reports use wrong data
- No way to detect/fix inconsistency

**Location:** `app/api/workouts/exercises/[workoutExerciseId]/sets/route.ts` lines 244-262

**Fix Required:**

**Option A: Remove denormalization (recommended)**
```typescript
// Don't store set_details in workout_data at all
// Always fetch from workout_set_entries when needed
// Simpler, single source of truth
```

**Option B: Add sync validation**
```typescript
// Add database trigger to keep in sync
CREATE OR REPLACE FUNCTION sync_workout_data_set_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workout_data.exercises.set_details when workout_set_entries changes
  -- Complex logic, prone to bugs
END;
$$ LANGUAGE plpgsql;
```

**Option C: Make workout_data read-only**
```typescript
// Generate workout_data.exercises.set_details on-the-fly from workout_set_entries
// Add computed column or view
```

**Priority:** P0 - Architectural flaw

---

## 📋 Critical Issues Summary

| # | Issue | Severity | Impact | Est. Fix Time |
|---|-------|----------|--------|---------------|
| 1 | No transaction wrapping | CRITICAL | Data corruption | 4 hours |
| 2 | Race condition on saves | CRITICAL | Data loss | 2 hours |
| 3 | No validation on empty sets | CRITICAL | Bad data | 1 hour |
| 4 | Stale data after reorder | CRITICAL | Wrong exercise | 1 hour |
| 5 | Fragile order_index logic | CRITICAL | Wrong exercise | 3 hours |
| 6 | No focus trap | CRITICAL | A11y violation | 1 hour |
| 7 | No ARIA labels | CRITICAL | A11y violation | 2 hours |
| 8 | No rate limiting | CRITICAL | Security | 3 hours |
| 9 | No input sanitization | CRITICAL | XSS risk | 1 hour |
| 10 | Denormalized data | CRITICAL | Inconsistency | 8 hours |

**Total Estimated Fix Time:** 26 hours (3-4 days)

---

## 🔧 Immediate Action Items

### Day 1 (8 hours)
- [ ] Add transaction wrapping to PUT endpoint
- [ ] Implement request cancellation and debouncing
- [ ] Add validation for empty sets
- [ ] Close set editor on exercise reorder

### Day 2 (8 hours)
- [ ] Fix order_index logic with proper validation
- [ ] Add focus trap to modal
- [ ] Add ARIA labels and roles
- [ ] Implement rate limiting

### Day 3 (8 hours)
- [ ] Add input sanitization for notes
- [ ] Decide on denormalization strategy
- [ ] Implement chosen strategy
- [ ] Write integration tests

### Day 4 (2 hours)
- [ ] Manual QA testing
- [ ] Accessibility audit with screen reader
- [ ] Performance testing with 12 sets
- [ ] Security review

---

## 🧪 Testing Checklist

Before marking as production-ready, verify:

- [ ] Transaction rollback works (simulate DB failure mid-save)
- [ ] Rapid save clicks don't create duplicates
- [ ] Can't save empty sets
- [ ] Reordering exercises closes modal
- [ ] Order_index works with 0-based and 1-based data
- [ ] Tab key stays within modal
- [ ] Screen reader announces all elements
- [ ] Rate limit triggers at 11th request
- [ ] Notes with `<script>` tags are sanitized
- [ ] Set details in DB match workout_data JSONB

---

## 📊 Risk Assessment

**Current Risk Level:** 🔴 **HIGH**

**Deployment Recommendation:** ❌ **DO NOT DEPLOY TO PRODUCTION**

**Reasoning:**
- 10 critical issues identified
- 3 security vulnerabilities (rate limiting, XSS, race condition)
- 2 accessibility violations (legal risk)
- 5 data integrity issues (corruption risk)

**Safe to Deploy When:**
- All P0 issues resolved
- Integration tests pass
- Accessibility audit complete
- Security review approved

---

## 📝 Notes

- Feature is functionally complete and works in happy path
- Code quality is good, architecture is sound
- Issues are fixable within 3-4 days
- No need to redesign, just harden existing implementation
- Consider adding feature flag to enable/disable while fixing

---

**Last Updated:** 2025-10-12  
**Reviewed By:** AI Code Analyst  
**Next Review:** After P0 fixes completed
