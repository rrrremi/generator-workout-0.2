'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scale, Upload, Plus, Calendar, TrendingUp, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Measurement {
  id: string
  metric: string
  value: number
  unit: string
  measured_at: string
  source: string
  confidence?: number
  notes?: string
}

interface GroupedMeasurements {
  date: string
  measurements: Measurement[]
}

export default function MeasurementsPage() {
  const router = useRouter()
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMeasurements()
  }, [])

  const fetchMeasurements = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      setMeasurements(data || [])
    } catch (err: any) {
      console.error('Error fetching measurements:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Group measurements by date
  const groupedMeasurements = measurements.reduce((groups: GroupedMeasurements[], measurement) => {
    const date = new Date(measurement.measured_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const existingGroup = groups.find(g => g.date === date)
    if (existingGroup) {
      existingGroup.measurements.push(measurement)
    } else {
      groups.push({ date, measurements: [measurement] })
    }

    return groups
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-fuchsia-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-2 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {/* Title Container */}
        <div className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-2xl">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl opacity-50" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="h-5 w-5 text-white/90" />
                  <h1 className="text-xl font-semibold tracking-tight">Your Measurements</h1>
                </div>
                <p className="text-xs text-white/70">Track your body composition progress</p>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Link href="/protected/measurements/manual">
                  <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/15 transition-colors">
                    <Edit className="h-3.5 w-3.5" />
                    Manual Entry
                  </button>
                </Link>
                <Link href="/protected/measurements/upload">
                  <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 backdrop-blur-xl hover:bg-emerald-500/30 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Report
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && measurements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-2xl text-center"
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl opacity-30" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl opacity-30" />
            
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Scale className="h-8 w-8 text-white/60" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Measurements Yet</h3>
              <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
                Start tracking your body composition by uploading an InBody report or entering measurements manually.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/protected/measurements/manual">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-colors">
                    <Edit className="h-4 w-4" />
                    Manual Entry
                  </button>
                </Link>
                <Link href="/protected/measurements/upload">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Report
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Measurements List */}
        {groupedMeasurements.length > 0 && (
          <div className="space-y-4">
            {groupedMeasurements.map((group, groupIndex) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: groupIndex * 0.05 }}
                className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-2xl"
              >
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <h3 className="text-sm font-medium text-white/90">{group.date}</h3>
                  <span className="ml-auto text-xs text-white/50">
                    {group.measurements.length} measurement{group.measurements.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Measurements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {group.measurements.map((measurement) => (
                    <div
                      key={measurement.id}
                      className="rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="text-xs text-white/50 mb-1 capitalize">
                        {measurement.metric.replace(/_/g, ' ')}
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {measurement.value}
                        <span className="text-sm text-white/60 ml-1">{measurement.unit}</span>
                      </div>
                      {measurement.source === 'ocr' && measurement.confidence && (
                        <div className="text-xs text-white/40 mt-1">
                          {Math.round(measurement.confidence * 100)}% confidence
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Source Badge */}
                <div className="mt-3 pt-2 border-t border-white/5">
                  <span className="text-xs text-white/40">
                    Source: {group.measurements[0].source === 'ocr' ? '📸 OCR Extraction' : '✍️ Manual Entry'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}
