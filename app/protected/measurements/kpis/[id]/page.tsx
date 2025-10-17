'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Search, Filter } from 'lucide-react'

interface KPI {
  id: string
  name: string
  cat: string
  f: string
  m: string[]
  v?: number
  u?: string
  r?: string
  d: string
}

interface KPIRecord {
  id: string
  created_at: string
  kpis: KPI[]
  metrics_count: number
}

export default function KPIsDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [kpiRecord, setKpiRecord] = useState<KPIRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error: fetchError } = await supabase
          .from('health_kpis')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        console.log('Fetched KPI record:', data)
        console.log('KPIs array:', data?.kpis)
        console.log('KPIs length:', data?.kpis?.length)
        
        setKpiRecord(data as KPIRecord)
      } catch (err: any) {
        console.error('Error fetching KPIs:', err)
        setError(err.message || 'Failed to load KPIs')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchKPIs()
    }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-4xl px-2 pb-10">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      </section>
    )
  }

  if (error || !kpiRecord) {
    return (
      <section className="mx-auto w-full max-w-4xl px-2 pb-10">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error || 'KPIs not found'}</p>
        </div>
      </section>
    )
  }

  // Ensure kpis is an array
  const kpisArray = Array.isArray(kpiRecord.kpis) ? kpiRecord.kpis : []

  // Get unique categories
  const categories = Array.from(new Set(kpisArray.map(k => k.cat))).sort()

  // Filter KPIs
  const filteredKPIs = kpisArray.filter(kpi => {
    const matchesSearch = searchTerm === '' || 
      kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.d.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.cat.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || kpi.cat === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group by category
  const groupedKPIs = filteredKPIs.reduce((acc, kpi) => {
    if (!acc[kpi.cat]) acc[kpi.cat] = []
    acc[kpi.cat].push(kpi)
    return acc
  }, {} as Record<string, KPI[]>)

  return (
    <section className="mx-auto w-full max-w-4xl px-2 pb-10">
      {/* Back Button */}
      <Link href="/protected/measurements">
        <button className="mb-3 flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Measurements
        </button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Header */}
        <div className="rounded-lg border border-transparent bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h1 className="text-lg font-semibold text-white/90">Health KPIs</h1>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span>{new Date(kpiRecord.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{kpisArray.length} KPIs</span>
                <span>•</span>
                <span>{kpiRecord.metrics_count} metrics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search KPIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white/90 placeholder-white/40 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 py-1.5 text-xs text-white/90 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/50">
            Showing {filteredKPIs.length} of {kpisArray.length} KPIs
          </div>
        </div>

        {/* KPIs Grid */}
        {Object.keys(groupedKPIs).length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <p className="text-sm text-white/60">No KPIs match your filters</p>
          </div>
        ) : (
          Object.entries(groupedKPIs).map(([category, kpis]) => (
            <div key={category} className="rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl">
              <h2 className="text-sm font-medium text-white/90 mb-2">{category}</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 transition-colors">
                    <div className="mb-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-medium text-white/90">{kpi.name}</h3>
                        {kpi.v !== undefined && (
                          <span className="text-xs font-semibold text-emerald-400 shrink-0">
                            {kpi.v} {kpi.u || ''}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5">{kpi.d}</p>
                      {kpi.r && (
                        <div className="mt-1 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5">
                          <span className="text-[10px] text-emerald-300 font-medium">Optimal: {kpi.r}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] text-white/40 shrink-0">Formula:</span>
                        <code className="text-[10px] text-cyan-400 font-mono">{kpi.f}</code>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-[10px] text-white/40 shrink-0">Metrics:</span>
                        <span className="text-[10px] text-white/60">{kpi.m.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Disclaimer */}
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 backdrop-blur-xl">
          <p className="text-[10px] text-yellow-300/90 leading-relaxed">
            <strong>⚠️ Important:</strong> These KPIs are AI-generated for informational purposes only. 
            Always consult with a qualified healthcare provider for medical interpretation and advice.
          </p>
        </div>
      </motion.div>
    </section>
  )
}
