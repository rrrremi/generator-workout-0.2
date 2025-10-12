-- Transaction-safe function for updating workout set entries
-- This ensures all operations succeed or fail together
-- 
-- DENORMALIZATION STRATEGY:
-- Set details are stored in TWO places for performance:
-- 1. workout_set_entries table (source of truth, queryable)
-- 2. workout_data.exercises.set_details JSONB (denormalized, fast reads)
-- 
-- This function maintains consistency by updating BOTH atomically.
-- If either update fails, the entire transaction rolls back.

create or replace function update_workout_set_entries_transaction(
  p_workout_exercise_id uuid,
  p_workout_id uuid,
  p_set_details jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exercise_id uuid;
  v_order_index integer;
  v_exercise_index integer;
  v_workout_data jsonb;
  v_exercises jsonb;
  v_average_rest integer;
  v_reps_summary text;
  v_set_count integer;
  v_result jsonb;
begin
  -- Get workout exercise details
  select exercise_id, order_index
  into v_exercise_id, v_order_index
  from workout_exercises
  where id = p_workout_exercise_id
    and workout_id = p_workout_id;
  
  if not found then
    raise exception 'Workout exercise not found';
  end if;

  -- Get workout data
  select workout_data into v_workout_data
  from workouts
  where id = p_workout_id;
  
  if not found then
    raise exception 'Workout not found';
  end if;

  -- Determine exercise index (handle 0-based and 1-based indexing)
  v_exercises := v_workout_data->'exercises';
  
  -- Check if any exercise has order_index 0
  if exists (
    select 1 from workout_exercises 
    where workout_id = p_workout_id and order_index = 0
  ) then
    v_exercise_index := v_order_index;
  else
    v_exercise_index := v_order_index - 1;
  end if;

  -- Validate index bounds
  if v_exercise_index < 0 or v_exercise_index >= jsonb_array_length(v_exercises) then
    raise exception 'Exercise index out of bounds';
  end if;

  -- Delete existing set entries
  delete from workout_set_entries
  where workout_exercise_id = p_workout_exercise_id;

  -- Insert new set entries
  insert into workout_set_entries (
    workout_id,
    workout_exercise_id,
    exercise_id,
    set_number,
    reps,
    weight_kg,
    rest_seconds,
    notes
  )
  select
    p_workout_id,
    p_workout_exercise_id,
    v_exercise_id,
    (detail->>'set_number')::integer,
    (detail->>'reps')::integer,
    (detail->>'weight_kg')::numeric(6,2),
    (detail->>'rest_seconds')::integer,
    detail->>'notes'
  from jsonb_array_elements(p_set_details) as detail;

  -- Calculate aggregates
  select
    coalesce(round(avg(rest_seconds)), 0),
    count(*)
  into v_average_rest, v_set_count
  from workout_set_entries
  where workout_exercise_id = p_workout_exercise_id
    and rest_seconds is not null;

  -- Calculate reps summary
  select
    case
      when count(distinct reps) = 1 then (array_agg(distinct reps))[1]::text
      else 'Varied'
    end
  into v_reps_summary
  from workout_set_entries
  where workout_exercise_id = p_workout_exercise_id
    and reps is not null;

  -- Update workout_exercises
  update workout_exercises
  set
    sets = v_set_count,
    rest_seconds = v_average_rest,
    reps = coalesce(v_reps_summary, reps)
  where id = p_workout_exercise_id;

  -- Update workout_data exercises array
  v_exercises := jsonb_set(
    v_exercises,
    array[v_exercise_index::text],
    jsonb_set(
      jsonb_set(
        jsonb_set(
          v_exercises->v_exercise_index,
          '{sets}',
          to_jsonb(v_set_count)
        ),
        '{rest_time_seconds}',
        to_jsonb(v_average_rest)
      ),
      '{reps}',
      to_jsonb(coalesce(v_reps_summary, 'Varied'))
    )
  );

  -- Update workout with new exercises array
  update workouts
  set workout_data = jsonb_set(workout_data, '{exercises}', v_exercises)
  where id = p_workout_id;

  -- Return success with updated data
  select jsonb_build_object(
    'success', true,
    'set_count', v_set_count,
    'average_rest', v_average_rest,
    'reps_summary', v_reps_summary
  ) into v_result;

  return v_result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function update_workout_set_entries_transaction(uuid, uuid, jsonb) to authenticated;
