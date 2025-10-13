-- ============================================================================
-- EXTENDED METRICS CATALOG - Complete InBody Metrics
-- ============================================================================
-- Adds all possible InBody measurements for comprehensive tracking
-- ============================================================================

-- Add extended body composition metrics
INSERT INTO metrics_catalog (key, display_name, unit, category, min_value, max_value, sort_order) VALUES
  -- Segmental Lean Mass
  ('segmental_lean_mass_right_arm', 'Lean Mass - Right Arm', 'kg', 'segmental_lean', 1, 20, 20),
  ('segmental_lean_mass_left_arm', 'Lean Mass - Left Arm', 'kg', 'segmental_lean', 1, 20, 21),
  ('segmental_lean_mass_trunk', 'Lean Mass - Trunk', 'kg', 'segmental_lean', 10, 50, 22),
  ('segmental_lean_mass_right_leg', 'Lean Mass - Right Leg', 'kg', 'segmental_lean', 5, 30, 23),
  ('segmental_lean_mass_left_leg', 'Lean Mass - Left Leg', 'kg', 'segmental_lean', 5, 30, 24),
  
  -- Segmental Fat Mass
  ('segmental_fat_mass_right_arm', 'Fat Mass - Right Arm', 'kg', 'segmental_fat', 0.1, 10, 25),
  ('segmental_fat_mass_left_arm', 'Fat Mass - Left Arm', 'kg', 'segmental_fat', 0.1, 10, 26),
  ('segmental_fat_mass_trunk', 'Fat Mass - Trunk', 'kg', 'segmental_fat', 1, 40, 27),
  ('segmental_fat_mass_right_leg', 'Fat Mass - Right Leg', 'kg', 'segmental_fat', 0.5, 20, 28),
  ('segmental_fat_mass_left_leg', 'Fat Mass - Left Leg', 'kg', 'segmental_fat', 0.5, 20, 29),
  
  -- Water Balance
  ('total_body_water', 'Total Body Water', 'L', 'water', 20, 80, 30),
  ('intracellular_water', 'Intracellular Water', 'L', 'water', 10, 50, 31),
  ('extracellular_water', 'Extracellular Water', 'L', 'water', 5, 30, 32),
  ('ecw_ratio', 'ECW Ratio', 'ratio', 'water', 0.3, 0.5, 33),
  
  -- Advanced Body Composition
  ('body_fat_mass', 'Body Fat Mass', 'kg', 'composition', 2, 100, 10),
  ('lean_body_mass', 'Lean Body Mass', 'kg', 'composition', 20, 100, 11),
  ('fat_free_mass', 'Fat Free Mass', 'kg', 'composition', 20, 100, 12),
  ('body_cell_mass', 'Body Cell Mass', 'kg', 'composition', 10, 60, 13),
  
  -- Obesity & Control
  ('waist_hip_ratio', 'Waist-Hip Ratio', 'ratio', 'obesity', 0.5, 1.5, 40),
  ('obesity_grade', 'Obesity Grade', 'grade', 'obesity', 0, 5, 41),
  ('fat_control', 'Fat Control', 'kg', 'control', -30, 30, 42),
  ('muscle_control', 'Muscle Control', 'kg', 'control', -20, 20, 43),
  ('weight_control', 'Weight Control', 'kg', 'control', -50, 50, 44),
  
  -- Energy & Targets
  ('target_caloric_intake', 'Target Caloric Intake', 'kcal', 'energy', 1000, 5000, 50),
  ('ideal_body_weight', 'Ideal Body Weight', 'kg', 'targets', 30, 150, 51),
  
  -- Performance & Scores
  ('fitness_score', 'Fitness Score', 'points', 'performance', 0, 100, 60),
  ('inbody_score', 'InBody Score', 'points', 'performance', 0, 100, 61),
  
  -- Segmental Analysis (Percentages)
  ('segmental_lean_analysis_right_arm', 'Lean % - Right Arm', '%', 'segmental_analysis', 50, 150, 70),
  ('segmental_lean_analysis_left_arm', 'Lean % - Left Arm', '%', 'segmental_analysis', 50, 150, 71),
  ('segmental_lean_analysis_trunk', 'Lean % - Trunk', '%', 'segmental_analysis', 50, 150, 72),
  ('segmental_lean_analysis_right_leg', 'Lean % - Right Leg', '%', 'segmental_analysis', 50, 150, 73),
  ('segmental_lean_analysis_left_leg', 'Lean % - Left Leg', '%', 'segmental_analysis', 50, 150, 74),
  
  -- Impedance (Advanced)
  ('impedance_5khz', 'Impedance 5kHz', 'Ω', 'impedance', 100, 1000, 80),
  ('impedance_50khz', 'Impedance 50kHz', 'Ω', 'impedance', 100, 1000, 81),
  ('impedance_250khz', 'Impedance 250kHz', 'Ω', 'impedance', 100, 1000, 82)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added 36 new metrics for comprehensive InBody tracking
-- Total metrics in catalog: 45 (9 original + 36 new)
-- ============================================================================
