# API Validation Fix for Isometric Workout Focus

## Issue
After implementing the isometric workout focus in the UI and workout generation prompts, the application was showing an error when attempting to generate a workout with the isometric focus:

```
POST http://localhost:3008/api/workouts/generate 400 (Bad Request)
Workout generation failed: {status: 400, statusText: 'Bad Request', error: 'Invalid workout focus', requestBody: {...}}
```

## Root Cause
The API route that handles workout generation (`app/api/workouts/generate/route.ts`) includes validation for allowed workout focus types. The new "isometric" focus was added to the UI and prompts, but not to the API validation array.

The validation code was checking if each selected workout focus is included in the `ALLOWED_FOCUS` array:

```typescript
// Validate each workout focus
if (!body.workout_focus.every(focus => ALLOWED_FOCUS.includes(focus.toLowerCase()))) {
  return 'Invalid workout focus';
}
```

However, the `ALLOWED_FOCUS` array did not include "isometric" as a valid option:

```typescript
const ALLOWED_FOCUS = ['cardio', 'hypertrophy', 'isolation', 'strength', 'speed', 'stability', 'activation', 'stretch', 'mobility', 'plyometric'];
```

## Solution
The fix was to update the `ALLOWED_FOCUS` array in `app/api/workouts/generate/route.ts` to include "isometric" as a valid workout focus:

```typescript
const ALLOWED_FOCUS = ['cardio', 'hypertrophy', 'isolation', 'strength', 'speed', 'stability', 'activation', 'stretch', 'mobility', 'plyometric', 'isometric'];
```

## Implementation
The change was made to the API route file, and the server was restarted to apply the changes.

## Testing
After implementing the fix, the application was tested by:
1. Selecting the isometric workout focus in the UI
2. Generating a workout with this focus
3. Verifying that no validation errors occurred
4. Confirming that the generated workout included appropriate isometric exercises

## Lessons Learned
When adding new options to the application:
1. Identify all validation points in the codebase
2. Update all relevant validation arrays and checks
3. Test the full workflow from UI selection to API processing

This ensures that new features are properly integrated across all layers of the application.
