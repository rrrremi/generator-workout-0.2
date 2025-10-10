'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Dumbbell, Sparkles, Play, Target, BarChart3, Clock, Calendar, Trash2, ArrowLeft, RefreshCw, Info, Zap, Activity, Pencil, Plus, Copy, Check, X, GripVertical } from 'lucide-react'
import InlineEdit from '@/components/ui/InlineEdit'
import ExerciseVideoButton from '@/components/workout/ExerciseVideoButton'
import { SkeletonWorkoutDetail } from '@/components/ui/Skeleton'
import { Workout } from '@/types/workout'
import DeleteWorkoutModal from '@/components/workout/DeleteWorkoutModal'
import DeleteExerciseModal from '@/components/workout/DeleteExerciseModal'
import WorkoutRating from '@/components/workout/WorkoutRating'
import ExercisePicker from '@/components/workout/ExercisePicker'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const WORKOUT_FOCUS_OPTIONS = [
  { id: 'hypertrophy', label: 'Hypertrophy' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'isolation', label: 'Isolation' },
  { id: 'stability', label: 'Stability' },
  { id: 'plyometric', label: 'Plyometric' },
  { id: 'isometric', label: 'Isometric' },
  { id: 'mobility', label: 'Mobility' }
]

const normalizeWorkoutFocus = (value: unknown): string[] => {
  const normalized = new Set<string>()

  const pushValue = (raw: unknown) => {
    if (raw === null || raw === undefined) return
    const cleaned = String(raw).replace(/["]/g, '').trim().toLowerCase()
    if (cleaned) {
      normalized.add(cleaned)
    }
  }

  if (value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    value.forEach(pushValue)
  } else if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          parsed.forEach(pushValue)
        } else {
          pushValue(parsed)
        }
      } catch {
        trimmed.split(',').forEach(pushValue)
      }
    } else {
      trimmed.split(',').forEach(pushValue)
    }
  }

  return Array.from(normalized)
}

