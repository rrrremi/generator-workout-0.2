-- ============================================================================
-- ADD AGE AND SEX TO PROFILES
-- ============================================================================
-- Add user demographic fields for health analysis
-- ============================================================================

-- Add age and sex columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS sex TEXT;

-- Add constraints
ALTER TABLE profiles
  ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
  ADD CONSTRAINT valid_sex CHECK (sex IS NULL OR sex IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add comments for documentation
COMMENT ON COLUMN profiles.age IS 'User age in years (13-120). Optional field for health analysis.';
COMMENT ON COLUMN profiles.sex IS 'User biological sex. Options: male, female, other, prefer_not_to_say. Optional field for health analysis.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added age (INTEGER, 13-120) and sex (TEXT, enum) to profiles table
-- Both fields are optional (nullable) for privacy
-- ============================================================================
