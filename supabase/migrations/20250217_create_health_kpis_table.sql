-- ============================================================================
-- CREATE HEALTH KPIs TABLE
-- ============================================================================
-- Stores AI-generated derived health KPIs (Key Performance Indicators)
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Snapshot of measurements used
  measurements_snapshot TEXT NOT NULL,
  metrics_count INTEGER NOT NULL,
  
  -- Generated KPIs
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- AI metadata
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  model_version TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_cost DECIMAL(10, 6),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_health_kpis_user_id ON health_kpis(user_id);
CREATE INDEX idx_health_kpis_created_at ON health_kpis(created_at DESC);
CREATE INDEX idx_health_kpis_status ON health_kpis(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE health_kpis ENABLE ROW LEVEL SECURITY;

-- Users can only read their own KPIs
CREATE POLICY "Users can view own KPIs"
  ON health_kpis
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own KPIs
CREATE POLICY "Users can create own KPIs"
  ON health_kpis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own KPIs
CREATE POLICY "Users can delete own KPIs"
  ON health_kpis
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_health_kpis_updated_at
  BEFORE UPDATE ON health_kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON health_kpis TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Created health_kpis table with RLS policies
-- ============================================================================
