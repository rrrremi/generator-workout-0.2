// Normalize metric names from database to KPI formula keys
export const METRIC_NAME_MAP: Record<string, string> = {
  // Lipids
  "total cholesterol": "tc",
  "total_cholesterol": "tc",
  "cholesterol": "tc",
  "hdl cholesterol": "hdl",
  "hdl_cholesterol": "hdl",
  "hdl-c": "hdl",
  "hdl": "hdl",
  "ldl cholesterol": "ldl",
  "ldl_cholesterol": "ldl",
  "ldl-c": "ldl",
  "ldl": "ldl",
  "triglycerides": "tg",
  "triglyceride": "tg",
  "trigs": "tg",
  "tg": "tg",
  "apob": "apob",
  "apolipoprotein b": "apob",
  "apoa1": "apoa1",
  "apolipoprotein a1": "apoa1",
  "lp(a)": "lpa",
  "lipoprotein a": "lpa",
  
  // Metabolic
  "glucose": "glucose",
  "blood glucose": "glucose",
  "fasting glucose": "glucose",
  "insulin": "insulin",
  "fasting insulin": "insulin",
  
  // Liver
  "ast": "ast",
  "sgot": "ast",
  "aspartate aminotransferase": "ast",
  "alt": "alt",
  "sgpt": "alt",
  "alanine aminotransferase": "alt",
  "ggt": "ggt",
  "gamma-gt": "ggt",
  "gamma glutamyl transferase": "ggt",
  "albumin": "albumin",
  "alb": "alb",
  
  // Renal
  "creatinine": "creatinine",
  "bun": "bun",
  "blood urea nitrogen": "bun",
  "urea": "urea",
  "cystatin c": "cystatin_c",
  "uric acid": "ua",
  
  // CBC
  "neutrophils": "neut",
  "neutrophil": "neut",
  "lymphocytes": "lymph",
  "lymphocyte": "lymph",
  "monocytes": "mono",
  "monocyte": "mono",
  "platelets": "plt",
  "platelet": "plt",
  "rdw": "rdw",
  "mpv": "mpv",
  
  // Inflammation
  "crp": "crp",
  "c-reactive protein": "crp",
  "esr": "esr",
  
  // Iron
  "iron": "iron",
  "tibc": "tibc",
  "ferritin": "ferritin",
  "transferrin saturation": "tsat",
  
  // Vitamins
  "vitamin d": "vitd",
  "25-oh vitamin d": "vitd",
  "vitamin b12": "b12",
  "b12": "b12",
  "homocysteine": "hcy",
  "calcium": "ca",
  
  // Body Composition
  "weight": "w",
  "body weight": "w",
  "height": "h",
  "waist circumference": "waist",
  "waist": "waist",
  "hip circumference": "hip",
  "hip": "hip",
  "body fat percentage": "fat_pct",
  "body fat": "fat_pct",
  "lean mass": "lean_mass",
  "fat mass": "fat_mass",
  "skeletal muscle mass": "skeletal_muscle_mass",
  
  // Electrolytes
  "sodium": "na",
  "potassium": "k",
  "chloride": "cl",
  "magnesium": "mg",
  
  // Hormones
  "testosterone": "testo",
  "shbg": "shbg",
  "estradiol": "e2",
  "cortisol": "cortisol",
  "dhea": "dhea",
  "tsh": "tsh",
  "ft3": "ft3",
  "free t3": "ft3",
  "ft4": "ft4",
  "free t4": "ft4",
  "rt3": "rt3",
  "reverse t3": "rt3",
  "acth": "acth",
  
  // Trace minerals
  "zinc": "zn",
  "copper": "cu",
  
  // Fatty acids
  "epa": "epa",
  "dha": "dha",
  "dpa": "dpa",
  "arachidonic acid": "aa",
  "omega-6": "n6",
  "omega-3": "n3"
}

export function normalizeMetricName(name: string): string {
  const normalized = name.toLowerCase().trim()
  return METRIC_NAME_MAP[normalized] || normalized
}
