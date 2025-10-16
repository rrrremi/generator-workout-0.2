'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scale, Upload, Plus, Search, Filter, ChevronDown, ChevronUp, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useMeasurementsSummary } from '@/hooks/useMeasurementsSummary'
import { MetricCard } from '@/components/measurements/MetricCard'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function MeasurementsPageContent() {
  const { data, isLoading, error } = useMeasurementsSummary()
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortField, setSortField] = useState<'name' | 'value' | 'date'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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
  
  // Define categories based on common measurement types
  const categories = [
    { id: 'body_composition', label: 'Body Composition' },
    { id: 'vital_signs', label: 'Vital Signs' },
    { id: 'strength', label: 'Strength' },
    { id: 'flexibility', label: 'Flexibility' },
    { id: 'other', label: 'Other' }
  ]
  
  // Categorize metrics
  const getCategoryForMetric = (metricName: string): string => {
    const name = metricName.toLowerCase()
    if (name.includes('weight') || name.includes('fat') || name.includes('muscle') || name.includes('bmi') || name.includes('body')) {
      return 'body_composition'
    }
    if (name.includes('blood') || name.includes('heart') || name.includes('pressure') || name.includes('pulse')) {
      return 'vital_signs'
    }
    if (name.includes('strength') || name.includes('lift') || name.includes('max')) {
      return 'strength'
    }
    if (name.includes('flex') || name.includes('stretch') || name.includes('range')) {
      return 'flexibility'
    }
    return 'other'
  }
  
  // Filter and sort metrics
  const filteredAndSortedMetrics = useMemo(() => {
    if (!data?.metrics) return []
    
    let filtered = data.metrics.filter(metric => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        metric.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.metric.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filter by category
      const metricCategory = getCategoryForMetric(metric.metric)
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(metricCategory)
      
      return matchesSearch && matchesCategory
    })
    
    // Sort metrics
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'name') {
        comparison = a.display_name.localeCompare(b.display_name)
      } else if (sortField === 'value') {
        comparison = a.latest_value - b.latest_value
      } else if (sortField === 'date') {
        comparison = new Date(a.latest_date).getTime() - new Date(b.latest_date).getTime()
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [data?.metrics, searchTerm, selectedCategories, sortField, sortDirection])
  
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }
  
  const toggleSort = (field: 'name' | 'value' | 'date') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategories([])
  }
  
  const hasActiveFilters = searchTerm || selectedCategories.length > 0
  
  const SortIcon = ({ field }: { field: 'name' | 'value' | 'date' }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-white/30" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-emerald-400" />
      : <ArrowDown className="h-3 w-3 text-emerald-400" />
  }

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
            {/* Search and Filter Controls */}
            <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl overflow-hidden">
              <div className="p-2 border-b border-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search metrics"
                        className="w-32 rounded-md border border-white/20 bg-white/10 py-1 pl-6 pr-2 text-xs font-light text-white/90 placeholder-white/40 focus:border-white/40 focus:outline-none backdrop-blur-xl"
                      />
                    </div>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearFilters}
                        className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-light text-white/80 hover:bg-white/20 transition-colors"
                      >
                        <X className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-light text-white/80 hover:bg-white/20 transition-colors"
                    >
                      <Filter className="h-3 w-3" strokeWidth={1.5} />
                      <span className="hidden sm:inline">Filter</span>
                      {showFilters ? (
                        <ChevronUp className="h-3 w-3" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  
                  {/* Sort buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-light text-white/80 hover:bg-white/20 transition-colors"
                    >
                      Name
                      <SortIcon field="name" />
                    </button>
                    <button
                      onClick={() => toggleSort('value')}
                      className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-light text-white/80 hover:bg-white/20 transition-colors"
                    >
                      Value
                      <SortIcon field="value" />
                    </button>
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-light text-white/80 hover:bg-white/20 transition-colors"
                    >
                      Date
                      <SortIcon field="date" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Filter Panel */}
              {showFilters && (
                <div className="p-3 border-t border-white/10 bg-white/5">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-white/70 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`px-2 py-1 rounded-md text-xs transition-colors ${
                            selectedCategories.includes(category.id)
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60">
                {filteredAndSortedMetrics.length} of {data.metrics.length} {filteredAndSortedMetrics.length === 1 ? 'metric' : 'metrics'}
              </p>
              {data.query_time_ms && (
                <p className="text-xs text-white/40">
                  Loaded in {data.query_time_ms}ms
                </p>
              )}
            </div>
            
            {/* Metrics list */}
            {filteredAndSortedMetrics.length > 0 ? (
              <div className="grid gap-3">
                {filteredAndSortedMetrics.map((metric) => (
                  <MetricCard key={metric.metric} metric={metric} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-transparent bg-white/5 p-8 text-center backdrop-blur-2xl">
                <Search className="h-12 w-12 mx-auto text-white/30 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">No metrics found</h3>
                <p className="text-sm text-white/60 mb-4">
                  Try adjusting your search or filters
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
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
    