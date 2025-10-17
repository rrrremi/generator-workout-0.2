// Health Analysis Types

export interface QCIssue {
  item: string
  type: 'unit' | 'range' | 'missing' | 'duplicate' | 'date'
  detail: string
}

export interface DerivedMetric {
  name: string
  value: number | null
  unit: string
  method: string
  input_used: string[]
  valid: boolean
  note: string
}

export interface CurrentStateMetric {
  metric: string
  latest_value: number | null
  unit: string
  date: string
  interpretation: string
}

export interface Trend {
  metric: string
  direction: 'up' | 'down' | 'stable'
  delta_abs: number | null
  delta_pct: number | null
  start_date: string
  end_date: string
  comment: string
}

export interface Correlation {
  between: string[]
  strength: 'weak' | 'moderate' | 'strong'
  pattern: 'positive' | 'negative' | 'nonlinear'
  physiology: string
}

export interface Paradox {
  finding: string
  why_paradoxical: string
  possible_explanations: string[]
}

export interface Hypothesis {
  claim: string
  evidence: string[]
  alt_explanations: string[]
}

export interface RiskAssessment {
  area: string
  level: 'low' | 'moderate' | 'high'
  rationale: string
}

export interface LabRecommendation {
  test: string
  why: string
  timing: string
}

export interface RecommendationsNextSteps {
  labs_to_repeat_or_add: LabRecommendation[]
  lifestyle_focus: string[]
  clinical_followup: string[]
}

export interface HealthAnalysisResponse {
  summary: string
  qc_issues: QCIssue[]
  normalization_notes: string[]
  derived_metrics: DerivedMetric[]
  current_state: CurrentStateMetric[]
  trends: Trend[]
  correlations: Correlation[]
  paradoxes: Paradox[]
  hypotheses: Hypothesis[]
  risk_assessment: RiskAssessment[]
  recommendations_next_steps: RecommendationsNextSteps
  uncertainties: string[]
  data_gaps: string[]
}

export interface HealthAnalysis {
  id: string
  user_id: string
  created_at: string
  analysis_date: string
  user_age: number | null
  user_sex: string | null
  measurements_snapshot: string
  metrics_count: number
  date_range_start: string | null
  date_range_end: string | null
  ai_provider: string
  model_version: string
  prompt_tokens: number | null
  completion_tokens: number | null
  total_cost: number | null
  summary: string
  qc_issues: QCIssue[] | null
  normalization_notes: string[] | null
  derived_metrics: DerivedMetric[] | null
  current_state: CurrentStateMetric[] | null
  trends: Trend[] | null
  correlations: Correlation[] | null
  paradoxes: Paradox[] | null
  hypotheses: Hypothesis[] | null
  risk_assessment: RiskAssessment[] | null
  recommendations_next_steps: RecommendationsNextSteps | null
  uncertainties: string[] | null
  data_gaps: string[] | null
  full_response: HealthAnalysisResponse
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
  user_rating: number | null
  user_feedback: string | null
  is_archived: boolean
}
