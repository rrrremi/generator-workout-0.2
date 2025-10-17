import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const SYSTEM_PROMPT = `You are a scientific health data analyst and clinician. You apply physiology and evidence-based medicine across endocrinology, metabolism, renal, hematology, and body composition. You reason rigorously, check units and ranges, and synthesize clear conclusions. Perform internal reasoning but DO NOT reveal it; only return the final structured output.

Analyze the following health dataset provided in CSV format (blood, urine, body composition, vitals). Each metric includes up to 10 most recent measurements, sorted newest first.

Objectives:
1) Quality check: normalize units, flag impossible/out-of-range values, duplicates, missingness, inconsistent dates.
2) Current state: interpret metrics using age/sex-context when possible and common clinical reference ranges.
3) Derived indices (as applicable, data permitting): HOMA-IR, eGFR (CKD-EPI 2021), ACR (albumin/creatinine), LDL (Friedewald if valid), TG/HDL ratio, AIP, NLR/PLR, BMI, WHR, FFM/FFMI.
4) Dynamics: compute direction and magnitude of change over time per metric (Δabsolute, Δ%, earliest→latest in provided data; note seasonality if obvious).
5) Interrelations: identify plausible correlations/dependencies across domains (e.g., glucose–insulin–adiposity, creatinine–eGFR, ferritin–CRP), and explain physiological mechanisms.
6) Paradoxes/inconsistencies: call out contradictions (e.g., low fasting glucose with high insulin) with possible explanations (measurement error, timing, meds, acute illness).
7) Risk and hypotheses: list key risks (low/moderate/high) with concise rationale, plus testable hypotheses.
8) Actionable next steps: which labs to confirm/track, frequency, and practical focus areas. Avoid diagnosis; suggest follow-up, not prescriptions.

If data are insufficient, state exactly what's missing and how it affects certainty.

Output JSON ONLY in this schema:
{
  "summary": "concise plain-language overview",
  "qc_issues": [{"item": "", "type": "unit/range/missing/duplicate/date", "detail": ""}],
  "normalization_notes": ["what you standardized and how"],
  "derived_metrics": [{"name": "", "value": null, "unit": "", "method": "", "input_used": ["..."], "valid": true, "note": ""}],
  "current_state": [{"metric": "", "latest_value": null, "unit": "", "date": "", "interpretation": ""}],
  "trends": [{"metric": "", "direction": "up/down/stable", "delta_abs": null, "delta_pct": null, "start_date": "", "end_date": "", "comment": ""}],
  "correlations": [{"between": ["metricA","metricB"], "strength": "weak/moderate/strong", "pattern": "positive/negative/nonlinear", "physiology": ""}],
  "paradoxes": [{"finding": "", "why_paradoxical": "", "possible_explanations": [""]}],
  "hypotheses": [{"claim": "", "evidence": ["metrics/trends"], "alt_explanations": [""]}],
  "risk_assessment": [{"area": "", "level": "low/moderate/high", "rationale": ""}],
  "recommendations_next_steps": {
    "labs_to_repeat_or_add": [{"test": "", "why": "", "timing": "e.g., 8–12 wks"}],
    "lifestyle_focus": ["brief, practical levers tied to findings"],
    "clinical_followup": ["what to discuss with clinician and why"]
  },
  "uncertainties": ["limits of data/assumptions"],
  "data_gaps": ["exact missing metrics that would improve certainty"]
}

Constraints:
- Be specific and concise. Prefer physiology over generic advice.
- Respect units; convert when needed and document in normalization_notes.
- If a derived metric is invalid (e.g., TG >= 400 mg/dL for Friedewald), set valid=false and explain.
- Do not output any text outside the JSON.`

interface Measurement {
  metric: string
  value: number
  unit: string
  measured_at: string
  source: string
}

