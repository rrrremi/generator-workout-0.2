-- ============================================================================
-- CREATE HEALTH ANALYSES TABLE
-- ============================================================================
-- Store AI-generated health analyses based on user measurements
-- ============================================================================

CREATE TABLE health_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Input snapshot
  user_age INTEGER,
  user_sex TEXT,
  measurements_snapshot TEXT NOT NULL,  -- CSV format
  metrics_count INTEGER NOT NULL,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  
  -- AI provider info
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  model_version TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_cost DECIMAL(10,4),
  
  -- Analysis results (structured JSON from AI)
  summary TEXT NOT NULL,
  qc_issues JSONB,
  normalization_notes JSONB,
  derived_metrics JSONB,
  current_state JSONB,
  trends JSONB,
  correlations JSONB,
  paradoxes JSONB,
  hypotheses JSONB,
  risk_assessment JSONB,
  recommendations_next_steps JSONB,
  uncertainties JSONB,
  data_gaps JSONB,
  
  -- Full JSON response (for reference)
  full_response JSONB NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- User interaction
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  is_archived BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_health_analyses_user_date ON health_analyses(user_id, created_at DESC);
CREATE INDEX idx_health_analyses_status ON health_analyses(status) WHERE status = 'processing';

-- RLS Policies
ALTER TABLE health_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
  ON health_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON health_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON health_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON health_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Created health_analyses table with RLS policies
-- Stores AI-generated health analyses with full audit trail
-- ============================================================================
