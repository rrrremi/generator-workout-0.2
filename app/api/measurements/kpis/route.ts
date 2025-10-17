import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { cacheHelper, cacheKeys, cacheTTL } from '@/lib/cache'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const KPI_PROMPT = `Generate 80+ derived health KPIs from CSV data. Return JSON array only.

Each KPI: {id, name, cat, f, m, d}
- id: short_snake_case
- name: Display name
- cat: Category (Lipid/Metabolic/Liver/Kidney/Body/Vitamin/Mineral/Electrolyte/Iron/Inflammation/Hormone/Thyroid/Stress)
- f: Formula (compact, use metric keys)
- m: Array of required metric keys
- d: Brief description (<50 chars)

Domains & Examples:
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

Include all calculable KPIs from available metrics. Use actual metric keys from CSV.`

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
  // Group by metric
  const byMetric = measurements.reduce((acc, m) => {
    if (!acc[m.metric]) acc[m.metric] = []
    acc[m.metric].push(m)
    return acc
  }, {} as Record<string, Measurement[]>)

  // Get last 5 per metric
  const limitedData: Measurement[] = []

  for (const [metric, values] of Object.entries(byMetric)) {
    const sorted = values
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      .slice(0, 5)
    limitedData.push(...sorted)
  }

  // Build CSV
  const csvHeader = 'metric,value,unit,date'
  const csvRows = limitedData.map(m => {
    const date = new Date(m.measured_at).toISOString().split('T')[0]
    const value = m.value.toFixed(1)
    return `${m.metric},${value},${m.unit},${date}`
  })

  const csv = [csvHeader, ...csvRows].join('\n')

  return `Available Measurements:\n${csv}`
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
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
    
    const aiTime = Date.now() - aiStartTime
    console.log(`OpenAI completed in ${aiTime}ms`)

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse JSON response
    const kpisData = JSON.parse(responseText)
    
    // Extract KPIs array (handle both {kpis: [...]} and direct array)
    const kpisArray = Array.isArray(kpisData) ? kpisData : (kpisData.kpis || kpisData.indicators || [])

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
