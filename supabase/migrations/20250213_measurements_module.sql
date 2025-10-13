-- ============================================================================
-- MEASUREMENTS MODULE - Complete Database Setup
-- ============================================================================
-- Purpose: Body composition tracking with OCR extraction
-- Created: 2025-10-13
-- ============================================================================

-- 1. MEASUREMENTS TABLE
-- ============================================================================
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core measurement data
  metric TEXT NOT NULL,                   -- e.g., 'weight', 'body_fat_percent'
  value FLOAT NOT NULL,                   -- Numeric value
  unit TEXT NOT NULL,                     -- e.g., 'kg', '%', 'level'
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  source TEXT NOT NULL DEFAULT 'manual',  -- 'ocr' or 'manual'
  confidence FLOAT,                       -- 0.0-1.0 (OCR confidence score)
  image_url TEXT,                         -- Supabase Storage URL
  notes TEXT,                             -- User notes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_measurements_user_date ON measurements(user_id, measured_at DESC);
CREATE INDEX idx_measurements_user_metric ON measurements(user_id, metric, measured_at DESC);

-- Enable RLS
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own measurements"
  ON measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON measurements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. METRICS CATALOG TABLE
-- ============================================================================
CREATE TABLE metrics_catalog (
  key TEXT PRIMARY KEY,                   -- Unique metric identifier
  display_name TEXT NOT NULL,             -- Human-readable name
  unit TEXT NOT NULL,                     -- Default unit
  category TEXT NOT NULL,                 -- 'composition', 'circumference', etc.
  min_value FLOAT,                        -- Validation: minimum allowed value
  max_value FLOAT,                        -- Validation: maximum allowed value
  sort_order INT NOT NULL DEFAULT 0       -- Display order in UI
);

-- ============================================================================
-- 3. SEED ESSENTIAL METRICS
-- ============================================================================
INSERT INTO metrics_catalog (key, display_name, unit, category, min_value, max_value, sort_order) VALUES
  ('weight', 'Weight', 'kg', 'composition', 30, 300, 1),
  ('body_fat_percent', 'Body Fat %', '%', 'composition', 3, 60, 2),
  ('skeletal_muscle_mass', 'Muscle Mass', 'kg', 'composition', 10, 100, 3),
  ('bmi', 'BMI', 'kg/m²', 'composition', 10, 50, 4),
  ('visceral_fat_level', 'Visceral Fat', 'level', 'composition', 1, 30, 5),
  ('body_water_percent', 'Body Water %', '%', 'composition', 30, 80, 6),
  ('protein', 'Protein', 'kg', 'composition', 5, 30, 7),
  ('mineral', 'Mineral', 'kg', 'composition', 1, 10, 8),
  ('basal_metabolic_rate', 'BMR', 'kcal', 'composition', 800, 4000, 9);

-- ============================================================================
-- 4. STORAGE BUCKET FOR IMAGES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('measurement-images', 'measurement-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (users can only access their own images)
CREATE POLICY "Users can upload own measurement images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'measurement-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own measurement images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'measurement-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own measurement images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'measurement-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get latest measurements for a user
CREATE OR REPLACE FUNCTION get_latest_measurements(p_user_id UUID)
RETURNS TABLE (
  metric TEXT,
  value FLOAT,
  unit TEXT,
  measured_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (m.metric)
    m.metric,
    m.value,
    m.unit,
    m.measured_at
  FROM measurements m
  WHERE m.user_id = p_user_id
  ORDER BY m.metric, m.measured_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: measurements, metrics_catalog
-- Indexes created: 2 performance indexes
-- RLS enabled: Yes (4 policies)
-- Storage bucket: measurement-images
-- Helper functions: get_latest_measurements
-- ============================================================================
