-- Add special_instructions column to workouts table
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Update RLS policies to include the new column
ALTER POLICY "Users can read their own workouts" ON workouts USING (auth.uid() = user_id);
ALTER POLICY "Users can insert their own workouts" ON workouts WITH CHECK (auth.uid() = user_id);
