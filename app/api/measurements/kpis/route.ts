import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { cacheHelper, cacheKeys, cacheTTL } from '@/lib/cache'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// GET: Fetch user's KPI history
export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch KPIs - optimized query with only needed fields
    const { data: kpis, error: fetchError } = await supabase
      .from('health_kpis')
      .select('id, created_at, metrics_count, kpis')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (fetchError) {
      console.error('KPIs fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
    }

    // Transform for efficient client consumption
    const summary = (kpis || []).map(kpi => ({
      id: kpi.id,
      created_at: kpi.created_at,
      metrics_count: kpi.metrics_count,
      kpi_count: Array.isArray(kpi.kpis) ? kpi.kpis.length : 0,
      categories: Array.isArray(kpi.kpis) 
        ? Array.from(new Set(kpi.kpis.map((k: any) => k.cat))).slice(0, 3)
        : []
    }))

    return NextResponse.json({ kpis: summary })

  } catch (error: any) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

const KPI_PROMPT = `Analyze CSV measurements (LATEST value per metric) and calculate ALL possible health KPIs.

CRITICAL: Calculate the value (v) for each KPI using the formula and provided measurements.

Each KPI object:
- id: Unique snake_case identifier
- name: Display name
- cat: Category (Lipid/Metabolic/Liver/Kidney/Body/Vitamin/Mineral/Electrolyte/Iron/Inflammation/Hormone/Thyroid/Stress)
- f: Formula (compact, use metric keys from CSV)
- m: Array of required metric keys
- v: CALCULATED numeric value (use latest measurements, round to 2 decimals)
- u: Unit (ratio, %, points, level, etc)
- r: Optimal range (e.g., "<4", "18.5-24.9", ">60", "0.5-2.0")
- d: Brief description

Domains & KPI Examples:
Lipid: tc/hdl, tg/hdl, log10(tg/hdl), ldl/hdl, non_hdl, remnant_chol
Metabolic: (gluc*ins)/405, 1/(log(ins)+log(gluc)), ln((tg*gluc)/2), gluc/hba1c
Liver: ast/alt, alt/ast, ggt/alt, alp/alt, ast/plt, fib4
Kidney: egfr, u_alb/u_creat, bun/creat, creat/cystatin_c
Body: w/(h^2), waist/hip, waist/h, lean/(h^2), fat_pct, vat
Vitamin: d/k2, b12/folate, a/e
Mineral: ca/p, mg/ca, k/na
Electrolyte: na/k, cl/na, anion_gap
Iron: (iron/tibc)*100, ferritin/crp, iron/ferritin
Inflammation: neut/lymph, plt/lymph, crp/alb, esr/crp
Hormone: (testo/shbg)*100, e2/testo, prog/e2
Thyroid: ft3/ft4, tsh*ft4, ft3/rt3
Stress: cortisol/dhea, cortisol_am/cortisol_pm

Example output:
[
  {"id":"lipid_tc_hdl","name":"TC/HDL Ratio","cat":"Lipid","f":"tc/hdl","m":["tc","hdl"],"v":4.2,"u":"ratio","r":"<4","d":"CVD risk indicator"},
  {"id":"met_homa_ir","name":"HOMA-IR","cat":"Metabolic","f":"(glucose*insulin)/405","m":["glucose","insulin"],"v":2.8,"u":"index","r":"<2.5","d":"Insulin resistance"},
  {"id":"body_bmi","name":"BMI","cat":"Body","f":"weight/(height^2)","m":["weight","height"],"v":24.5,"u":"kg/m²","r":"18.5-24.9","d":"Body mass index"}
]

Instructions:
1. CSV contains LATEST value for each metric
2. Calculate v using the formula f with provided values
3. Include ALL calculable KPIs across all domains
4. If required metrics missing, skip that KPI
5. Return ONLY JSON array, no markdown`

interface Measurement {
  metric: string
  value: number
  unit: string
  measured_at: string
}

