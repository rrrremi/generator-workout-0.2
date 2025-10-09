-- Add rationale column to exercises table if it doesn't exist
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Update existing exercises with some sample rationales
UPDATE public.exercises SET rationale = 'Great compound movement for building overall chest strength and mass' WHERE name = 'Bench Press' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Essential lower body exercise that builds leg strength and power' WHERE name = 'Squat' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'King of all exercises - builds total body strength and muscle' WHERE name = 'Deadlift' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Excellent bodyweight exercise for back width and strength' WHERE name = 'Pull-ups' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Builds strong, stable shoulders and improves overhead strength' WHERE name = 'Overhead Press' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Great for building a thick, strong back' WHERE name = 'Barbell Row' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Isolates biceps for arm development' WHERE name = 'Dumbbell Curl' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Excellent triceps builder using bodyweight' WHERE name = 'Tricep Dips' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Unilateral leg exercise that improves balance and strength' WHERE name = 'Lunges' AND rationale IS NULL;
UPDATE public.exercises SET rationale = 'Core stability exercise that strengthens your entire midsection' WHERE name = 'Plank' AND rationale IS NULL;
