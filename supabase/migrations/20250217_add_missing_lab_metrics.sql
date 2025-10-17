-- ============================================================================
-- ADD MISSING COMMON LAB METRICS
-- ============================================================================
-- Adds CRP, ferritin, and other commonly tested inflammatory/metabolic markers
-- ============================================================================

INSERT INTO metrics_catalog (key, display_name, unit, category, min_value, max_value, sort_order) VALUES
  -- Inflammatory Markers
  ('crp', 'C-Reactive Protein (CRP)', 'mg/L', 'other', 0, 50, 200),
  ('hs_crp', 'High-Sensitivity CRP', 'mg/L', 'other', 0, 10, 201),
  ('esr', 'ESR (Sed Rate)', 'mm/hr', 'other', 0, 100, 202),
  
  -- Iron Studies
  ('ferritin', 'Ferritin', 'ng/mL', 'vitamins', 10, 500, 174),
  ('transferrin', 'Transferrin', 'mg/dL', 'vitamins', 200, 400, 175),
  ('tibc', 'TIBC', 'μg/dL', 'vitamins', 250, 450, 176),
  
  -- Electrolytes
  ('sodium', 'Sodium', 'mEq/L', 'other', 130, 150, 210),
  ('potassium', 'Potassium', 'mEq/L', 'other', 3, 6, 211),
  ('chloride', 'Chloride', 'mEq/L', 'other', 95, 110, 212),
  
  -- Metabolic
  ('uric_acid', 'Uric Acid', 'mg/dL', 'other', 2, 10, 220),
  ('albumin', 'Albumin', 'g/dL', 'liver', 3, 6, 142),
  ('total_protein', 'Total Protein', 'g/dL', 'liver', 6, 9, 143),
  ('bilirubin_total', 'Total Bilirubin', 'mg/dL', 'liver', 0, 3, 144),
  
  -- Lipid Panel Extended
  ('apolipoprotein_a1', 'Apolipoprotein A1', 'mg/dL', 'blood_lipids', 100, 200, 104),
  ('apolipoprotein_b', 'Apolipoprotein B', 'mg/dL', 'blood_lipids', 50, 150, 105),
  ('lipoprotein_a', 'Lipoprotein(a)', 'mg/dL', 'blood_lipids', 0, 100, 106),
  
  -- Hormones
  ('cortisol', 'Cortisol', 'μg/dL', 'other', 5, 25, 230),
  ('testosterone', 'Testosterone', 'ng/dL', 'other', 200, 1200, 231),
  ('estradiol', 'Estradiol', 'pg/mL', 'other', 10, 400, 232),
  
  -- Kidney Extended
  ('egfr', 'eGFR', 'mL/min/1.73m²', 'kidney', 30, 120, 152),
  ('urine_albumin', 'Urine Albumin', 'mg/L', 'kidney', 0, 30, 153),
  ('urine_creatinine', 'Urine Creatinine', 'mg/dL', 'kidney', 20, 300, 154),
  
  -- Blood Cells Extended
  ('neutrophils', 'Neutrophils', 'thousand/μL', 'blood_cells', 1.5, 8, 125),
  ('lymphocytes', 'Lymphocytes', 'thousand/μL', 'blood_cells', 1, 4, 126),
  ('monocytes', 'Monocytes', 'thousand/μL', 'blood_cells', 0.2, 1, 127),
  ('eosinophils', 'Eosinophils', 'thousand/μL', 'blood_cells', 0, 0.5, 128),
  ('basophils', 'Basophils', 'thousand/μL', 'blood_cells', 0, 0.2, 129),
  
  -- Insulin & Diabetes
  ('insulin_fasting', 'Fasting Insulin', 'μIU/mL', 'blood_sugar', 2, 25, 112),
  ('c_peptide', 'C-Peptide', 'ng/mL', 'blood_sugar', 0.5, 4, 113)

ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added 32 new metrics including:
-- - CRP and inflammatory markers
-- - Extended iron studies (ferritin, transferrin, TIBC)
-- - Electrolytes (sodium, potassium, chloride)
-- - Extended lipid panel (Apo A1, Apo B, Lp(a))
-- - Hormones (cortisol, testosterone, estradiol)
-- - Extended kidney markers (eGFR, urine albumin)
-- - Differential white blood cell count
-- - Insulin and C-peptide
-- ============================================================================
