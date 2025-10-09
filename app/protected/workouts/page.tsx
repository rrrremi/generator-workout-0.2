'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Dumbbell, Sparkles, Target, Clock, BarChart3, Trash2, AlertCircle, Search, Filter, ChevronDown, ChevronUp, X, ArrowUpDown } from 'lucide-react'
import DeleteWorkoutModal from '@/components/workout/DeleteWorkoutModal'
import WorkoutRatingDisplay from '@/components/workout/WorkoutRatingDisplay'

interface Workout {
  id: string
  name: string | null
  created_at: string
  total_duration_minutes: number
  muscle_focus: string[] | string | null
  workout_focus: string[] | string | null
  workout_data: {
    exercises: unknown[]
  }
  target_date: string | null
  status: 'new' | 'target' | 'missed' | 'completed' | null
  rating?: number | null
}

export default function WorkoutsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])
  const [selectedFocus, setSelectedFocus] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [sortField, setSortField] = useState<'target_date' | 'created_at' | 'name'>('target_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const supabase = createClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        setIsAdmin(!!profileData?.is_admin)
        await fetchWorkouts(user.id)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router, sortField, sortDirection])

  const fetchWorkouts = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('workouts')
        .select('id, name, created_at, total_duration_minutes, muscle_focus, workout_focus, workout_data, target_date, status, rating')
        .eq('user_id', userId)

      if (sortField === 'name') {
        query = query.order('name', { ascending: sortDirection === 'asc' }).order('created_at', { ascending: false })
      } else if (sortField === 'target_date') {
        query = query
          .order('target_date', { ascending: sortDirection === 'asc', nullsFirst: sortDirection === 'asc' })
          .order('created_at', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: sortDirection === 'asc' })
      }

      const { data, error } = await query

      if (error) throw error
      if (data) {
        setWorkouts(data as Workout[])
      }
    } catch (err) {
      console.error('Error fetching workouts:', err)
      setError('Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (id: string) => {
    setDeleteTargetId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return

    try {
      setIsDeleting(true)
      const { error } = await supabase.from('workouts').delete().eq('id', deleteTargetId)
      if (error) throw error

      if (user?.id) {
        await fetchWorkouts(user.id)
      }
    } catch (err) {
      console.error('Error deleting workout:', err)
      alert('Failed to delete workout')
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setDeleteTargetId(null)
    }
  }

  const parseFocusValues = (value: Workout['workout_focus']) => {
    if (!value) return [] as string[]

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .map((item) => item.trim())
        .filter(Boolean)
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return []

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => (typeof item === 'string' ? item : String(item)))
              .map((item) => item.trim())
              .filter(Boolean)
          }
        } catch (error) {
          // swallow and fall back to comma split handling below
        }
      }

      return trimmed
        .split(',')
        .map((item) => item.replace(/["']/g, '').trim())
        .filter(Boolean)
    }

    return [] as string[]
  }

  const parseMuscleValues = (value: Workout['muscle_focus']) => {
    if (!value) return [] as string[]

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .map((item) => item.trim())
        .filter(Boolean)
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return []

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => (typeof item === 'string' ? item : String(item)))
              .map((item) => item.trim())
              .filter(Boolean)
          }
        } catch (error) {
          // swallow and fall back to comma split handling below
        }
      }

      return trimmed
        .split(',')
        .map((item) => item.replace(/["']/g, '').trim())
        .filter(Boolean)
    }

    return [] as string[]
  }
  
  // Predefined muscle and focus options
  const muscleOptions = [
    { id: 'neck', label: 'Neck' },
    { id: 'back', label: 'Back' },
    { id: 'biceps', label: 'Biceps' },
    { id: 'triceps', label: 'Triceps' },
    { id: 'forearms', label: 'Forearms' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'chest', label: 'Chest' },
    { id: 'core', label: 'Core' },
    { id: 'quads', label: 'Quads' },
    { id: 'glutes', label: 'Glutes' },
    { id: 'hamstrings', label: 'Hamstrings' },
    { id: 'calves', label: 'Calves' },
    { id: 'full_body', label: 'Full Body' }
  ]
  const focusOptions = [
    { id: 'cardio', label: 'Cardio' },
    { id: 'hypertrophy', label: 'Hypertrophy' },
    { id: 'isolation', label: 'Isolation' },
    { id: 'isometric', label: 'Isometric' },
    { id: 'plyometric', label: 'Plyometric' },
    { id: 'stability', label: 'Stability' },
    { id: 'strength', label: 'Strength' },
    { id: 'mobility', label: 'Mobility' }
  ]
  
  const statusOptions = [
    { id: 'new', label: 'New' },
    { id: 'target', label: 'Target' },
    { id: 'missed', label: 'Missed' },
    { id: 'completed', label: 'Completed' }
  ]
  // Filter workouts based on search term and selected filters
  const filteredWorkouts = useMemo(() => {
    const filtered = workouts.filter(workout => {
      // Filter by search term
      const name = workout.name || `Workout ${new Date(workout.created_at).toLocaleDateString()}`
      const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filter by selected muscles
      const workoutMuscles = parseMuscleValues(workout.muscle_focus).map(m => m.toLowerCase())
      const matchesMuscles = selectedMuscles.length === 0 || 
        selectedMuscles.some(selected => workoutMuscles.includes(selected.toLowerCase()))
      
      // Filter by selected focus
      const workoutFocus = parseFocusValues(workout.workout_focus).map(f => f.toLowerCase())
      const matchesFocus = selectedFocus.length === 0 || 
        selectedFocus.some(selected => workoutFocus.includes(selected.toLowerCase()))
      
      const matchesStatus = selectedStatuses.length === 0 || (workout.status ? selectedStatuses.includes(workout.status) : selectedStatuses.includes('new'))
      return matchesSearch && matchesMuscles && matchesFocus && matchesStatus
    })
    return filtered.sort((a, b) => {
      const directionMultiplier = sortDirection === 'asc' ? 1 : -1
      const compareCreated = () => {
        const createdA = new Date(a.created_at).getTime()
        const createdB = new Date(b.created_at).getTime()
        if (createdA === createdB) {
          const nameA = (a.name || '').toLowerCase()
          const nameB = (b.name || '').toLowerCase()
          return nameA.localeCompare(nameB) * directionMultiplier
        }
        return (createdA - createdB) * directionMultiplier
      }

      if (sortField === 'name') {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        if (nameA === nameB) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return nameA.localeCompare(nameB) * directionMultiplier
      }

      if (sortField === 'target_date') {
        const dateA = a.target_date ? new Date(a.target_date).getTime() : null
        const dateB = b.target_date ? new Date(b.target_date).getTime() : null

        if (dateA === null && dateB === null) {
          return compareCreated()
        }

        if (dateA === null) return 1
        if (dateB === null) return -1

        if (dateA === dateB) {
          return compareCreated()
        }

        return (dateA - dateB) * directionMultiplier
      }

      // sortField === 'created_at'
      return compareCreated()
    })
  }, [workouts, searchTerm, selectedMuscles, selectedFocus, selectedStatuses, sortField, sortDirection])

  const handleSortChange = (field: 'target_date' | 'created_at' | 'name') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDirection(field === 'name' ? 'asc' : 'desc')
  }
  
  const toggleMuscleFilter = (muscleId: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscleId) 
        ? prev.filter(id => id !== muscleId)
        : [...prev, muscleId]
    )
  }
  
  const toggleFocusFilter = (focusId: string) => {
    setSelectedFocus(prev => 
      prev.includes(focusId) 
        ? prev.filter(id => id !== focusId)
        : [...prev, focusId]
    )
  }

  const toggleStatusFilter = (statusId: string) => {
    setSelectedStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId]
    )
  }
  
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedMuscles([])
    setSelectedFocus([])
    setSelectedStatuses([])
  }
  
  const hasActiveFilters = searchTerm || selectedMuscles.length > 0 || selectedFocus.length > 0 || selectedStatuses.length > 0

  const renderStatusBadge = (status: Workout['status'], targetDate: string | null) => {
    const labelMap: Record<string, string> = {
      new: 'New',
      target: 'Target',
      missed: 'Missed',
      completed: 'Completed'
    }
    const colorMap: Record<string, string> = {
      new: 'bg-white/10 text-white/80 border-transparent',
      target: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
      missed: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
      completed: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const effectiveStatus = status || (targetDate ? (new Date(targetDate).getTime() >= today.getTime() ? 'target' : 'missed') : 'new')

    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center justify-center ${colorMap[effectiveStatus] || 'bg-white/10 text-white/70 border-transparent'}`}>
        {labelMap[effectiveStatus] || 'New'}
      </span>
    )
  }

  if (loading && workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <svg className="animate-spin h-5 w-5 text-white mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xs text-white/70">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Link href="/protected/workouts/generate">
          <button className="h-10 px-4 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-lg hover:bg-white/20 transition-all group">
            <Sparkles className="h-4 w-4 text-white/90 mr-1.5" strokeWidth={1.5} />
            <span className="text-white/90 text-xs font-light hidden sm:inline">Generate</span>
          </button>
        </Link>
      </div>

      <section className="mx-auto mt-6 w-full max-w-3xl px-2 sm:px-3 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-2xl">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl opacity-50" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl opacity-50" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Your Workouts
                  </h1>
                  <p className="mt-0.5 text-xs text-white/70">
                    View and manage your workout history
                  </p>
                </div>

                <Link href="/protected/workouts/generate">
                  <button className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-light text-white/90 hover:bg-white/20 transition-colors">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                    New
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-2 border-b border-transparent">
              <div className="flex items-center justify-between">
                {/* Search and Filter Controls */}
                {workouts.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search"
                        className="w-28 rounded-md border border-white/20 bg-white/10 py-1 pl-6 pr-2 text-xs font-light text-white/90 placeholder-white/40 focus:border-white/40 focus:outline-none backdrop-blur-xl"
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
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <span className="font-light">Sort by</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSortChange('target_date')}
                          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-light transition-colors ${
                            sortField === 'target_date'
                              ? 'border-white/40 bg-white/20 text-white/90'
                              : 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                          Target Date
                        </button>
                        <button
                          onClick={() => handleSortChange('created_at')}
                          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-light transition-colors ${
                            sortField === 'created_at'
                              ? 'border-white/40 bg-white/20 text-white/90'
                              : 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                          Created
                        </button>
                        <button
                          onClick={() => handleSortChange('name')}
                          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-light transition-colors ${
                            sortField === 'name'
                              ? 'border-white/40 bg-white/20 text-white/90'
                              : 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                          Name
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-2">
              {error && (
                <div className="mb-2 p-2 rounded-lg bg-red-500/20 text-red-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </div>
              )}

              {workouts.length > 0 ? (
                <div>
                  {/* Filter Panel */}
                  {showFilters && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-1 mb-3"
                    >
                      {/* Muscle Focus Filters */}
                      {muscleOptions.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs text-white/70">Muscle Focus</div>
                          <div className="flex flex-wrap gap-1.5">
                            {muscleOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => toggleMuscleFilter(option.id)}
                                className={`rounded-full border border-transparent px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  selectedMuscles.includes(option.id)
                                    ? 'bg-fuchsia-500/20 text-fuchsia-200'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Workout Focus Filters */}
                      {focusOptions.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs text-white/70">Workout Focus</div>
                          <div className="flex flex-wrap gap-1.5">
                            {focusOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => toggleFocusFilter(option.id)}
                                className={`rounded-full border border-transparent px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  selectedFocus.includes(option.id)
                                    ? 'bg-cyan-500/20 text-cyan-200'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {statusOptions.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs text-white/70">Status</div>
                          <div className="flex flex-wrap gap-1.5">
                            {statusOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => toggleStatusFilter(option.id)}
                                className={`rounded-full border border-transparent px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  selectedStatuses.includes(option.id)
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {/* Workouts List */}
                  <div className="h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                    <div className="space-y-1.5 pb-1">
                      {filteredWorkouts.length > 0 ? (
                        filteredWorkouts.map((workout) => {
                          const focusValues = parseFocusValues(workout.workout_focus)
                          const muscleValues = parseMuscleValues(workout.muscle_focus)

                          return (
                            <div
                              key={workout.id}
                              onClick={() => router.push(`/protected/workouts/${workout.id}`)}
                              className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl p-1.5 hover:bg-white/10 transition-all duration-200 focus-ring cursor-pointer"
                            >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-light text-white/90 truncate flex-1">
                                  {workout.name || `Workout ${new Date(workout.created_at).toLocaleDateString()}`}
                                </h3>
                                <WorkoutRatingDisplay rating={workout.rating} />
                                <div className="flex-shrink-0">
                                  {renderStatusBadge(workout.status, workout.target_date)}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-0.5 max-w-[200px] overflow-hidden">
                                {focusValues.slice(0, 2).map((focus, index) => (
                                  <span
                                    key={`${workout.id}-focus-${index}`}
                                    className="text-[9px] font-medium px-1 py-0 rounded-full bg-cyan-500/20 text-cyan-300 capitalize"
                                  >
                                    {focus}
                                  </span>
                                ))}
                                {muscleValues.slice(0, 2).map((muscle, index) => (
                                  <span
                                    key={`${workout.id}-muscle-${index}`}
                                    className="text-[9px] font-medium px-1 py-0 rounded-full bg-fuchsia-500/20 text-fuchsia-200 capitalize"
                                  >
                                    {muscle}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex-shrink-0 flex items-center gap-2 text-[9px] text-white/50">
                              <div className="flex items-center gap-0.5">
                                <Target className="h-2 w-2" />
                                <span>{workout.workout_data.exercises.length}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />
                                <span>{workout.total_duration_minutes}m</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-0.5">
                                <BarChart3 className="h-2 w-2" />
                                <span className="truncate max-w-[80px]">
                                  {muscleValues.slice(0, 2).join(', ')}
                                </span>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="flex-shrink-0 flex items-center">
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openDeleteModal(workout.id)
                                  }}
                                  className="p-1.5 rounded-md hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"
                                  aria-label="Delete workout"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-transparent bg-white/5 p-6 text-center text-white/60">
                          <Dumbbell className="mb-2 h-6 w-6 text-white/30" />
                          <p className="text-sm font-medium">No workouts match your filters</p>
                          <p className="text-xs text-white/40 mt-1">Try adjusting your search or filters</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <Dumbbell className="h-5 w-5 text-white/30" />
                  </div>
                  <h3 className="text-sm font-medium text-white/80 mb-1">No workouts yet</h3>
                  <p className="text-xs text-white/50 max-w-xs mb-3">
                    Generate your first workout
                  </p>
                  <Link href="/protected/workouts/generate">
                    <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-fuchsia-500/20 to-cyan-400/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl hover:bg-white/10 transition-colors">
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Workout
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      <DeleteWorkoutModal
        open={isDeleteModalOpen}
        isDeleting={isDeleting}
        onCancel={() => {
          if (isDeleting) return
          setIsDeleteModalOpen(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}