// Sortable Exercise Item Component
function SortableExerciseItem({
  exercise,
  index,
  isCompleted,
  selectedExerciseIndex,
  totalExercises,
  onExerciseClick,
  onExerciseKeyDown,
  onDeleteClick,
}: {
  exercise: any
  index: number
  isCompleted: boolean
  selectedExerciseIndex: number | null
  totalExercises: number
  onExerciseClick: (index: number, e: React.MouseEvent) => void
  onExerciseKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  onDeleteClick: (index: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `exercise-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      aria-pressed={isCompleted}
      onClick={(e) => onExerciseClick(index, e)}
      onKeyDown={(event) => onExerciseKeyDown(event, index)}
      initial={{ opacity: 0, x: -5 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        x: 0,
        scale: isCompleted ? 1.01 : 1
      }}
      transition={{ delay: 0.05 + index * 0.03 }}
      className={`relative rounded-md border p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 cursor-pointer ${
        isCompleted
          ? 'border-emerald-400/40 bg-emerald-400/10'
          : 'border-transparent bg-white/5 hover:bg-white/10'
      } ${selectedExerciseIndex === index ? 'ring-2 ring-white/20' : ''} ${isDragging ? 'z-50 shadow-2xl' : ''}`}
    >
      <div className="flex items-center">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mr-2 cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-white/40 hover:text-white/60 transition-colors" />
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-light text-white/70">
            {index + 1}
          </div>
          <h4 className={`text-xs font-light ${isCompleted ? 'text-emerald-100' : 'text-white/90'}`}>
            {exercise.name}
          </h4>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] ml-3 ${isCompleted ? 'text-emerald-100/80' : 'text-white/70'}`}>
          <span className="text-white/60">Sets:</span>
          <span className="font-medium text-white/90">{exercise.sets}</span>
          <span className="ml-1 text-white/60">Reps:</span>
          <span className="font-medium text-white/90">{exercise.reps}</span>
          <span className="ml-1 text-white/60">Rest:</span>
          <span className="font-medium text-white/90">{exercise.rest_time_seconds}s</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ExerciseVideoButton exerciseName={exercise.name} size="small" variant="subtle" />
          </div>
          
          {/* Delete button - appears on click (hidden if last exercise) */}
          {totalExercises > 1 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ 
                opacity: selectedExerciseIndex === index ? 1 : 0,
                scale: selectedExerciseIndex === index ? 1 : 0.8,
                x: selectedExerciseIndex === index ? 0 : 10
              }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClick(index)
              }}
              className={`p-1 rounded-md hover:bg-red-500/20 text-red-400 transition-colors ${
                selectedExerciseIndex === index ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {exercise.rationale && (
        <div
          className={`mt-2 rounded-md border p-1.5 ${
            isCompleted
              ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100'
              : 'border-transparent bg-white/5 text-white/80'
          }`}
        >
          <div className="flex items-center gap-1 text-[9px] mb-0.5 uppercase tracking-wider">
            <Info className="h-2.5 w-2.5" />
            Tips
          </div>
          <p className="text-[10px] leading-snug line-clamp-2">{exercise.rationale}</p>
        </div>
      )}
    </motion.div>
  )
}

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSavingTargetDate, setIsSavingTargetDate] = useState(false)
  const [targetDateError, setTargetDateError] = useState<string | null>(null)
  const [isEditingFocus, setIsEditingFocus] = useState(false)
  const [selectedFocusIds, setSelectedFocusIds] = useState<string[]>([])
  const [isSavingFocus, setIsSavingFocus] = useState(false)
  const [focusError, setFocusError] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Record<number, { id: string; completed: boolean }>>({})
  const [completionLoaded, setCompletionLoaded] = useState(false)
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null)
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<{ index: number; workoutExerciseId: string; name: string } | null>(null)
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false)
  const [isDeletingExercise, setIsDeletingExercise] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [copyWorkoutName, setCopyWorkoutName] = useState('')
  const [isCopying, setIsCopying] = useState(false)
  const [clickTimestamps, setClickTimestamps] = useState<Record<number, number>>({})
  const [isReordering, setIsReordering] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const goBack = () => {
    router.push('/protected/workouts')
  }

  const refreshCompletionState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('id, order_index, completed')
        .eq('workout_id', params.id)
        .order('order_index')

      if (error) {
        console.error('Failed to load exercise completion state:', error)
        return
      }

      if (!data || data.length === 0) {
        setCompletedExercises({})
        return
      }

      const hasZeroIndex = data.some(row => typeof row.order_index === 'number' && row.order_index === 0)
      const stateMap: Record<number, { id: string; completed: boolean }> = {}

      data.forEach(row => {
        if (typeof row.order_index !== 'number') {
          return
        }

        const normalizedIndex = hasZeroIndex ? row.order_index : row.order_index - 1

        if (normalizedIndex < 0) {
          return
        }

        stateMap[normalizedIndex] = {
          id: row.id,
          completed: row.completed ?? false
        }
      })

      setCompletedExercises(stateMap)
      setCompletionLoaded(true)
    } catch (stateError) {
      console.error('Unexpected error loading completion state:', stateError)
      setCompletionLoaded(true)
    }
  }, [params.id, supabase])

  const recomputeWorkoutStatus = useCallback(async () => {
    try {
      const { data: exerciseRows, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('completed')
        .eq('workout_id', params.id)

      if (exerciseError) {
        console.error('Failed to evaluate workout completion state:', exerciseError)
        return
      }

      if (!exerciseRows) {
        return
      }

      const { data: workoutRow, error: workoutError } = await supabase
        .from('workouts')
        .select('status, target_date')
        .eq('id', params.id)
        .single()

      if (workoutError || !workoutRow) {
        if (workoutError) {
          console.error('Failed to load workout for status recompute:', workoutError)
        }
        return
      }

      const allCompleted = exerciseRows.length > 0 && exerciseRows.every(row => row.completed)

      let desiredStatus: Workout['status'] = workoutRow.status as Workout['status']
      let completedAt: string | null | undefined = undefined

      if (allCompleted) {
        desiredStatus = 'completed'
        completedAt = new Date().toISOString()
      } else {
        if (!workoutRow.target_date) {
          desiredStatus = 'new'
        } else {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const targetDate = new Date(workoutRow.target_date)
          targetDate.setHours(0, 0, 0, 0)
          desiredStatus = targetDate.getTime() >= today.getTime() ? 'target' : 'missed'
        }
        completedAt = null
      }

      if (desiredStatus === workoutRow.status) {
        return
      }

      const { data: updatedWorkout, error: updateError } = await supabase
        .from('workouts')
        .update({
          status: desiredStatus,
          completed_at: completedAt
        })
        .eq('id', params.id)
        .select('*')
        .single()

      if (updateError) {
        throw updateError
      }

      if (updatedWorkout) {
        setWorkout(updatedWorkout as Workout)
      }
    } catch (statusError: any) {
      console.error('Error updating workout status based on exercises:', statusError)
      setError(statusError.message || 'Failed to update workout status')
      setTimeout(() => setError(null), 3000)
    }
  }, [params.id, supabase])

  const handleUpdateName = async (newName: string) => {
    try {
      setIsSavingName(true);
      setNameError(null);
      
      const response = await fetch(`/api/workouts/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          name: newName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update workout name');
      }
      
      // Update local state with the new workout data
      setWorkout(data.workout);
      setIsEditingName(false);
      
    } catch (error) {
      console.error('Error updating workout name:', error);
      setNameError(error instanceof Error ? error.message : 'Failed to update workout name');
    } finally {
      setIsSavingName(false);
    }
  }

  const handleUpdateTargetDate = useCallback(async (newDate: string | null) => {
    try {
      setIsSavingTargetDate(true)
      setTargetDateError(null)

      const response = await fetch(`/api/workouts/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          target_date: newDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update target date')
      }

      setWorkout(data.workout)
    } catch (error) {
      setTargetDateError(error instanceof Error ? error.message : 'Failed to update target date')
    } finally {
      setIsSavingTargetDate(false)
    }
  }, [params.id])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      // Use the API endpoint instead of direct Supabase access
      const response = await fetch(`/api/workouts/delete?id=${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete workout');
      }

      // First navigate to the workouts list page
      router.push('/protected/workouts')

      // Add a small delay before refreshing to ensure navigation completes
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error) {
      console.error('Error deleting workout:', error)
      setError(error instanceof Error ? error.message : 'Error deleting workout')
      setIsDeleting(false)

      // Show error for 3 seconds, then allow retry
      setTimeout(() => {
        setError(null)
      }, 3000)
    }
  }

  useEffect(() => {
    refreshCompletionState()
  }, [refreshCompletionState])

  useEffect(() => {
    if (workout) {
      setSelectedFocusIds(normalizeWorkoutFocus(workout.workout_focus))
    }
  }, [workout])

  const focusOptions = useMemo(() => WORKOUT_FOCUS_OPTIONS, [])

  const handleFocusToggle = useCallback((id: string) => {
    setSelectedFocusIds((prev) => {
      const alreadySelected = prev.includes(id)
      if (alreadySelected) {
        const next = prev.filter((focusId) => focusId !== id)
        setFocusError(null)
        return next
      }

      if (prev.length >= 3) {
        setFocusError('You can select up to 3 focus types')
        return prev
      }

      setFocusError(null)
      return [...prev, id]
    })
  }, [])

  const handleUpdateFocus = useCallback(async () => {
    if (!workout) return

    if (selectedFocusIds.length === 0) {
      setFocusError('Select at least one focus type')
      return
    }

    try {
      setIsSavingFocus(true)
      setFocusError(null)

      const response = await fetch('/api/workouts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workout.id,
          workout_focus: selectedFocusIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update focus')
      }

      setWorkout(data.workout)
      setIsEditingFocus(false)
    } catch (updateError: any) {
      console.error('Error updating focus:', updateError)
      setFocusError(updateError.message || 'Failed to update focus')
    } finally {
      setIsSavingFocus(false)
    }
  }, [selectedFocusIds, workout])

  // Handle exercise click - detect single click vs double-tap
  const handleExerciseClick = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    
    const now = Date.now()
    const lastClick = clickTimestamps[index] || 0
    const timeDiff = now - lastClick
    
    // Double-tap detection (within 710ms)
    if (timeDiff <= 710 && timeDiff > 0) {
      // Double-tap detected - toggle completion
      toggleExerciseCompletion(index)
      // Clear timestamp
      setClickTimestamps(prev => ({ ...prev, [index]: 0 }))
    } else {
      // Single click - show/hide delete button
      if (selectedExerciseIndex === index) {
        // Clicking same exercise - hide delete button
        setSelectedExerciseIndex(null)
      } else {
        // Clicking different exercise - show delete button
        setSelectedExerciseIndex(index)
      }
      // Store timestamp for double-tap detection
      setClickTimestamps(prev => ({ ...prev, [index]: now }))
    }
  }, [clickTimestamps, selectedExerciseIndex])

  const toggleExerciseCompletion = useCallback(async (index: number) => {
    if (!completionLoaded) {
      return
    }

    const currentEntry = completedExercises[index]

    if (!currentEntry) {
      console.warn(`No workout_exercises row found for order_index ${index}`)
      return
    }

    const nextCompleted = !currentEntry.completed

    setCompletedExercises(prev => ({
      ...prev,
      [index]: { ...prev[index], completed: nextCompleted }
    }))

    const { error: updateError } = await supabase
      .from('workout_exercises')
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null
      })
      .eq('id', currentEntry.id)
      .eq('workout_id', params.id)

    if (updateError) {
      console.error('Failed to update exercise completion state:', updateError)
      setCompletedExercises(prev => ({
        ...prev,
        [index]: { ...prev[index], completed: !nextCompleted }
      }))
      setError(updateError.message || 'Failed to update exercise status')
      setTimeout(() => setError(null), 3000)
      return
    }

    await refreshCompletionState()
    await recomputeWorkoutStatus()
  }, [completedExercises, completionLoaded, params.id, recomputeWorkoutStatus, refreshCompletionState, supabase])

  const handleExerciseKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExerciseCompletion(index)
    }
  }, [toggleExerciseCompletion])

  // Click outside to hide delete button
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedExerciseIndex(null)
    }
    
    if (selectedExerciseIndex !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [selectedExerciseIndex])

  const handleDeleteExerciseClick = useCallback(async (index: number) => {
    // Prevent deleting the last exercise
    if (workout?.workout_data.exercises.length === 1) {
      setError('Cannot delete the last exercise. A workout must have at least one exercise.')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    let workoutExerciseId = completedExercises[index]?.id
    const exerciseName = workout?.workout_data.exercises[index]?.name
    
    // If workoutExerciseId is not in completedExercises, fetch it from the database
    if (!workoutExerciseId) {
      try {
        // Fetch all workout_exercises for this workout and find by order_index
        const { data, error } = await supabase
          .from('workout_exercises')
          .select('id, order_index')
          .eq('workout_id', params.id)
          .order('order_index')
        
        if (error || !data) {
          console.error('Failed to fetch workout_exercises:', error)
          setError('Unable to delete exercise. Please refresh the page and try again.')
          setTimeout(() => setError(null), 3000)
          return
        }
        
        // Find the exercise with matching order_index
        const exerciseRow = data.find(row => row.order_index === index)
        
        if (!exerciseRow) {
          console.error('No workout_exercise found with order_index:', index, 'Available:', data)
          setError('Unable to delete exercise. Please refresh the page and try again.')
          setTimeout(() => setError(null), 3000)
          return
        }
        
        workoutExerciseId = exerciseRow.id
      } catch (err) {
        console.error('Error fetching workout_exercise ID:', err)
        setError('Unable to delete exercise. Please refresh the page and try again.')
        setTimeout(() => setError(null), 3000)
        return
      }
    }
    
    if (!workoutExerciseId || !exerciseName) {
      console.error('Missing data for delete:', { index, workoutExerciseId, exerciseName, completedExercises })
      setError('Unable to delete exercise. Please refresh the page and try again.')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    setDeleteExerciseTarget({ index, workoutExerciseId, name: exerciseName })
    setShowDeleteExerciseModal(true)
  }, [completedExercises, workout, params.id, supabase])

  const handleDeleteExerciseConfirm = useCallback(async () => {
    if (!deleteExerciseTarget || !workout) return
    
    setIsDeletingExercise(true)
    
    // Optimistic update
    const updatedExercises = workout.workout_data.exercises.filter((_, i) => i !== deleteExerciseTarget.index)
    const optimisticWorkout = {
      ...workout,
      workout_data: {
        ...workout.workout_data,
        exercises: updatedExercises
      }
    }
    setWorkout(optimisticWorkout)
    
    try {
      const response = await fetch('/api/workouts/exercises/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          workoutExerciseId: deleteExerciseTarget.workoutExerciseId,
          exerciseIndex: deleteExerciseTarget.index
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete exercise')
      }
      
      // Replace with server response
      setWorkout(data.workout)
      
      // Refresh completion state
      await refreshCompletionState()
      await recomputeWorkoutStatus()
      
    } catch (err) {
      console.error('Error deleting exercise:', err)
      // Rollback on error
      setWorkout(workout)
      setError(err instanceof Error ? err.message : 'Failed to delete exercise')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsDeletingExercise(false)
      setShowDeleteExerciseModal(false)
      setDeleteExerciseTarget(null)
    }
  }, [deleteExerciseTarget, workout, refreshCompletionState, recomputeWorkoutStatus])

  const handleExerciseAdded = useCallback(async () => {
    // Refresh workout data after adding exercise
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setWorkout(data)
      await refreshCompletionState()
      await recomputeWorkoutStatus()
    } catch (error) {
      console.error('Error refreshing workout:', error)
      setError('Failed to refresh workout')
      setTimeout(() => setError(null), 3000)
    }
  }, [params.id, refreshCompletionState, recomputeWorkoutStatus, supabase])

  const handleRegenerate = useCallback(() => {
    if (!workout) return
    
    // Extract exercise names to exclude
    const excludeExercises = workout.workout_data.exercises.map(ex => ex.name)
    
    // Extract workout parameters
    const muscleFocus = workout.muscle_focus || []
    const workoutFocus = workout.workout_focus || ['hypertrophy']
    const exerciseCount = workout.workout_data.exercises.length
    
    // Build query params for generate page
    const params = new URLSearchParams({
      muscleFocus: JSON.stringify(muscleFocus),
      workoutFocus: JSON.stringify(workoutFocus),
      exerciseCount: exerciseCount.toString(),
      excludeExercises: JSON.stringify(excludeExercises),
      regenerate: 'true'
    })
    
    // Navigate to generate page with params
    router.push(`/protected/workouts/generate?${params.toString()}`)
  }, [workout, router])

  const handleCopyClick = useCallback(() => {
    if (!workout) return
    setCopyWorkoutName(`${workout.name} (Copy)`)
    setShowCopyModal(true)
  }, [workout])

  const handleCopyConfirm = useCallback(async () => {
    if (!workout || !copyWorkoutName.trim()) return
    
    setIsCopying(true)
    
    try {
      const response = await fetch('/api/workouts/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          newName: copyWorkoutName.trim()
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to copy workout')
      }
      
      // Navigate to the new workout
      router.push(`/protected/workouts/${data.workout.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error copying workout:', err)
      setError(err instanceof Error ? err.message : 'Failed to copy workout')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsCopying(false)
      setShowCopyModal(false)
    }
  }, [workout, copyWorkoutName, router])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id || !workout) return
    
    const oldIndex = workout.workout_data.exercises.findIndex((_, i) => `exercise-${i}` === active.id)
    const newIndex = workout.workout_data.exercises.findIndex((_, i) => `exercise-${i}` === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    // Optimistic update
    const newExercises = arrayMove(workout.workout_data.exercises, oldIndex, newIndex)
    const optimisticWorkout = {
      ...workout,
      workout_data: {
        ...workout.workout_data,
        exercises: newExercises
      }
    }
    setWorkout(optimisticWorkout)
    setIsReordering(true)
    
    try {
      // Get the reordered exercise IDs
      const reorderedExerciseIds = newExercises.map((_, index) => {
        const originalIndex = workout.workout_data.exercises.findIndex(ex => ex.name === newExercises[index].name)
        return completedExercises[originalIndex]?.id
      }).filter(Boolean)
      
      const response = await fetch('/api/workouts/exercises/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          exerciseIds: reorderedExerciseIds
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reorder exercises')
      }
      
      // Refresh completion state with new order
      await refreshCompletionState()
    } catch (err) {
      console.error('Error reordering exercises:', err)
      // Rollback on error
      setWorkout(workout)
      setError(err instanceof Error ? err.message : 'Failed to reorder exercises')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsReordering(false)
    }
  }, [workout, completedExercises, refreshCompletionState])

  useEffect(() => {
    async function fetchWorkout() {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setWorkout(data as unknown as Workout)
        } else {
          setError('Workout not found')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred while fetching the workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [params.id, supabase])

  if (loading) {
    return (
      <>
        {/* Main Content with Back Button */}
        <section className="mx-auto w-full max-w-3xl px-2 pb-10">
          {/* Back button positioned like in Profile view */}
          <div className="mb-2 relative z-10">
            <Link href="/protected/workouts">
              <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </Link>
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <svg className="animate-spin h-5 w-5 text-white mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs text-white/70">Loading...</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Main Content with Back Button */}
      <section className="mx-auto w-full max-w-3xl px-2 pb-10">
        {/* Back button and actions */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 relative z-10">
          <Link href="/protected/workouts">
            <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyClick}
              className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
              Copy
            </button>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Regenerate
            </button>
            <Link href="/protected/workouts/generate">
              <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                New
              </button>
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-500/50 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
              aria-label="Delete workout"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >

          {/* Header Section - more compact */}
          <div className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-2xl">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-50" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-50" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-2">
                  {isEditingName ? (
                    <div className="mb-1">
                      <InlineEdit
                        value={workout?.name || `Workout ${new Date(workout?.created_at || '').toLocaleDateString()}`}
                        onChange={handleUpdateName}
                        onCancel={() => setIsEditingName(false)}
                        placeholder="Enter workout name..."
                        maxLength={50}
                      />
                      {nameError && (
                        <div className="text-[10px] text-red-400 mt-0.5">{nameError}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <h1 className="text-xl font-semibold tracking-tight">
                        {workout?.name || `Workout ${new Date(workout?.created_at || '').toLocaleDateString()}`}
                      </h1>
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="ml-2 p-1 rounded-md hover:bg-white/10 text-white/60 transition-colors"
                        title="Edit workout name"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="mt-0.5 text-xs text-white/70">Review your personalized workout</p>
                </div>
                
              </div>

              {error && (
                <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300 backdrop-blur-xl">
                  {error}
                </div>
              )}
            </div>
          </div>

          {workout && (
            <>
              {/* Workout Overview */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between p-2 border-b border-transparent">
                    <h3 className="text-xs text-white/90 flex items-center">
                      <Target className="h-3.5 w-3.5 mr-1" />
                      Overview
                    </h3>
                    <WorkoutRating
                      workoutId={workout.id}
                      initialRating={workout.rating}
                      onRatingChange={(rating) => {
                        setWorkout({ ...workout, rating })
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <div className="grid gap-2 grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <Clock className="h-3 w-3" />
                          Duration
                        </div>
                        <span className="text-xs font-medium text-white/90">{workout.total_duration_minutes}m</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <BarChart3 className="h-3 w-3" />
                          Exercises
                        </div>
                        <span className="text-xs font-medium text-white/90">{workout.workout_data.exercises.length}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <Calendar className="h-3 w-3" />
                          Target Date
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            className="w-full rounded-md bg-black/20 border border-transparent px-2 py-1 text-xs text-white/90 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                            value={workout.target_date ?? ''}
                            onChange={(e) => handleUpdateTargetDate(e.target.value ? e.target.value : null)}
                            disabled={isSavingTargetDate}
                          />
                          {isSavingTargetDate && <RefreshCw className="h-3 w-3 animate-spin text-white/70" />}
                        </div>
                        <div className="text-[10px] text-white/60">
                          {workout.target_date
                            ? `Planned for ${new Date(workout.target_date).toLocaleDateString()}`
                            : 'No target date set'}
                        </div>
                        {targetDateError && (
                          <div className="text-[10px] text-red-400">{targetDateError}</div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 text-xs text-white/70">
                            <Target className="h-3 w-3" />
                            Focus
                          </div>
                          {!isEditingFocus && (
                            <button
                              onClick={() => {
                                setSelectedFocusIds(normalizeWorkoutFocus(workout.workout_focus))
                                setIsEditingFocus(true)
                              }}
                              className="p-1 rounded-md text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
                              title="Edit focus"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {isEditingFocus ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {focusOptions.map((option) => {
                                const active = selectedFocusIds.includes(option.id)
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => handleFocusToggle(option.id)}
                                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition-colors border ${
                                      active
                                        ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100'
                                        : 'border-transparent bg-white/10 text-white/60 hover:bg-white/15'
                                    }`}
                                  >
                                    {option.label}
                                    {active && <Check className="h-2.5 w-2.5" />}
                                  </button>
                                )
                              })}
                            </div>
                            {focusError && (
                              <div className="text-[10px] text-red-400">{focusError}</div>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleUpdateFocus}
                                disabled={isSavingFocus}
                                className="flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-[10px] text-cyan-100 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                              >
                                {isSavingFocus ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFocusIds(normalizeWorkoutFocus(workout.workout_focus))
                                  setFocusError(null)
                                  setIsEditingFocus(false)
                                }}
                                disabled={isSavingFocus}
                                className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/60 hover:bg-white/15 transition-colors disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {normalizeWorkoutFocus(workout.workout_focus).slice(0, 3).map((focus, index) => (
                              <span
                                key={`${focus}-${index}`}
                                className="text-[9px] px-1.5 py-0 rounded-full bg-cyan-500/20 text-cyan-300 capitalize"
                              >
                                {focus}
                              </span>
                            ))}
                            {normalizeWorkoutFocus(workout.workout_focus).length === 0 && (
                              <span className="text-[9px] text-white/50">No focus set</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <div className="rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-[10px] text-white/70 mb-1">
                          <Activity className="h-3 w-3" />
                          Muscle Groups
                        </div>
                        <p className="text-xs text-white/90 line-clamp-1">{workout.muscle_groups_targeted}</p>
                      </div>

                      <div className="rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-[10px] text-white/70 mb-1">
                          <Zap className="h-3 w-3" />
                          Equipment
                        </div>
                        <p className="text-xs text-white/90 line-clamp-1">{workout.equipment_needed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Exercises - more compact */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
                  <div className="p-2 border-b border-transparent">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs text-white/90 flex items-center">
                        <Dumbbell className="h-3.5 w-3.5 mr-1" />
                        Exercises ({workout.workout_data.exercises.length})
                      </h3>
                      <button
                        onClick={() => setShowExercisePicker(true)}
                        className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-light text-white/90 hover:bg-white/20 transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" strokeWidth={1.5} />
                        Add
                      </button>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1 font-light">
                      Drag to reorder • Double-tap to complete • Click once to delete
                    </p>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={workout.workout_data.exercises.map((_, i) => `exercise-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="p-2 space-y-2">
                        {workout.workout_data.exercises.map((exercise, index) => {
                          const status = completedExercises[index]
                          const isCompleted = status?.completed ?? false

                          return (
                            <SortableExerciseItem
                              key={`exercise-${index}`}
                              exercise={exercise}
                              index={index}
                              isCompleted={isCompleted}
                              selectedExerciseIndex={selectedExerciseIndex}
                              totalExercises={workout.workout_data.exercises.length}
                              onExerciseClick={handleExerciseClick}
                              onExerciseKeyDown={handleExerciseKeyDown}
                              onDeleteClick={handleDeleteExerciseClick}
                            />
                          )
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </section>
      <DeleteWorkoutModal
        open={showDeleteConfirm}
        isDeleting={isDeleting}
        onCancel={() => {
          if (isDeleting) return
          setShowDeleteConfirm(false)
        }}
        onConfirm={handleDelete}
      />
      <DeleteExerciseModal
        open={showDeleteExerciseModal}
        isDeleting={isDeletingExercise}
        exerciseName={deleteExerciseTarget?.name || ''}
        isLastExercise={workout?.workout_data.exercises.length === 1}
        onCancel={() => {
          if (isDeletingExercise) return
          setShowDeleteExerciseModal(false)
          setDeleteExerciseTarget(null)
        }}
        onConfirm={handleDeleteExerciseConfirm}
      />
      <ExercisePicker
        isOpen={showExercisePicker}
        workoutId={params.id}
        onClose={() => setShowExercisePicker(false)}
        onExerciseAdded={handleExerciseAdded}
      />
      
      {/* Copy Workout Modal - Black Theme */}
      {showCopyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => !isCopying && setShowCopyModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4 rounded-lg border border-white/10 bg-black/90 backdrop-blur-xl p-6 shadow-2xl"
          >
            {/* Icon */}
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-white/5 p-3">
                <Copy className="h-6 w-6 text-white/90" />
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-white text-center mb-2">Copy Workout</h3>
            <p className="text-sm text-white/60 text-center mb-6">
              Create a duplicate with a new name
            </p>
            
            {/* Input */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-white/70 mb-2">Workout Name</label>
              <input
                type="text"
                value={copyWorkoutName}
                onChange={(e) => setCopyWorkoutName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none transition-colors"
                placeholder="Enter workout name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && copyWorkoutName.trim()) {
                    handleCopyConfirm()
                  } else if (e.key === 'Escape') {
                    setShowCopyModal(false)
                  }
                }}
              />
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyModal(false)}
                disabled={isCopying}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleCopyConfirm}
                disabled={isCopying || !copyWorkoutName.trim()}
                className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCopying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Copy
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