function formatMeasurementsAsCSV(
  measurements: Measurement[],
  catalogData: Record<string, { display_name: string; category: string }>
): string {
  // Group by metric and get ONLY the latest measurement per metric
  const byMetric = measurements.reduce((acc, m) => {
    if (!acc[m.metric]) acc[m.metric] = []
    acc[m.metric].push(m)
    return acc
  }, {} as Record<string, Measurement[]>)

  // Get ONLY the latest measurement per metric
  const limitedData: Measurement[] = []

  for (const [metric, values] of Object.entries(byMetric)) {
    const latest = values
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      [0] // Take only the first (latest) measurement
    limitedData.push(latest)
  }

  // Build CSV
  const csvHeader = 'metric,value,unit,date'
  const csvRows = limitedData.map(m => {
    const date = new Date(m.measured_at).toISOString().split('T')[0]
    const value = m.value.toFixed(1)
    return `${m.metric},${value},${m.unit},${date}`
  })

  const csv = [csvHeader, ...csvRows].join('\n')

  return `Latest Measurements (one per metric):\n${csv}`
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

    // Parallel queries
    const [measurementsResult, catalogData] = await Promise.all([
      supabase
        .from('measurements')
        .select('metric, value, unit, measured_at')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(500),
      
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
        cacheTTL.LONG
      )
    ])

    const { data: measurements, error: measurementsError } = measurementsResult

    if (measurementsError) {
      console.error('Measurements error:', measurementsError)
      return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 })
    }

    // Validate minimum data
    if (!measurements || measurements.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 measurements to generate KPIs' },
        { status: 400 }
      )
    }

    const dbTime = Date.now() - startTime
    console.log(`DB queries completed in ${dbTime}ms`)

    // Format data as CSV
    const csvData = formatMeasurementsAsCSV(measurements, catalogData)

    // Count unique metrics
    const uniqueMetrics = new Set(measurements.map(m => m.metric))
    const metricsCount = uniqueMetrics.size

    // Call OpenAI
    const aiStartTime = Date.now()
    console.log(`Calling OpenAI for KPIs generation (${metricsCount} metrics)...`)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: KPI_PROMPT },
        { role: 'user', content: csvData }
      ],
      temperature: 0.2
      // Note: Removed response_format to allow JSON array response
    })
    
    const aiTime = Date.now() - aiStartTime
    console.log(`OpenAI completed in ${aiTime}ms`)

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    console.log('Raw OpenAI response:', responseText.substring(0, 500))

    // Parse JSON response (strip markdown code blocks if present)
    let cleanContent = responseText.trim()
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, '')
      cleanContent = cleanContent.replace(/\n?```\s*$/, '')
    }

    const kpisData = JSON.parse(cleanContent)
    
    // Extract KPIs array (handle both {kpis: [...]} and direct array)
    const kpisArray = Array.isArray(kpisData) ? kpisData : (kpisData.kpis || kpisData.indicators || [])
    
    console.log(`Extracted ${kpisArray.length} KPIs`)

    // Store in database
    const { data: kpiRecord, error: insertError } = await supabase
      .from('health_kpis')
      .insert({
        user_id: user.id,
        measurements_snapshot: csvData,
        metrics_count: metricsCount,
        kpis: kpisArray,
        ai_provider: 'openai',
        model_version: completion.model,
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
        total_cost: ((completion.usage?.prompt_tokens || 0) * 0.0025 + (completion.usage?.completion_tokens || 0) * 0.01) / 1000,
        status: 'completed'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save KPIs' }, { status: 500 })
    }

    const totalTime = Date.now() - startTime
    console.log(`KPIs generation completed: ${kpiRecord.id} (total: ${totalTime}ms, db: ${dbTime}ms, ai: ${aiTime}ms)`)

    return NextResponse.json({
      kpi_id: kpiRecord.id,
      status: 'completed',
      kpis: kpisArray,
      count: kpisArray.length,
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
    console.error('Error generating KPIs:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