function formatMeasurementsAsCSV(
  profile: { age: number | null; sex: string | null },
  measurements: Measurement[],
  catalogData: Record<string, { display_name: string; category: string }>
): string {
  // Group by metric
  const byMetric = measurements.reduce((acc, m) => {
    if (!acc[m.metric]) acc[m.metric] = []
    acc[m.metric].push(m)
    return acc
  }, {} as Record<string, Measurement[]>)

  // Get last 10 per metric, sorted newest first
  const limitedData: Measurement[] = []

  for (const [metric, values] of Object.entries(byMetric)) {
    const sorted = values
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      .slice(0, 10)
    limitedData.push(...sorted)
  }

  // Build CSV
  const csvHeader = 'metric,display_name,category,value,unit,date,source'
  const csvRows = limitedData.map(m => {
    const displayName = catalogData[m.metric]?.display_name || m.metric
    const category = catalogData[m.metric]?.category || 'other'
    const date = new Date(m.measured_at).toISOString().split('T')[0]

    return `${m.metric},${displayName},${category},${m.value},${m.unit},${date},${m.source}`
  })

  // Combine
  const csv = [csvHeader, ...csvRows].join('\n')

  // Build final prompt
  return `User Profile:
Age: ${profile.age || 'not provided'}
Sex: ${profile.sex || 'not provided'}

Measurements (CSV format, last 10 values per metric, newest first):
${csv}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, sex')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Get all measurements
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('metric, value, unit, measured_at, source')
      .eq('user_id', user.id)
      .order('measured_at', { ascending: false })

    if (measurementsError) {
      console.error('Measurements error:', measurementsError)
      return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 })
    }

    // Validate minimum data
    if (!measurements || measurements.length < 5) {
      return NextResponse.json(
        { error: 'Need at least 5 measurements to generate analysis' },
        { status: 400 }
      )
    }

    // Get metrics catalog for display names and categories
    const { data: catalog } = await supabase
      .from('metrics_catalog')
      .select('key, display_name, category')

    const catalogData = (catalog || []).reduce((acc, item) => {
      acc[item.key] = { display_name: item.display_name, category: item.category }
      return acc
    }, {} as Record<string, { display_name: string; category: string }>)

    // Format data as CSV
    const csvData = formatMeasurementsAsCSV(profile, measurements, catalogData)

    // Get date range
    const dates = measurements.map(m => new Date(m.measured_at).getTime())
    const dateRangeStart = new Date(Math.min(...dates)).toISOString()
    const dateRangeEnd = new Date(Math.max(...dates)).toISOString()

    // Count unique metrics
    const uniqueMetrics = new Set(measurements.map(m => m.metric))
    const metricsCount = uniqueMetrics.size

    // Call OpenAI
    console.log('Calling OpenAI for health analysis...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: csvData }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse JSON response
    const analysisData = JSON.parse(responseText)

    // Store in database
    const { data: analysis, error: insertError } = await supabase
      .from('health_analyses')
      .insert({
        user_id: user.id,
        user_age: profile.age,
        user_sex: profile.sex,
        measurements_snapshot: csvData,
        metrics_count: metricsCount,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        ai_provider: 'openai',
        model_version: completion.model,
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
        total_cost: ((completion.usage?.prompt_tokens || 0) * 0.0025 + (completion.usage?.completion_tokens || 0) * 0.01) / 1000,
        summary: analysisData.summary,
        qc_issues: analysisData.qc_issues,
        normalization_notes: analysisData.normalization_notes,
        derived_metrics: analysisData.derived_metrics,
        current_state: analysisData.current_state,
        trends: analysisData.trends,
        correlations: analysisData.correlations,
        paradoxes: analysisData.paradoxes,
        hypotheses: analysisData.hypotheses,
        risk_assessment: analysisData.risk_assessment,
        recommendations_next_steps: analysisData.recommendations_next_steps,
        uncertainties: analysisData.uncertainties,
        data_gaps: analysisData.data_gaps,
        full_response: analysisData,
        status: 'completed'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    console.log('Health analysis completed:', analysis.id)

    return NextResponse.json({
      analysis_id: analysis.id,
      status: 'completed',
      data: analysisData
    })

  } catch (error: any) {
    console.error('Error generating health analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
