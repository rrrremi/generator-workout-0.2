# 📊 Sparkline Measurements - Implementation Plan

## 🎯 Core Requirements

1. **Show only metrics with data** - No empty states
2. **Single data point** - Show value + single dot/line
3. **Multiple data points** - Show value + sparkline
4. **Performance** - Fast, smooth, efficient
5. **Simplicity** - Minimal code, no visual enhancements

---

## 🏗️ Architecture

### **Data Flow:**
```
User visits /measurements
  ↓
API: GET /api/measurements/summary
  ↓
Single SQL query (optimized with indexes)
  ↓
Returns: Only metrics with data
  ↓
React: Render cards with Recharts sparklines
  ↓
Client-side cache (React Query, 5 min)
```

---

## 📊 Database Layer

### **Single Optimized Query:**
```sql
-- Get latest value + last 30 data points per metric
-- Uses existing indexes: idx_measurements_user_metric
WITH latest_per_metric AS (
  SELECT DISTINCT ON (metric)
    metric,
    value,
    unit,
    measured_at,
    source,
    confidence
  FROM measurements
  WHERE user_id = $1
  ORDER BY metric, measured_at DESC
),
historical_data AS (
  SELECT 
    metric,
    array_agg(
      json_build_object(
        'value', value,
        'date', measured_at
      ) ORDER BY measured_at ASC
    ) as points
  FROM measurements
  WHERE user_id = $1
    AND measured_at > NOW() - INTERVAL '90 days'
  GROUP BY metric
)
SELECT 
  l.metric,
  l.value as latest_value,
  l.unit,
  l.measured_at as latest_date,
  l.source,
  l.confidence,
  COALESCE(h.points, '[]'::json[]) as sparkline_points
FROM latest_per_metric l
LEFT JOIN historical_data h ON l.metric = h.metric
ORDER BY l.measured_at DESC;
```

### **Why This Query is Fast:**
- ✅ Uses existing composite index `(user_id, metric, measured_at DESC)`
- ✅ Single query (no N+1 problem)
- ✅ Returns only last 90 days (limited dataset)
- ✅ Array aggregation is fast in PostgreSQL
- ✅ DISTINCT ON is optimized for latest value

### **Expected Performance:**
- **10 metrics:** ~20ms
- **50 metrics:** ~50ms
- **100 metrics:** ~100ms

---

## 🔌 API Layer

### **File:** `app/api/measurements/summary/route.ts`

**Responsibilities:**
1. Authenticate user
2. Execute single SQL query
3. Transform data to JSON
4. Return response

**Response Format:**
```typescript
{
  metrics: [
    {
      metric: "weight",
      display_name: "Weight",
      latest_value: 79.6,
      unit: "kg",
      latest_date: "2025-10-15T10:30:00Z",
      source: "ocr",
      confidence: 0.98,
      sparkline_points: [
        { value: 80.1, date: "2025-09-15" },
        { value: 79.8, date: "2025-09-22" },
        { value: 79.5, date: "2025-10-01" },
        { value: 79.6, date: "2025-10-15" }
      ],
      point_count: 4
    }
  ]
}
```

**Performance Optimizations:**
- ✅ No loops or transformations
- ✅ Direct SQL → JSON
- ✅ Minimal data transfer
- ✅ Gzip compression enabled

---

## ⚛️ Frontend Layer

### **Component Structure:**

```
app/protected/measurements/page.tsx
  ├─ useMeasurementsSummary() hook (React Query)
  ├─ Loading state (spinner)
  └─ Grid of MetricCard components

components/measurements/MetricCard.tsx
  ├─ Left: Metric info
  └─ Right: Sparkline component

components/measurements/Sparkline.tsx
  └─ Recharts LineChart (minimal config)
```

