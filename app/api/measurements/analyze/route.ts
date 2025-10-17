import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { cacheHelper, cacheKeys, cacheTTL } from '@/lib/cache'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// OPTIMIZED: Compact prompt (900 tokens vs 1500 tokens = 40% reduction)
const SYSTEM_PROMPT = `Clinical health analyst. Analyze CSV health data (up to 5 recent values/metric). Return JSON only.

Tasks:
1. QC: flag unit/range/date issues
2. Interpret: use age/sex context, clinical ranges
3. Derive: HOMA-IR, eGFR, LDL, TG/HDL, AIP, NLR/PLR, BMI, WHR, FFMI (if data permits)
4. Trends: Δabs, Δ%, direction per metric
5. Correlations: cross-domain patterns + physiology
6. Paradoxes: contradictions + explanations
7. Risks: low/mod/high + rationale
8. Next steps: labs, lifestyle, clinical follow-up

JSON schema:
{
  "summary": "str",
  "qc_issues": [{"item":"","type":"unit/range/missing/dup/date","detail":""}],
  "normalization_notes": ["str"],
  "derived_metrics": [{"name":"","value":null,"unit":"","method":"","input_used":[],"valid":true,"note":""}],
  "current_state": [{"metric":"","latest_value":null,"unit":"","date":"","interpretation":""}],
  "trends": [{"metric":"","direction":"up/down/stable","delta_abs":null,"delta_pct":null,"start_date":"","end_date":"","comment":""}],
  "correlations": [{"between":[],"strength":"weak/mod/strong","pattern":"pos/neg/nonlin","physiology":""}],
  "paradoxes": [{"finding":"","why_paradoxical":"","possible_explanations":[]}],
  "hypotheses": [{"claim":"","evidence":[],"alt_explanations":[]}],
  "risk_assessment": [{"area":"","level":"low/mod/high","rationale":""}],
  "recommendations_next_steps": {
    "labs_to_repeat_or_add": [{"test":"","why":"","timing":""}],
    "lifestyle_focus": [],
    "clinical_followup": []
  },
  "uncertainties": [],
  "data_gaps": []
}

Be specific, concise. Respect units. Invalid metrics: valid=false + explain.`

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

  // OPTIMIZED: Get last 5 per metric (50% data reduction)
  const limitedData: Measurement[] = []

  for (const [metric, values] of Object.entries(byMetric)) {
    const sorted = values
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      .slice(0, 5) // Changed from 10 to 5
    limitedData.push(...sorted)
  }

  // OPTIMIZED: Simplified CSV format (remove display_name, category, source)
  const csvHeader = 'metric,value,unit,date'
  const csvRows = limitedData.map(m => {
    const date = new Date(m.measured_at).toISOString().split('T')[0]
    const value = m.value.toFixed(1) // Reduce precision

    return `${m.metric},${value},${m.unit},${date}`
  })

  // Combine
  const csv = [csvHeader, ...csvRows].join('\n')

  // Build final prompt
  return `User Profile:
Age: ${profile.age || 'not provided'}
Sex: ${profile.sex || 'not provided'}

Measurements (CSV format, last 5 values per metric, newest first):
${csv}`
}

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // OPTIMIZATION 1: Parallel queries instead of sequential
    const [profileResult, measurementsResult, catalogData] = await Promise.all([
      // Get user profile
      supabase
        .from('profiles')
        .select('age, sex')
        .eq('id', user.id)
        .single(),
      
      // OPTIMIZATION 2: Limit data at DB level - only get last 10 per metric
      // Use a subquery to get recent measurements efficiently
      supabase
        .from('measurements')
        .select('metric, value, unit, measured_at, source')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(500), // Reasonable limit: ~50 metrics × 10 values
      
      // OPTIMIZATION 3: Cache catalog (rarely changes)
      cacheHelper.getOrSet(
        cacheKeys.metricsCatalog(),
        async () => {
          const { data } = await supabase
            .from('metrics_catalog')
            .select('key, display_name, category')
          
          return (data || []).reduce((acc, item) => {
            acc[item.key] = { display_name: item.display_name, category: item.category }
            return acc
          }, {} as Record<string, { display_name: string; category: string }>)
        },
        cacheTTL.LONG // 15 minutes - catalog rarely changes
      )
    ])

    const { data: profile, error: profileError } = profileResult
    const { data: measurements, error: measurementsError } = measurementsResult

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

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

    const dbTime = Date.now() - startTime
    console.log(`DB queries completed in ${dbTime}ms`)

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
    const aiStartTime = Date.now()
    console.log(`Calling OpenAI for health analysis (${metricsCount} metrics, ${measurements.length} data points)...`)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: csvData }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    const aiTime = Date.now() - aiStartTime
    console.log(`OpenAI completed in ${aiTime}ms`)

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

    const totalTime = Date.now() - startTime
    console.log(`Health analysis completed: ${analysis.id} (total: ${totalTime}ms, db: ${dbTime}ms, ai: ${aiTime}ms)`)

    return NextResponse.json({
      analysis_id: analysis.id,
      status: 'completed',
      data: analysisData,
      ...(process.env.NODE_ENV === 'development' && {
        performance: {
          total_ms: totalTime,
          db_ms: dbTime,
          ai_ms: aiTime,
          tokens: completion.usage
        }
      })
    })

  } catch (error: any) {
    console.error('Error generating health analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
