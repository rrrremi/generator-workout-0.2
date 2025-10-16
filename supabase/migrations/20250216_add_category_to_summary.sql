-- ============================================================================
-- ADD CATEGORY TO MEASUREMENTS SUMMARY
-- ============================================================================
-- Update get_measurements_summary to include category from metrics_catalog
-- ============================================================================

CREATE OR REPLACE FUNCTION get_measurements_summary(p_user_id UUID)
RETURNS TABLE (
  metric TEXT,
  display_name TEXT,
  category TEXT,
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
    -- Get last 30 data points per metric (all time)
    SELECT 
      sub.metric,
      jsonb_agg(
        jsonb_build_object(
          'value', sub.value,
          'date', sub.measured_at
        ) ORDER BY sub.measured_at ASC
      ) as points,
      COUNT(*)::INT as count
    FROM (
      SELECT 
        m2.metric,
        m2.value,
        m2.measured_at,
        ROW_NUMBER() OVER (PARTITION BY m2.metric ORDER BY m2.measured_at DESC) as rn
      FROM measurements m2
      WHERE m2.user_id = p_user_id
    ) sub
    WHERE sub.rn <= 30  -- Limit to last 30 points per metric
    GROUP BY sub.metric
  )
  SELECT 
    l.metric,
    COALESCE(mc.display_name, l.metric) as display_name,
    COALESCE(mc.category, 'other') as category,  -- Include category from catalog
    l.latest_value,
    l.unit,
    l.latest_date,
    l.source,
    l.confidence,
    COALESCE(h.points, '[]'::jsonb) as sparkline_points,
    COALESCE(h.count, 0) as point_count
  FROM latest_per_metric l
  LEFT JOIN historical_data h ON l.metric = h.metric
  LEFT JOIN metrics_catalog mc ON l.metric = mc.key
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
-- Added category field to get_measurements_summary function
-- ============================================================================