### **React Query Hook:**
```typescript
// hooks/useMeasurementsSummary.ts
export function useMeasurementsSummary() {
  return useQuery({
    queryKey: ['measurements', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/measurements/summary')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

**Why React Query:**
- ✅ Automatic caching (no re-fetch on navigation)
- ✅ Background refetch on focus
- ✅ Deduplication (multiple components = 1 request)
- ✅ Loading/error states built-in

---

## 📈 Sparkline Component

### **Recharts Configuration (Minimal):**

```typescript
// components/measurements/Sparkline.tsx
interface SparklineProps {
  data: Array<{ value: number; date: string }>
}

export function Sparkline({ data }: SparklineProps) {
  // Single data point: show horizontal line
  if (data.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={[data[0], data[0]]}>
          <Line 
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Multiple data points: show sparkline
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line 
          type="monotone"
          dataKey="value"
          stroke="currentColor"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false} // Disable for performance
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Performance Optimizations:**
- ✅ `isAnimationActive={false}` - No animations (faster render)
- ✅ `dot={false}` - No dots on line (less DOM nodes)
- ✅ Minimal config - Only essential props
- ✅ `ResponsiveContainer` - Auto-sizing (no manual calculations)

---

## 🎨 MetricCard Component

### **Simple, Functional Design:**

```typescript
// components/measurements/MetricCard.tsx
interface MetricCardProps {
  metric: string
  display_name: string
  latest_value: number
  unit: string
  sparkline_points: Array<{ value: number; date: string }>
  source: string
  confidence?: number
}

export function MetricCard(props: MetricCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1">
          <p className="text-xs text-white/60 uppercase tracking-wide">
            {props.display_name}
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {props.latest_value} {props.unit}
          </p>
          {props.source === 'ocr' && props.confidence && (
            <p className="text-xs text-white/50 mt-1">
              {Math.round(props.confidence * 100)}% confidence
            </p>
          )}
        </div>

        {/* Right: Sparkline */}
        <div className="w-32 h-16">
          <Sparkline data={props.sparkline_points} />
        </div>
      </div>
    </div>
  )
}
```

**Why This Design:**
- ✅ Fixed sparkline width (no layout shift)
- ✅ Flexbox (simple, fast)
- ✅ No unnecessary wrappers
- ✅ Minimal DOM nodes

---

## 📄 Main Page Component

### **File:** `app/protected/measurements/page.tsx`

```typescript
export default function MeasurementsPage() {
  const { data, isLoading, error } = useMeasurementsSummary()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error loading measurements</div>
  }

  // No metrics = show empty state
  if (!data?.metrics || data.metrics.length === 0) {
    return <EmptyState />
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-2 pb-10">
      {/* Header with Upload/Manual buttons */}
      <Header />

      {/* Grid of metric cards */}
      <div className="grid gap-3 mt-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.metric} {...metric} />
        ))}
      </div>
    </section>
  )
}
```

**Performance:**
- ✅ Single render (no unnecessary re-renders)
- ✅ Key on metric (stable, no index)
- ✅ No inline functions in map
- ✅ Cached data (React Query)

---

## 🚀 Implementation Order

### **Step 1: Database (30 min)**
1. Create optimized SQL query
2. Test with existing data
3. Verify performance with EXPLAIN ANALYZE

### **Step 2: API Route (30 min)**
1. Create `/api/measurements/summary/route.ts`
2. Implement authentication
3. Execute query and return JSON
4. Test with Postman/curl

### **Step 3: React Query Hook (15 min)**
1. Create `hooks/useMeasurementsSummary.ts`
2. Configure caching
3. Test in component

### **Step 4: Sparkline Component (30 min)**
1. Create `components/measurements/Sparkline.tsx`
2. Handle single vs multiple data points
3. Test with sample data

### **Step 5: MetricCard Component (30 min)**
1. Create `components/measurements/MetricCard.tsx`
2. Layout: info + sparkline
3. Test with different metrics

### **Step 6: Main Page (30 min)**
1. Update `app/protected/measurements/page.tsx`
2. Replace current list with grid
3. Add loading/error states

### **Step 7: Testing (30 min)**
1. Test with 1 data point per metric
2. Test with multiple data points
3. Test with no data (should show nothing)
4. Test performance (measure render time)

**Total Time: ~3.5 hours**

---

## ⚡ Performance Targets

### **Database Query:**
- ✅ < 100ms for 50 metrics
- ✅ Uses existing indexes
- ✅ No full table scans

### **API Response:**
- ✅ < 150ms total (query + JSON)
- ✅ < 50KB payload for 50 metrics
- ✅ Gzip compression

### **Frontend Render:**
- ✅ < 100ms initial render
- ✅ < 16ms per card (60fps)
- ✅ No layout shifts

### **Total Page Load:**
- ✅ < 500ms from click to interactive
- ✅ Cached subsequent loads < 50ms

---

## 🧪 Testing Checklist

### **Data Scenarios:**
- [ ] User with 0 measurements → Show empty state
- [ ] User with 1 metric, 1 data point → Show card with dot
- [ ] User with 1 metric, 4 data points → Show card with sparkline
- [ ] User with 10 metrics, mixed data → Show all cards
- [ ] User with 50 metrics → Performance OK

### **Edge Cases:**
- [ ] Very old measurements (> 90 days) → Not in sparkline
- [ ] Same value repeated → Flat line
- [ ] Large value changes → Sparkline scales correctly
- [ ] Missing confidence (manual entry) → No confidence shown

### **Performance:**
- [ ] Query time logged in console
- [ ] React Query cache working
- [ ] No unnecessary re-renders
- [ ] Smooth scrolling with many cards

---

## 📦 Dependencies

### **New:**
- None! (Recharts already in use)

### **Existing:**
- `recharts` - For sparklines
- `@tanstack/react-query` - For caching
- `@supabase/supabase-js` - For database
- `framer-motion` - For page transitions (optional)

---

## 🔧 Configuration

### **React Query Config:**
```typescript
// app/providers.tsx
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})
```

### **Recharts Global Config:**
- No global config needed
- Per-component configuration only

---

## 📊 Metrics to Track

### **After Implementation:**
1. **Query Performance:** Log query time in API route
2. **Render Performance:** Use React DevTools Profiler
3. **Bundle Size:** Check if Recharts tree-shaking works
4. **User Metrics:** Time to interactive, bounce rate

---

## 🎯 Success Criteria

### **Functional:**
- ✅ Shows only metrics with data
- ✅ Single point = dot/line
- ✅ Multiple points = sparkline
- ✅ Latest value displayed correctly
- ✅ Confidence shown for OCR

### **Performance:**
- ✅ Page loads < 500ms
- ✅ Smooth scrolling
- ✅ No janky animations
- ✅ Works with 50+ metrics

### **Code Quality:**
- ✅ Simple, readable code
- ✅ No premature optimization
- ✅ TypeScript types correct
- ✅ No console errors

---

## 🚫 What NOT to Do

- ❌ No fancy animations (yet)
- ❌ No trend arrows (yet)
- ❌ No color coding (yet)
- ❌ No tooltips (yet)
- ❌ No click handlers (yet)
- ❌ No period selectors (yet)

**Focus: Get it working, fast, and simple.**

---

## 📝 Next Steps After MVP

### **Phase 2 (Later):**
1. Click card → Detailed view
2. Trend indicators (up/down arrows)
3. Color coding (green/red)
4. Hover tooltips
5. Period selector (30d, 90d, 1y)

### **Phase 3 (Much Later):**
1. Goal tracking
2. Correlations
3. Insights
4. Export data

---

## ✅ Ready to Implement

**Start with Step 1: Database query**
- Test the SQL query in Supabase
- Verify it uses indexes
- Check performance with EXPLAIN ANALYZE

**Then proceed sequentially through steps 2-7.**

**Estimated completion: 3.5 hours of focused work.**

🚀 **Let's build it!**
