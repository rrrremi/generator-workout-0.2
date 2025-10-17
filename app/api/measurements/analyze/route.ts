import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { cacheHelper, cacheKeys, cacheTTL } from '@/lib/cache'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// ULTRA-OPTIMIZED: Minimal prompt (600 tokens vs 1500 tokens = 60% reduction)
const SYSTEM_PROMPT = `Clinician-analyst. CSV + pre-calculated KPIs in; JSON out only.

Do: QC (unit/range/date/miss/dup) → interpret (age/sex refs) → use pre-calculated KPIs when available → derive additional metrics if needed → trends (Δabs,Δ%,dir) → relations (cross-domain + physiology) → paradoxes (with explanations) → risks (low/mod/high + why) → next steps (labs,lifestyle,clinical).

Schema:
{
  "sum": "",
  "qc": [{"item":"","type":"unit/range/miss/dup/date","detail":""}],
  "norm": [""],
  "drv": [{"name":"","val":null,"unit":"","meth":"","inputs":[],"ok":true,"note":""}],
  "state": [{"metric":"","val":null,"unit":"","date":"","interp":""}],
  "tr": [{"metric":"","dir":"up/down/stable","d_abs":null,"d_pct":null,"start":"","end":"","cmt":""}],
  "rel": [{"between":[],"strength":"weak/mod/strong","pattern":"pos/neg/nonlin","phys":""}],
  "px": [{"finding":"","why":"","expl":[]}],
  "hyp": [{"claim":"","ev":[],"alt":[]}],
  "risk": [{"area":"","lvl":"low/mod/high","why":""}],
  "next": {
    "labs": [{"test":"","why":"","when":""}],
    "life": [],
    "clinic": []
  },
  "unc": [],
  "gaps": []
}

Rules: concise; respect units; if derived invalid set ok=false with note.`

// Map abbreviated response to full schema
function mapAbbreviatedResponse(abbreviated: any): any {
  return {
    summary: abbreviated.sum || '',
    qc_issues: (abbreviated.qc || []).map((item: any) => ({
      item: item.item || '',
      type: item.type || '',
      detail: item.detail || ''
    })),
    normalization_notes: abbreviated.norm || [],
    derived_metrics: (abbreviated.drv || []).map((item: any) => ({
      name: item.name || '',
      value: item.val,
      unit: item.unit || '',
      method: item.meth || '',
      input_used: item.inputs || [],
      valid: item.ok !== false,
      note: item.note || ''
    })),
    current_state: (abbreviated.state || []).map((item: any) => ({
      metric: item.metric || '',
      latest_value: item.val,
      unit: item.unit || '',
      date: item.date || '',
      interpretation: item.interp || ''
    })),
    trends: (abbreviated.tr || []).map((item: any) => ({
      metric: item.metric || '',
      direction: item.dir || '',
      delta_abs: item.d_abs,
      delta_pct: item.d_pct,
      start_date: item.start || '',
      end_date: item.end || '',
      comment: item.cmt || ''
    })),
    correlations: (abbreviated.rel || []).map((item: any) => ({
      between: item.between || [],
      strength: item.strength || '',
      pattern: item.pattern || '',
      physiology: item.phys || ''
    })),
    paradoxes: (abbreviated.px || []).map((item: any) => ({
      finding: item.finding || '',
      why_paradoxical: item.why || '',
      possible_explanations: item.expl || []
    })),
    hypotheses: (abbreviated.hyp || []).map((item: any) => ({
      claim: item.claim || '',
      evidence: item.ev || [],
      alt_explanations: item.alt || []
    })),
    risk_assessment: (abbreviated.risk || []).map((item: any) => ({
      area: item.area || '',
      level: item.lvl || '',
      rationale: typeof item.why === 'string' ? item.why : (item.why?.rationale || item.rationale || '')
    })),
    recommendations_next_steps: {
      labs_to_repeat_or_add: (abbreviated.next?.labs || []).map((item: any) => ({
        test: item.test || '',
        why: typeof item.why === 'string' ? item.why : '',
        timing: item.when || ''
      })),
      lifestyle_focus: (abbreviated.next?.life || []).map((item: any) => 
        typeof item === 'string' ? item : (item.text || item.action || JSON.stringify(item))
      ),
      clinical_followup: (abbreviated.next?.clinic || []).map((item: any) => 
        typeof item === 'string' ? item : (item.text || item.action || JSON.stringify(item))
      )
    },
    uncertainties: abbreviated.unc || [],
    data_gaps: abbreviated.gaps || []
  }
}

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

    // Fetch latest KPIs if available
    const { data: latestKPIs } = await supabase
      .from('health_kpis')
      .select('kpis, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let kpisData = ''
    if (latestKPIs && latestKPIs.kpis && Array.isArray(latestKPIs.kpis)) {
      const kpisFormatted = latestKPIs.kpis
        .map((kpi: any) => `${kpi.name}: ${kpi.v} ${kpi.u || ''} (optimal: ${kpi.r || 'N/A'})`)
        .join('\n')
      kpisData = `\n\nDerived KPIs (pre-calculated):\n${kpisFormatted}`
      console.log(`Including ${latestKPIs.kpis.length} pre-calculated KPIs in analysis`)
    }

    // Call OpenAI
    const aiStartTime = Date.now()
    console.log(`Calling OpenAI for health analysis (${metricsCount} metrics, ${measurements.length} data points)...`)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: csvData + kpisData }
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
    const abbreviatedData = JSON.parse(responseText)
    
    // Map abbreviated response to full schema
    const analysisData = mapAbbreviatedResponse(abbreviatedData)

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
