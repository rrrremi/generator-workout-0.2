// Direct SQL execution script for workout extension migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Applying workout extension migration...');
    
    // Execute the SQL directly - adding the new columns
    const { error } = await supabase
      .from('_sql')
      .select('*')
      .execute(`
        ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
        muscle_focus TEXT[] NOT NULL DEFAULT '{}';
        
        ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
        workout_focus TEXT NOT NULL DEFAULT 'hypertrophy';
        
        ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
        exercise_count INTEGER NOT NULL DEFAULT 4 CHECK (exercise_count >= 1 AND exercise_count <= 10);
      `);
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();
