'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Dumbbell, Sparkles, Play, Target, BarChart3, Clock, Calendar, Trash2, ArrowLeft, RefreshCw, Info, Zap, Activity, Pencil, Plus } from 'lucide-react'
import InlineEdit from '@/components/ui/InlineEdit'
import ExerciseVideoButton from '@/components/workout/ExerciseVideoButton'
import { SkeletonWorkoutDetail } from '@/components/ui/Skeleton'
import { Workout } from '@/types/workout'
import DeleteWorkoutModal from '@/components/workout/DeleteWorkoutModal'
import ExerciseContextMenu from '@/components/workout/ExerciseContextMenu'
import DeleteExerciseModal from '@/components/workout/DeleteExerciseModal'
import WorkoutRating from '@/components/workout/WorkoutRating'
import ExercisePicker from '@/components/workout/ExercisePicker'

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSavingTargetDate, setIsSavingTargetDate] = useState(false)
  const [targetDateError, setTargetDateError] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Record<number, { id: string; completed: boolean }>>({})
  const [completionLoaded, setCompletionLoaded] = useState(false)
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<{ index: number; workoutExerciseId: string; name: string } | null>(null)
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false)
  const [isDeletingExercise, setIsDeletingExercise] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const supabase = createClient()

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
      
    } catch (error: any) {
      console.error('Error updating workout name:', error);
      setNameError(error.message || 'Failed to update workout name');
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
    } catch (error: any) {
      setTargetDateError(error.message || 'Failed to update target date')
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
    } catch (error: any) {
      console.error('Error deleting workout:', error)
      setError(error.message || 'Error deleting workout')
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
  }, [completedExercises, params.id, recomputeWorkoutStatus, refreshCompletionState, supabase])

  const handleExerciseKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExerciseCompletion(index)
    }
  }, [toggleExerciseCompletion])

  const handleLongPressStart = useCallback((index: number) => {
    const timer = setTimeout(() => {
      setContextMenuIndex(index)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
    setLongPressTimer(timer)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

  const handleDeleteExerciseClick = useCallback((index: number) => {
    const workoutExerciseId = completedExercises[index]?.id
    const exerciseName = workout?.workout_data.exercises[index]?.name
    
    if (!workoutExerciseId || !exerciseName) return
    
    setDeleteExerciseTarget({ index, workoutExerciseId, name: exerciseName })
    setShowDeleteExerciseModal(true)
  }, [completedExercises, workout])

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
      
    } catch (error: any) {
      console.error('Error deleting exercise:', error)
      // Rollback on error
      setWorkout(workout)
      setError(error.message || 'Failed to delete exercise')
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
      } catch (error: any) {
        setError(error.message || 'An error occurred while fetching the workout')
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
        {/* Back button positioned like in Profile view */}
        <div className="mb-2 relative z-10">
          <Link href="/protected/workouts">
            <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </Link>
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
                <div className="flex items-center gap-1.5">
                  <Link href="/protected/workouts/generate">
                    <button className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-light text-white/90 hover:bg-white/20 transition-colors flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                      New
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-lg border border-red-500/50 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                    disabled={isDeleting}
                    aria-label="Delete workout"
                  >
                    {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
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
                      <div className="flex flex-wrap gap-1 items-center rounded-md border border-transparent bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70 mr-1">
                          <Target className="h-3 w-3" />
                          Focus:
                        </div>
                        {(() => {
                          // Handle different possible formats of workout_focus
                          let focusArray: any[] = [];
                          
                          if (Array.isArray(workout.workout_focus)) {
                            focusArray = workout.workout_focus;
                          } else {
                            const focusValue = workout.workout_focus as unknown as string;
                            if (typeof focusValue === 'string') {
                              if (focusValue.startsWith('[') && focusValue.endsWith(']')) {
                                try {
                                  focusArray = JSON.parse(focusValue);
                                } catch (e) {
                                  focusArray = [focusValue];
                                }
                              } else {
                                focusArray = [focusValue];
                              }
                            }
                          }
                          
                          return focusArray.slice(0, 2).map((focus: any, i: number) => {
                            const cleanFocus = typeof focus === 'string' ? focus.replace(/["']/g, '') : focus;
                            return (
                              <span key={i} className="text-[9px] px-1.5 py-0 rounded-full bg-cyan-500/20 text-cyan-300 capitalize">
                                {cleanFocus}
                              </span>
                            );
                          });
                        })()}
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
                  <div className="flex items-center justify-between p-2 border-b border-transparent">
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
                  <div className="p-2 space-y-2">
                    {workout.workout_data.exercises.map((exercise, index) => {
                      const status = completedExercises[index]
                      const isCompleted = status?.completed ?? false

                      return (
                        <motion.div
                          key={index}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isCompleted}
                          onClick={() => toggleExerciseCompletion(index)}
                          onKeyDown={(event) => handleExerciseKeyDown(event, index)}
                          onTouchStart={() => handleLongPressStart(index)}
                          onTouchEnd={handleLongPressEnd}
                          onTouchCancel={handleLongPressEnd}
                          onMouseDown={() => handleLongPressStart(index)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: isCompleted ? 1.01 : 1
                          }}
                          transition={{ delay: 0.05 + index * 0.03 }}
                          className={`relative rounded-md border p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 cursor-pointer ${
                            isCompleted
                              ? 'border-emerald-400/40 bg-emerald-400/10'
                              : 'border-transparent bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          {contextMenuIndex === index && (
                            <div className="absolute top-0 right-0 mt-1 mr-1">
                              <ExerciseContextMenu
                                isOpen={contextMenuIndex === index}
                                onDelete={() => handleDeleteExerciseClick(index)}
                                onClose={() => setContextMenuIndex(null)}
                                exerciseName={exercise.name}
                              />
                            </div>
                          )}
                          <div className="flex items-center">
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
                            <div
                              className="ml-auto"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <ExerciseVideoButton exerciseName={exercise.name} size="small" variant="subtle" />
                            </div>
                          </div>

                          {exercise.rationale && (
                            <div
                              className={`mt-1 rounded-md border p-1.5 transition-colors ${
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
                    })}
                  </div>
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
    </>
  )
}
