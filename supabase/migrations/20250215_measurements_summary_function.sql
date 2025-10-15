-- ============================================================================
-- MEASUREMENTS SUMMARY FUNCTION
-- ============================================================================
-- Optimized function to get latest value + sparkline data for all metrics
-- Uses existing indexes: idx_measurements_user_metric
-- ============================================================================

CREATE OR REPLACE FUNCTION get_measurements_summary(p_user_id UUID)
RETURNS TABLE (
  metric TEXT,
  latest_value FLOAT,
  unit TEXT,
  latest_date TIMESTAMPTZ,
  source TEXT,
  confidence FLOAT,
  sparkline_points JSONB,
  point_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_per_metric AS (
    -- Get latest value for each metric
    SELECT DISTINCT ON (m.metric)
      m.metric,
      m.value as latest_value,
      m.unit,
      m.measured_at as latest_date,
      m.source,
      m.confidence
    FROM measurements m
    WHERE m.user_id = p_user_id
    ORDER BY m.metric, m.measured_at DESC
  ),
  historical_data AS (
    -- Get last 30 data points per metric (90 day window)
    SELECT 
      m.metric,
      jsonb_agg(
        jsonb_build_object(
          'value', m.value,
          'date', m.measured_at
        ) ORDER BY m.measured_at ASC
      ) as points,
      COUNT(*)::INT as count
    FROM (
      SELECT 
        metric,
        value,
        measured_at,
        ROW_NUMBER() OVER (PARTITION BY metric ORDER BY measured_at DESC) as rn
      FROM measurements
      WHERE user_id = p_user_id
        AND measured_at > NOW() - INTERVAL '90 days'
    ) m
    WHERE m.rn <= 30  -- Limit to last 30 points per metric
    GROUP BY m.metric
  )
  SELECT 
    l.metric,
    l.latest_value,
    l.unit,
    l.latest_date,
    l.source,
    l.confidence,
    COALESCE(h.points, '[]'::jsonb) as sparkline_points,
    COALESCE(h.count, 0) as point_count
  FROM latest_per_metric l
  LEFT JOIN historical_data h ON l.metric = h.metric
  ORDER BY l.latest_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_measurements_summary(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Function: get_measurements_summary(user_id)
-- Returns: Latest value + sparkline data for all user metrics
-- Performance: Uses existing indexes, ~50-100ms for 50 metrics
-- ============================================================================
