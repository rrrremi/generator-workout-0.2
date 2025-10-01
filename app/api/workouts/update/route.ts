import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { id, name, target_date, status } = body;
    
    // Validate inputs
    if (!id) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 });
    }

    // Validate status if provided
    let normalizedStatus: 'new' | 'target' | 'missed' | 'completed' | undefined;
    if (status !== undefined) {
      const allowedStatuses = ['new', 'target', 'missed', 'completed'] as const;
      if (typeof status !== 'string' || !allowedStatuses.includes(status as any)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      normalizedStatus = status as typeof allowedStatuses[number];
    }

    // Validate target_date if provided
    let normalizedTargetDate: string | null | undefined = undefined;
    if (target_date !== undefined) {
      if (target_date === null || target_date === '') {
        normalizedTargetDate = null;
      } else if (typeof target_date === 'string') {
        const trimmed = target_date.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return NextResponse.json({ error: 'target_date must be in YYYY-MM-DD format' }, { status: 400 });
        }

        const date = new Date(trimmed + 'T00:00:00Z');
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json({ error: 'Invalid target_date value' }, { status: 400 });
        }

        normalizedTargetDate = trimmed;
      } else {
        return NextResponse.json({ error: 'target_date must be a string or null' }, { status: 400 });
      }
    }
    
    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
      }
      
      const trimmedName = name.trim();
      
      if (trimmedName.length > 50) {
        return NextResponse.json({ error: 'Name cannot exceed 50 characters' }, { status: 400 });
      }
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if workout exists and belongs to user
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('id, user_id, status, target_date')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    
    if (existingWorkout.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update the workout
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim() || null; // Store null if empty string
    }

    if (normalizedTargetDate !== undefined) {
      updateData.target_date = normalizedTargetDate;
    }

    if (normalizedStatus !== undefined) {
      if (normalizedStatus === 'completed') {
        updateData.status = 'completed';
      } else {
        updateData.status = normalizedStatus;
      }
    }

    // Derive status when not explicitly set or to enforce date-based logic
    const effectiveTargetDate = normalizedTargetDate !== undefined ? normalizedTargetDate : existingWorkout.target_date;
    const computeDerivedStatus = () => {
      if (updateData.status === 'completed' || existingWorkout?.status === 'completed' && normalizedStatus === undefined) {
        return 'completed';
      }
      if (!effectiveTargetDate) {
        return 'new';
      }
      const today = new Date();
      const targetDate = new Date(effectiveTargetDate);
      // Normalize times for comparison
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      if (targetDate.getTime() >= today.getTime()) {
        return 'target';
      }
      return 'missed';
    };

    if (normalizedStatus !== 'completed') {
      updateData.status = computeDerivedStatus();
    }
    
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating workout:', updateError);
      return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      workout: updatedWorkout
    });
    
  } catch (error) {
    console.error('Error in workout update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
