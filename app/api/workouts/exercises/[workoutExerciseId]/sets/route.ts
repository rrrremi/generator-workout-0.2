import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateWorkoutSummary } from '@/lib/exercises/operations'
import DOMPurify from 'isomorphic-dompurify'

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const limit = 10 // 10 requests
  const window = 60000 // per minute
  
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetAt) {
    const resetAt = now + window
    rateLimitMap.set(userId, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: userLimit.resetAt }
  }
  
  userLimit.count++
  return { allowed: true, remaining: limit - userLimit.count, resetAt: userLimit.resetAt }
}

interface SetDetailInput {
  set_number: number
  reps?: number | null
  weight_kg?: number | null
  rest_seconds?: number | null
  notes?: string | null
}

const sanitizeSetDetails = (details: unknown): SetDetailInput[] => {
  if (!Array.isArray(details)) {
    return []
  }

  const sanitized: SetDetailInput[] = []

  for (const detail of details) {
    if (!detail || typeof detail !== 'object') {
      continue
    }

    const { set_number, reps, weight_kg, rest_seconds, notes } = detail as Record<string, unknown>

    const parsedSetNumber = Number(set_number)
    if (!Number.isFinite(parsedSetNumber) || parsedSetNumber < 1) {
      continue
    }

    const rawReps = reps === null || reps === undefined || reps === '' ? null : Number(reps)
    const rawWeight = weight_kg === null || weight_kg === undefined || weight_kg === '' ? null : Number(weight_kg)
    const rawRest = rest_seconds === null || rest_seconds === undefined || rest_seconds === '' ? null : Number(rest_seconds)

    if ((rawReps !== null && (!Number.isFinite(rawReps) || rawReps < 0)) ||
        (rawWeight !== null && (!Number.isFinite(rawWeight) || rawWeight < 0)) ||
        (rawRest !== null && (!Number.isFinite(rawRest) || rawRest < 0))) {
      continue
    }

    // Sanitize notes: strip HTML, enforce max length
    let sanitizedNotes: string | null = null
    if (typeof notes === 'string' && notes.trim().length > 0) {
      const cleaned = DOMPurify.sanitize(notes.trim(), { 
        ALLOWED_TAGS: [], // Strip all HTML
        ALLOWED_ATTR: []
      })
      sanitizedNotes = cleaned.substring(0, 500) // Max 500 characters
    }

    sanitized.push({
      set_number: Math.floor(parsedSetNumber),
      reps: rawReps !== null ? Math.floor(rawReps) : null,
      weight_kg: rawWeight !== null ? Number(rawWeight.toFixed(2)) : null,
      rest_seconds: rawRest !== null ? Math.floor(rawRest) : null,
      notes: sanitizedNotes
    })
  }

  sanitized.sort((a, b) => a.set_number - b.set_number)

  return sanitized
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workoutExerciseId: string } }
) {
  try {
    const { workoutExerciseId } = params
    const workoutId = request.nextUrl.searchParams.get('workoutId')

    if (!workoutExerciseId || !workoutId) {
      return NextResponse.json({ error: 'Missing identifiers' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workoutExercise, error: workoutExerciseError } = await supabase
      .from('workout_exercises')
      .select('id, workout_id, exercise_id')
      .eq('id', workoutExerciseId)
      .single()

    if (workoutExerciseError || !workoutExercise) {
      return NextResponse.json({ error: 'Workout exercise not found' }, { status: 404 })
    }

    if (workoutExercise.workout_id !== workoutId) {
      return NextResponse.json({ error: 'Workout mismatch' }, { status: 400 })
    }

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id, user_id')
      .eq('id', workoutId)
      .single()

    if (workoutError || !workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: setEntries, error: setEntriesError } = await supabase
      .from('workout_set_entries')
      .select('id, set_number, reps, weight_kg, rest_seconds, notes')
      .eq('workout_exercise_id', workoutExerciseId)
      .order('set_number', { ascending: true })

    if (setEntriesError) {
      throw setEntriesError
    }

    return NextResponse.json({ entries: setEntries ?? [] })
  } catch (error: any) {
    console.error('Error fetching workout set entries:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load set entries' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { workoutExerciseId: string } }
) {
  try {
    const { workoutExerciseId } = params
    const body = await request.json()
    const { workoutId, setDetails } = body ?? {}

    if (!workoutExerciseId || !workoutId) {
      return NextResponse.json({ error: 'Missing identifiers' }, { status: 400 })
    }

    const sanitizedDetails = sanitizeSetDetails(setDetails)

    if (sanitizedDetails.length === 0) {
      return NextResponse.json({ error: 'At least one set detail is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Verify user owns the workout FIRST (security: prevent querying other users' data)
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id, user_id, workout_data')
      .eq('id', workoutId)
      .eq('user_id', user.id) // Verify ownership immediately
      .single()

    if (workoutError || !workout) {
      return NextResponse.json({ error: 'Workout not found or unauthorized' }, { status: 404 })
    }

    // Now verify workout_exercise belongs to this workout
    const { data: workoutExercise, error: workoutExerciseError } = await supabase
      .from('workout_exercises')
      .select('id, workout_id, exercise_id, sets, rest_seconds, reps, order_index')
      .eq('id', workoutExerciseId)
      .eq('workout_id', workoutId) // Must belong to the verified workout
      .single()

    if (workoutExerciseError || !workoutExercise) {
      return NextResponse.json({ error: 'Exercise not found in this workout' }, { status: 404 })
    }

    // Use transaction function to ensure atomicity
    // The database function handles order_index logic and validation
    const { data: transactionResult, error: transactionError } = await supabase
      .rpc('update_workout_set_entries_transaction', {
        p_workout_exercise_id: workoutExerciseId,
        p_workout_id: workoutId,
        p_set_details: sanitizedDetails
      })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      throw transactionError
    }

    // Recalculate workout summary
    await calculateWorkoutSummary(workoutId)

    const { data: updatedWorkout, error: fetchUpdatedWorkoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single()

    if (fetchUpdatedWorkoutError || !updatedWorkout) {
      throw fetchUpdatedWorkoutError || new Error('Failed to load updated workout')
    }

    return NextResponse.json({ workout: updatedWorkout })
  } catch (error: any) {
    console.error('Error updating workout set entries:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update set entries' }, { status: 500 })
  }
}
