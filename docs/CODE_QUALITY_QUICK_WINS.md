# Code Quality Quick Wins - Measurements Module

**Priority Actions to Improve Code Quality from B to A**

---

## 1. CONSOLIDATE TYPES (3-4 hours)

Create `types/measurements.ts`:
```typescript
export interface Measurement {
  id: string;
  value: number;
  unit: string;
  measured_at: string;
  source: 'ocr' | 'manual';
  confidence: number | null;
  notes: string | null;
}

export interface MetricSummary {
  metric: string;
  display_name: string;
  latest_value: number;
  unit: string;
  sparkline_points: SparklinePoint[];
}
```

Replace all duplicate interfaces across files.

---

## 2. ADD TOAST NOTIFICATIONS (4-6 hours)

```bash
npm install sonner
```

```typescript
// Replace alert() with:
import { toast } from 'sonner';

toast.success('Measurement updated');
toast.error('Failed to update');
```

---

## 3. EXTRACT CONSTANTS (2-3 hours)

Create `constants/measurements.ts`:
```typescript
export const MEASUREMENTS_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  RATE_LIMIT: 20,
} as const;
```

---

## 4. ADD ESLINT RULES (2 hours)

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  'no-console': ['warn', { allow: ['error'] }],
}
```

---

## 5. EXTRACT BUSINESS LOGIC (6-8 hours)

Move mutations to `hooks/useMeasurementMutations.ts`
Move sorting to `hooks/useMeasurementSort.ts`

---

**Total Effort: 17-23 hours (2-3 days)**
**Impact: B (80) → A (95)**
