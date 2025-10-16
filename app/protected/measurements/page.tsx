'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scale, Upload, Plus } from 'lucide-react'
import { useMeasurementsSummary } from '@/hooks/useMeasurementsSummary'
import { MetricCard } from '@/components/measurements/MetricCard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function MeasurementsPageContent() {
  const { data, isLoading, error } = useMeasurementsSummary()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-3xl px-2 pb-10">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          Error loading measurements. Please try again.
        </div>
      </section>
    )
  }

  const hasMetrics = data?.metrics && data.metrics.length > 0

  return (
    <section className="mx-auto w-full max-w-3xl px-2 pb-10">
      {/* Action Buttons */}
      <div className="mb-2 flex items-center justify-between relative z-10">
        <div></div>
        <div className="flex items-center gap-1.5">
          <Link href="/protected/measurements/upload">
            <button className="flex items-center gap-1 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
          </Link>
          <Link href="/protected/measurements/manual">
            <button className="flex items-center gap-1 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Manual
            </button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Title */}
        <div className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-white/70" />
              <div>
                <h1 className="text-xl font-semibold">Your Measurements</h1>
                <p className="text-xs text-white/70">Track your body composition and health metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!hasMetrics && (
          <div className="rounded-lg border border-transparent bg-white/5 p-8 text-center backdrop-blur-2xl">
            <Scale className="h-12 w-12 mx-auto text-white/30 mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No measurements yet</h3>
            <p className="text-sm text-white/60 mb-4">
              Upload an InBody report or add measurements manually to get started
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        {hasMetrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60">
                {data.metrics.length} {data.metrics.length === 1 ? 'metric' : 'metrics'} tracked
              </p>
              {data.query_time_ms && (
                <p className="text-xs text-white/40">
                  Loaded in {data.query_time_ms}ms
                </p>
              )}
            </div>
            
            <div className="grid gap-3">
              {data.metrics.map((metric) => (
                <MetricCard key={metric.metric} metric={metric} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  )
}

export default function MeasurementsPage() {
  return (
    <ErrorBoundary>
      <MeasurementsPageContent />
    </ErrorBoundary>
  )
}
    