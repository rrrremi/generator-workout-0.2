export interface KPIDefinition {
  id: string
  name: string
  cat: string
  f: string
  m: string[]
  d: string
}

export const KPI_CATALOG: KPIDefinition[] = [
  // Lipid Panel
  {id:"lipid_tc_hdl",name:"TC/HDL Ratio",cat:"Lipid",f:"tc/hdl",m:["tc","hdl"],d:"CVD risk; <4 optimal"},
  {id:"lipid_ldl_hdl",name:"LDL/HDL Ratio",cat:"Lipid",f:"ldl/hdl",m:["ldl","hdl"],d:"Atherogenic risk indicator"},
  {id:"lipid_tg_hdl",name:"TG/HDL Ratio",cat:"Lipid",f:"tg/hdl",m:["tg","hdl"],d:"Insulin resistance marker"},
  {id:"lipid_non_hdl",name:"Non-HDL Cholesterol",cat:"Lipid",f:"tc-hdl",m:["tc","hdl"],d:"All atherogenic cholesterol"},
  {id:"lipid_aip",name:"Atherogenic Index",cat:"Lipid",f:"log10(tg/hdl)",m:["tg","hdl"],d:"Atherogenic risk; <0.1 ideal"},
  {id:"lipid_remnant",name:"Remnant Cholesterol",cat:"Lipid",f:"tc-(ldl+hdl)",m:["tc","ldl","hdl"],d:"TG-rich lipoprotein indicator"},
  {id:"lipid_apob_apoa1",name:"ApoB/ApoA1 Ratio",cat:"Lipid",f:"apob/apoA1",m:["apob","apoa1"],d:"Strong predictor of CVD risk"},
  {id:"lipid_ldlp",name:"LDL Particle Number",cat:"Lipid",f:"ldl_p",m:["ldl_p"],d:"Reflects LDL particle burden"},
  {id:"lipid_sdldl_pct",name:"Small Dense LDL %",cat:"Lipid",f:"sdldl/ldl_total*100",m:["sdldl","ldl_total"],d:"Proportion of small dense LDL"},
  {id:"lipid_hdl2_hdl3",name:"HDL2/HDL3 Ratio",cat:"Lipid",f:"hdl2/hdl3",m:["hdl2","hdl3"],d:"HDL subtype quality"},
  {id:"lipid_nonhdl_hdl",name:"Non-HDL/HDL Ratio",cat:"Lipid",f:"nonhdl/hdl",m:["nonhdl","hdl"],d:"Overall atherogenic ratio"},
  {id:"lipid_tg_nonhdl",name:"TG/Non-HDL Ratio",cat:"Lipid",f:"tg/nonhdl",m:["tg","nonhdl"],d:"Residual risk marker"},
  {id:"lipid_tg_ldl",name:"TG/LDL Ratio",cat:"Lipid",f:"tg/ldl",m:["tg","ldl"],d:"Small-dense LDL tendency"},
  {id:"lipid_tc_nonhdl",name:"TC/Non-HDL Ratio",cat:"Lipid",f:"tc/nonhdl",m:["tc","nonhdl"],d:"Cholesterol distribution"},
  {id:"lipid_lpa",name:"Lp(a)",cat:"Lipid",f:"lpa",m:["lpa"],d:"Genetic cardiovascular risk factor"},
  {id:"lipid_ggt_hdl",name:"GGT/HDL Ratio",cat:"Lipid",f:"ggt/hdl",m:["ggt","hdl"],d:"Oxidative and hepatic lipid stress"},

  // Metabolic
  {id:"met_homa_ir",name:"HOMA-IR",cat:"Metabolic",f:"(glucose*insulin)/405",m:["glucose","insulin"],d:"Insulin resistance; high=bad"},
  {id:"met_quicki",name:"QUICKI",cat:"Metabolic",f:"1/(log(insulin)+log(glucose))",m:["insulin","glucose"],d:"Insulin sensitivity; high=good"},
  {id:"met_tyg",name:"TyG Index",cat:"Metabolic",f:"ln((tg*glucose)/2)",m:["tg","glucose"],d:"IR marker from TG & glucose"},
  {id:"met_homa_b",name:"HOMA-%B",cat:"Metabolic",f:"(360*insulin)/(glucose-63)",m:["insulin","glucose"],d:"Beta-cell function"},
  {id:"met_homa_s",name:"HOMA-%S",cat:"Metabolic",f:"1/homa_ir*100",m:["homa_ir"],d:"Insulin sensitivity %"},
  {id:"met_mca",name:"McAuley Index",cat:"Metabolic",f:"exp(2.63-0.28*ln(insulin)-0.31*ln(tg))",m:["insulin","tg"],d:"IR estimate"},
  {id:"met_mets_ir",name:"METS-IR",cat:"Metabolic",f:"(ln((2*glucose)+tg)*bmi)/ln(hdl)",m:["glucose","tg","bmi","hdl"],d:"Modern IR index"},
  {id:"met_tygpro",name:"TyG Product",cat:"Metabolic",f:"tg*glucose",m:["tg","glucose"],d:"Simplified metabolic load"},
  {id:"met_disposition",name:"Disposition Index",cat:"Metabolic",f:"insulin_sensitivity*insulin_secretion",m:["insulin_sensitivity","insulin_secretion"],d:"Beta-cell compensation"},
  {id:"met_glucose_var",name:"Glucose Variability",cat:"Metabolic",f:"sd(glucose_series)",m:["glucose_series"],d:"Glycemic stability"},
  {id:"met_mean_glucose",name:"Mean Glucose",cat:"Metabolic",f:"avg(glucose_series)",m:["glucose_series"],d:"Average glucose level"},

  // Liver
  {id:"liver_ast_alt",name:"De Ritis Ratio",cat:"Liver",f:"ast/alt",m:["ast","alt"],d:"Liver injury pattern"},
  {id:"liver_apri",name:"APRI",cat:"Liver",f:"(ast/uln_ast)*100/platelets",m:["ast","platelets"],d:"Fibrosis predictor"},
  {id:"liver_fib5",name:"FIB-5 Index",cat:"Liver",f:"(age*ast)/(platelets*albumin)",m:["age","ast","platelets","albumin"],d:"Alternative fibrosis score"},
  {id:"liver_nafld_f",name:"NAFLD Fibrosis Score",cat:"Liver",f:"-1.675+0.037*age+0.094*bmi+1.13*ifg+0.99*(ast/alt)-0.013*platelets-0.66*albumin",m:["age","bmi","glucose_status","ast","alt","platelets","albumin"],d:"Non-invasive fatty liver fibrosis"},
  {id:"liver_steatosis",name:"Hepatic Steatosis Index",cat:"Liver",f:"8*alt/ast+bmi+tg+glucose",m:["alt","ast","bmi","tg","glucose"],d:"Fatty liver estimate"},
  {id:"liver_lfi",name:"Liver Fat Index",cat:"Liver",f:"10.43+0.13*bmi+0.3*tg+0.5*ggt",m:["bmi","tg","ggt"],d:"Hepatic fat load"},
  {id:"liver_alt_ggt",name:"ALT/GGT Ratio",cat:"Liver",f:"alt/ggt",m:["alt","ggt"],d:"Liver dysfunction pattern"},

  // Renal
  {id:"renal_bun_cr",name:"BUN/Creatinine Ratio",cat:"Renal",f:"bun/creatinine",m:["bun","creatinine"],d:"Hydration and renal function"},
  {id:"renal_cysc_cr",name:"CystatinC/Creatinine Ratio",cat:"Renal",f:"cystatin_c/creatinine",m:["cystatin_c","creatinine"],d:"Kidney sensitivity index"},
  {id:"renal_urea_cr",name:"Urea/Creatinine Ratio",cat:"Renal",f:"urea/creatinine",m:["urea","creatinine"],d:"Hydration and catabolic balance"},
  {id:"urine_acr",name:"Albumin/Creatinine Ratio",cat:"Urine",f:"u_albumin/u_creatinine",m:["u_albumin","u_creatinine"],d:"Kidney damage marker"},
  {id:"renal_ca_cr",name:"Urine Ca/Creatinine Ratio",cat:"Renal",f:"u_ca/u_creatinine",m:["u_ca","u_creatinine"],d:"Hypercalciuria screen"},
  {id:"renal_na_k",name:"Urine Na/K Ratio",cat:"Renal",f:"u_na/u_k",m:["u_na","u_k"],d:"Sodium-potassium balance"},

  // Inflammation
  {id:"infl_nlr",name:"NLR",cat:"Inflammation",f:"neut/lymph",m:["neut","lymph"],d:"Inflammatory stress"},
  {id:"infl_plr",name:"PLR",cat:"Inflammation",f:"plt/lymph",m:["plt","lymph"],d:"Inflammation prognosis"},
  {id:"infl_mlr",name:"MLR",cat:"Inflammation",f:"mono/lymph",m:["mono","lymph"],d:"Inflammatory balance"},
  {id:"infl_sii",name:"SII",cat:"Inflammation",f:"(plt*neut)/lymph",m:["plt","neut","lymph"],d:"Systemic immune-inflammation index"},
  {id:"infl_siri",name:"SIRI",cat:"Inflammation",f:"(neut*mono)/lymph",m:["neut","mono","lymph"],d:"Alternative inflammation index"},
  {id:"infl_lmr",name:"LMR",cat:"Inflammation",f:"lymph/mono",m:["lymph","mono"],d:"Immune suppression risk"},
  {id:"infl_crp_alb",name:"CRP/Albumin",cat:"Inflammation",f:"crp/alb",m:["crp","alb"],d:"Inflammation severity"},
  {id:"infl_esr_crp",name:"ESR/CRP Ratio",cat:"Inflammation",f:"esr/crp",m:["esr","crp"],d:"Chronic inflammation ratio"},

  // Iron & Hematology
  {id:"iron_tsat",name:"Transferrin Saturation",cat:"Iron",f:"(iron/tibc)*100",m:["iron","tibc"],d:"Iron status"},
  {id:"iron_ferr_tsat",name:"Ferritin/TSAT Ratio",cat:"Iron",f:"ferritin/tsat",m:["ferritin","tsat"],d:"Differentiates anemia types"},
  {id:"iron_ret_he",name:"Ret-He",cat:"Iron",f:"ret_he",m:["ret_he"],d:"Current iron availability"},
  {id:"hema_rdw_plt",name:"RDW/Platelet Ratio",cat:"Hematology",f:"rdw/plt",m:["rdw","plt"],d:"Inflammation and anemia marker"},
  {id:"hema_mpv_plt",name:"MPV/Platelet Ratio",cat:"Hematology",f:"mpv/plt",m:["mpv","plt"],d:"Platelet activation indicator"},

  // Vitamins & Nutrition
  {id:"vit_d_ca",name:"VitD/Calcium Ratio",cat:"Vitamins",f:"vitd/ca",m:["vitd","ca"],d:"Vitamin D adequacy vs calcium"},
  {id:"vit_b12_hcy",name:"B12/Homocysteine",cat:"Vitamins",f:"b12/hcy",m:["b12","hcy"],d:"Methylation efficiency"},
  {id:"fatty_omega3",name:"Omega-3 Index",cat:"Nutrition",f:"(epa+dpa+dha)*100/total_fatty_acids",m:["epa","dpa","dha","total_fatty_acids"],d:"Cardioprotective index"},
  {id:"fatty_epa_aa",name:"EPA/AA Ratio",cat:"Nutrition",f:"epa/aa",m:["epa","aa"],d:"Inflammation balance"},
  {id:"fatty_n6_n3",name:"n-6/n-3 Ratio",cat:"Nutrition",f:"n6/n3",m:["n6","n3"],d:"Inflammatory lipid balance"},
  {id:"min_zn_cu",name:"Zn/Cu Ratio",cat:"Trace",f:"zn/cu",m:["zn","cu"],d:"Oxidative balance"},
  {id:"min_mg_k",name:"Mg/K Ratio",cat:"Electrolyte",f:"mg/k",m:["mg","k"],d:"Neuromuscular stability"},
  {id:"ele_na_k",name:"Na/K Ratio",cat:"Electrolyte",f:"na/k",m:["na","k"],d:"BP regulation"},
  {id:"ele_na_cl",name:"Na/Cl Ratio",cat:"Electrolyte",f:"na/cl",m:["na","cl"],d:"Acid-base balance"},

  // Oxidative Stress
  {id:"oxid_ua_cr",name:"Uric Acid/Creatinine",cat:"Oxidative",f:"ua/creatinine",m:["ua","creatinine"],d:"Purine metabolism and kidney link"},
  {id:"oxid_gsh_gssg",name:"GSH/GSSG",cat:"Oxidative",f:"gsh/gssg",m:["gsh","gssg"],d:"Cellular redox status"},
  {id:"oxid_index",name:"Oxidative Stress Index",cat:"Oxidative",f:"mda/antiox_cap",m:["mda","antiox_cap"],d:"Systemic oxidative balance"},

  // Body Composition
  {id:"body_bmi",name:"BMI",cat:"Body",f:"w/(h^2)",m:["w","h"],d:"Mass/height index"},
  {id:"body_whr",name:"WHR",cat:"Body",f:"waist/hip",m:["waist","hip"],d:"Central adiposity"},
  {id:"body_whtr",name:"WHtR",cat:"Body",f:"waist/h",m:["waist","h"],d:"Cardiometabolic risk"},
  {id:"body_ffmi",name:"FFMI",cat:"Body",f:"lean_mass/(h^2)",m:["lean_mass","h"],d:"Lean mass normalized"},
  {id:"body_fmi",name:"FMI",cat:"Body",f:"fat_mass/(h^2)",m:["fat_mass","h"],d:"Fat mass normalized"},
  {id:"body_lfr",name:"Lean/Fat Ratio",cat:"Body",f:"lean_mass/fat_mass",m:["lean_mass","fat_mass"],d:"Muscle vs fat balance"},
  {id:"body_mqi",name:"Muscle Quality Index",cat:"Body",f:"strength/lean_mass",m:["strength","lean_mass"],d:"Muscle efficiency"},
  {id:"body_smi",name:"Skeletal Muscle Index",cat:"Body",f:"skeletal_muscle_mass/(h^2)",m:["skeletal_muscle_mass","h"],d:"Sarcopenia screening"},
  {id:"body_phase",name:"Phase Angle",cat:"Body",f:"atan(xc/r)*180/pi",m:["xc","r"],d:"Cellular integrity marker"},
  {id:"body_prot_min",name:"Protein/Mineral Ratio",cat:"Body",f:"protein/mineral",m:["protein","mineral"],d:"Tissue quality indicator"},

  // Performance
  {id:"met_bmr_eff",name:"BMR Efficiency",cat:"Metabolic",f:"bmr/lean_mass",m:["bmr","lean_mass"],d:"Metabolic output per kg lean mass"},
  {id:"perf_ex_eff",name:"Exercise Efficiency",cat:"Performance",f:"exercise_kcal/exercise_time",m:["exercise_kcal","exercise_time"],d:"Training intensity"},
  {id:"perf_hrv",name:"HRV Index",cat:"Performance",f:"rmssd_or_sdnn",m:["hrv"],d:"Autonomic balance"},
  {id:"perf_recovery",name:"Recovery HR Index",cat:"Performance",f:"(hr_peak-hr_1min)/hr_peak",m:["hr_peak","hr_1min"],d:"Cardiovascular recovery"},
  {id:"perf_vo2_bmi",name:"VO2max/BMI",cat:"Performance",f:"vo2max/bmi",m:["vo2max","bmi"],d:"Normalized aerobic capacity"},

  // Hormones
  {id:"horm_fai",name:"Free Androgen Index",cat:"Hormone",f:"(testo/shbg)*100",m:["testo","shbg"],d:"Free testosterone estimate"},
  {id:"horm_fbi",name:"Bioavailable Testosterone Index",cat:"Hormone",f:"testo*(1-shbg_binding)/100",m:["testo","shbg"],d:"Active testosterone fraction"},
  {id:"horm_t_e_ratio",name:"Testosterone/Estradiol",cat:"Hormone",f:"testo/e2",m:["testo","e2"],d:"Androgen-estrogen balance"},
  {id:"horm_ft3_rt3",name:"FT3/RT3 Ratio",cat:"Thyroid",f:"ft3/rt3",m:["ft3","rt3"],d:"Thyroid conversion efficiency"},
  {id:"thyr_t3_t4",name:"T3/T4 Ratio",cat:"Thyroid",f:"ft3/ft4",m:["ft3","ft4"],d:"Conversion efficiency"},
  {id:"thyr_tsh_index",name:"TSH Index",cat:"Thyroid",f:"log(tsh)+0.1345*ft4",m:["tsh","ft4"],d:"Pituitary-thyroid feedback"},
  {id:"horm_cort_dhea",name:"Cortisol/DHEA",cat:"Stress",f:"cortisol/dhea",m:["cortisol","dhea"],d:"Stress balance"},
  {id:"horm_dhea_t",name:"DHEA/Testosterone",cat:"Stress",f:"dhea/testo",m:["dhea","testo"],d:"Anabolic reserve"},
  {id:"horm_cort_acth",name:"Cortisol/ACTH",cat:"Stress",f:"cortisol/acth",m:["cortisol","acth"],d:"HPA axis responsiveness"},
  {id:"horm_car",name:"Cortisol Awakening Response",cat:"Stress",f:"cort_30min/cort_baseline",m:["cort_30min","cort_baseline"],d:"Morning stress adaptation"}
]
