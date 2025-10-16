-- ============================================================================
-- ADD TRIGGER TO AUTO-UPDATE updated_at COLUMN
-- ============================================================================
-- When a measurement is edited, automatically update the updated_at timestamp
-- while keeping measured_at unchanged (the original measurement date)
-- ============================================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to measurements table
DROP TRIGGER IF EXISTS set_updated_at ON measurements;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The updated_at column will now automatically update when:
-- - A measurement value is edited
-- - Any field is modified
-- 
-- The measured_at column will remain unchanged (original measurement date)
-- ============================================================================
