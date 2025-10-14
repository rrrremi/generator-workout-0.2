-- ============================================================================
-- BLOOD & VITAL METRICS - Common Lab Test Values
-- ============================================================================
-- Adds cholesterol, blood pressure, glucose, and other vital metrics
-- ============================================================================

INSERT INTO metrics_catalog (key, display_name, unit, category, min_value, max_value, sort_order) VALUES
  -- Cholesterol & Lipids
  ('cholesterol_total', 'Total Cholesterol', 'mg/dL', 'blood_lipids', 100, 400, 100),
  ('cholesterol_hdl', 'HDL Cholesterol (Good)', 'mg/dL', 'blood_lipids', 20, 100, 101),
  ('cholesterol_ldl', 'LDL Cholesterol (Bad)', 'mg/dL', 'blood_lipids', 50, 300, 102),
  ('triglycerides', 'Triglycerides', 'mg/dL', 'blood_lipids', 50, 500, 103),
  
  -- Blood Sugar
  ('glucose', 'Blood Glucose', 'mg/dL', 'blood_sugar', 50, 300, 110),
  ('hba1c', 'HbA1c (Avg Blood Sugar)', '%', 'blood_sugar', 4, 15, 111),
  
  -- Blood Cells
  ('hemoglobin', 'Hemoglobin', 'g/dL', 'blood_cells', 8, 20, 120),
  ('hematocrit', 'Hematocrit', '%', 'blood_cells', 30, 60, 121),
  ('red_blood_cells', 'Red Blood Cells', 'million/μL', 'blood_cells', 3, 7, 122),
  ('white_blood_cells', 'White Blood Cells', 'thousand/μL', 'blood_cells', 3, 15, 123),
  ('platelets', 'Platelets', 'thousand/μL', 'blood_cells', 100, 500, 124),
  
  -- Blood Pressure & Vitals
  ('blood_pressure_systolic', 'Blood Pressure (Systolic)', 'mmHg', 'vitals', 80, 200, 130),
  ('blood_pressure_diastolic', 'Blood Pressure (Diastolic)', 'mmHg', 'vitals', 40, 130, 131),
  ('heart_rate', 'Heart Rate', 'bpm', 'vitals', 40, 200, 132),
  ('oxygen_saturation', 'Oxygen Saturation (SpO2)', '%', 'vitals', 80, 100, 133),
  ('body_temperature', 'Body Temperature', '°C', 'vitals', 35, 42, 134),
  
  -- Liver Function
  ('alt', 'ALT (Liver Enzyme)', 'U/L', 'liver', 0, 200, 140),
  ('ast', 'AST (Liver Enzyme)', 'U/L', 'liver', 0, 200, 141),
  
  -- Kidney Function
  ('creatinine', 'Creatinine', 'mg/dL', 'kidney', 0.5, 5, 150),
  ('bun', 'BUN (Blood Urea Nitrogen)', 'mg/dL', 'kidney', 5, 50, 151),
  
  -- Thyroid
  ('tsh', 'TSH (Thyroid)', 'mIU/L', 'thyroid', 0.1, 10, 160),
  ('t3', 'T3 (Thyroid)', 'ng/dL', 'thyroid', 50, 250, 161),
  ('t4', 'T4 (Thyroid)', 'μg/dL', 'thyroid', 4, 15, 162),
  
  -- Vitamins & Minerals
  ('vitamin_d', 'Vitamin D', 'ng/mL', 'vitamins', 10, 100, 170),
  ('vitamin_b12', 'Vitamin B12', 'pg/mL', 'vitamins', 200, 1500, 171),
  ('iron', 'Iron', 'μg/dL', 'vitamins', 30, 200, 172),
  ('calcium', 'Calcium', 'mg/dL', 'vitamins', 8, 12, 173)
  
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added 27 new blood/vital metrics
-- Categories: blood_lipids, blood_sugar, blood_cells, vitals, liver, kidney, thyroid, vitamins
-- Total metrics in catalog: 72+ (45 body composition + 27 blood/vitals)
-- ============================================================================
