-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  instructions TEXT,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '10-12',
  rest_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS exercises_name_idx ON public.exercises USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS exercises_primary_muscle_idx ON public.exercises (primary_muscle);
CREATE INDEX IF NOT EXISTS exercises_secondary_muscles_idx ON public.exercises USING gin(secondary_muscles);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read exercises
CREATE POLICY "Allow authenticated users to read exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert exercises (you can restrict this later)
CREATE POLICY "Allow authenticated users to insert exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update/delete exercises
CREATE POLICY "Allow admins to update exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Allow admins to delete exercises"
  ON public.exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Insert some sample exercises to get started
INSERT INTO public.exercises (name, primary_muscle, secondary_muscles, equipment, difficulty, instructions, sets, reps, rest_seconds) VALUES
  ('Bench Press', 'chest', ARRAY['triceps', 'shoulders'], 'Barbell', 'intermediate', 'Lie on bench, lower bar to chest, press up', 3, '8-12', 90),
  ('Squat', 'legs', ARRAY['glutes', 'core'], 'Barbell', 'intermediate', 'Bar on shoulders, squat down, stand up', 4, '8-12', 120),
  ('Deadlift', 'back', ARRAY['legs', 'glutes'], 'Barbell', 'advanced', 'Lift bar from ground to standing position', 3, '5-8', 180),
  ('Pull-ups', 'back', ARRAY['biceps'], 'Pull-up Bar', 'intermediate', 'Hang from bar, pull up until chin over bar', 3, '8-12', 90),
  ('Overhead Press', 'shoulders', ARRAY['triceps'], 'Barbell', 'intermediate', 'Press bar from shoulders to overhead', 3, '8-12', 90),
  ('Barbell Row', 'back', ARRAY['biceps'], 'Barbell', 'intermediate', 'Bent over, pull bar to chest', 3, '8-12', 90),
  ('Dumbbell Curl', 'biceps', ARRAY['shoulders'], 'Dumbbell', 'beginner', 'Curl dumbbells from sides to shoulders', 3, '10-15', 60),
  ('Tricep Dips', 'triceps', ARRAY['chest', 'shoulders'], 'Dip Bar', 'intermediate', 'Lower body between bars, push back up', 3, '8-12', 60),
  ('Lunges', 'legs', ARRAY['glutes'], 'Dumbbell', 'beginner', 'Step forward, lower back knee, return', 3, '10-12', 60),
  ('Plank', 'core', ARRAY['shoulders'], 'None', 'beginner', 'Hold push-up position on forearms', 3, '30-60s', 60),
  ('Leg Press', 'legs', ARRAY['glutes'], 'Machine', 'beginner', 'Push platform away with feet', 3, '10-15', 90),
  ('Lat Pulldown', 'back', ARRAY['biceps'], 'Machine', 'beginner', 'Pull bar down to chest', 3, '10-12', 60),
  ('Chest Fly', 'chest', ARRAY['shoulders'], 'Dumbbell', 'beginner', 'Lie on bench, open arms wide, bring together', 3, '10-12', 60),
  ('Shoulder Lateral Raise', 'shoulders', ARRAY[], 'Dumbbell', 'beginner', 'Raise dumbbells to sides until parallel', 3, '12-15', 45),
  ('Romanian Deadlift', 'back', ARRAY['legs', 'glutes'], 'Barbell', 'intermediate', 'Lower bar keeping legs straight, hinge at hips', 3, '8-12', 90),
  ('Face Pulls', 'shoulders', ARRAY['back'], 'Cable', 'beginner', 'Pull rope to face, elbows high', 3, '12-15', 45),
  ('Hammer Curl', 'biceps', ARRAY['shoulders'], 'Dumbbell', 'beginner', 'Curl dumbbells with neutral grip', 3, '10-12', 60),
  ('Skull Crushers', 'triceps', ARRAY[], 'Barbell', 'intermediate', 'Lower bar to forehead, extend arms', 3, '10-12', 60),
  ('Leg Curl', 'legs', ARRAY[], 'Machine', 'beginner', 'Curl legs up towards glutes', 3, '10-15', 60),
  ('Calf Raise', 'calves', ARRAY[], 'Machine', 'beginner', 'Raise heels as high as possible', 3, '15-20', 45),
  ('Cable Crossover', 'chest', ARRAY['shoulders'], 'Cable', 'intermediate', 'Pull cables together in front of chest', 3, '10-12', 60),
  ('Incline Bench Press', 'chest', ARRAY['triceps', 'shoulders'], 'Barbell', 'intermediate', 'Press bar on incline bench', 3, '8-12', 90),
  ('Front Squat', 'legs', ARRAY['core', 'glutes'], 'Barbell', 'advanced', 'Squat with bar on front shoulders', 3, '8-10', 120),
  ('Russian Twist', 'core', ARRAY[], 'Medicine Ball', 'beginner', 'Sit, twist torso side to side', 3, '20-30', 45),
  ('Mountain Climbers', 'core', ARRAY['shoulders'], 'None', 'beginner', 'Alternate bringing knees to chest in plank', 3, '30-60s', 45);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER exercises_updated_at_trigger
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_exercises_updated_at();
