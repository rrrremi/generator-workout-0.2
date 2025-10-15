'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, Calendar, TrendingUp, Edit2, Trash2, Save, X } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkline } from '@/components/measurements/Sparkline'
import { MEASUREMENTS_QUERY_OPTIONS } from '@/lib/react-query-config'

interface Measurement {
  id: string
  value: number
  unit: string
  measured_at: string
  source: string
  confidence: number | null
  notes: string | null
  created_at: string
}

interface MetricDetailResponse {
  metric: string
  display_name: string
  measurements: Measurement[]
  query_time_ms: number
}

type SortField = 'date' | 'value'
type SortDirection = 'asc' | 'desc'

export default function MetricDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const metric = params.metric as string
  
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<MetricDetailResponse>({
    queryKey: ['measurements', 'detail', metric],
    queryFn: async () => {
      const response = await fetch(`/api/measurements/metric/${metric}`)
      if (!response.ok) throw new Error('Failed to fetch metric detail')
      return response.json()
    },
    ...MEASUREMENTS_QUERY_OPTIONS,
  })

  // Sort measurements
  const sortedMeasurements = useMemo(() => {
    if (!data?.measurements) return []
    
    const sorted = [...data.measurements]
    sorted.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'date') {
        comparison = new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
      } else {
        comparison = a.value - b.value
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [data?.measurements, sortField, sortDirection])

  // Prepare sparkline data
  const sparklineData = useMemo(() => {
    if (!data?.measurements) return []
    return data.measurements
      .map(m => ({ value: m.value, date: m.measured_at }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data?.measurements])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const startEdit = (measurement: Measurement) => {
    setEditingId(measurement.id)
    setEditValue(measurement.value.toString())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          value: parseFloat(editValue),
          unit: data?.measurements.find(m => m.id === id)?.unit
        })
      })

      if (!response.ok) throw new Error('Failed to update')

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['measurements', 'detail', metric] })
      queryClient.invalidateQueries({ queryKey: ['measurements', 'summary'] })
      
      setEditingId(null)
      setEditValue('')
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update measurement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement?')) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['measurements', 'detail', metric] })
      queryClient.invalidateQueries({ queryKey: ['measurements', 'summary'] })
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete measurement')
    } finally {
      setDeleting(null)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-white/30" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-emerald-400" />
      : <ArrowDown className="h-3 w-3 text-emerald-400" />
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <section className="mx-auto w-full max-w-3xl px-2 pb-10">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          Error loading measurement details. Please try again.
        </div>
      </section>
    )
  }

  const latestMeasurement = sortedMeasurements[0]
  const stats = {
    count: data.measurements.length,
    latest: latestMeasurement?.value,
    min: Math.min(...data.measurements.map(m => m.value)),
    max: Math.max(...data.measurements.map(m => m.value)),
    avg: data.measurements.reduce((sum, m) => sum + m.value, 0) / data.measurements.length
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-2 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/protected/measurements">
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">{data.display_name}</h1>
                <p className="text-xs text-white/70">{stats.count} measurements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sparkline Card */}
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-white/60" />
            <h2 className="text-sm font-medium text-white/90">Trend</h2>
          </div>
          
          <div className="h-32 mb-4">
            <Sparkline 
              data={sparklineData} 
              color="#fff" 
              unit={latestMeasurement?.unit || ''}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-xs text-white/50">Latest</p>
              <p className="text-sm font-semibold text-white">{stats.latest?.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Average</p>
              <p className="text-sm font-semibold text-white">{stats.avg.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Min</p>
              <p className="text-sm font-semibold text-white">{stats.min.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Max</p>
              <p className="text-sm font-semibold text-white">{stats.max.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Measurements List */}
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-2xl">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <h2 className="text-sm font-medium text-white/90">All Measurements</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-xs font-medium text-white/70">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Date
                      <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-white/70">
                    <button
                      onClick={() => handleSort('value')}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Value
                      <SortIcon field="value" />
                    </button>
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-white/70">Source</th>
                  <th className="text-right p-3 text-xs font-medium text-white/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMeasurements.map((measurement, index) => (
                  <tr 
                    key={measurement.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-sm text-white/90">
                      {new Date(measurement.measured_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3">
                      {editingId === measurement.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 rounded bg-white/10 px-2 py-1 text-xs text-white focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                            autoFocus
                          />
                          <span className="text-xs text-white/60">{measurement.unit}</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-white">
                            {measurement.value.toFixed(1)}
                          </span>
                          <span className="text-xs text-white/60 ml-1">
                            {measurement.unit}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {measurement.source === 'ocr' ? (
                        <span className="text-emerald-400">
                          📸 OCR {measurement.confidence && `(${Math.round(measurement.confidence * 100)}%)`}
                        </span>
                      ) : (
                        <span className="text-blue-400">✍️ Manual</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingId === measurement.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleUpdate(measurement.id)}
                            className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Save"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded hover:bg-white/10 text-white/60 transition-colors"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(measurement)}
                            className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(measurement.id)}
                            disabled={deleting === measurement.id}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === measurement.id ? (
                              <div className="animate-spin h-3.5 w-3.5 border-2 border-red-400 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
