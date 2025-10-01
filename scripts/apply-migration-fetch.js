// Apply migration using Supabase REST API
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// SQL commands to execute
const sql = `
  ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
  muscle_focus TEXT[] NOT NULL DEFAULT '{}';
  
  ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
  workout_focus TEXT NOT NULL DEFAULT 'hypertrophy';
  
  ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
  exercise_count INTEGER NOT NULL DEFAULT 4 CHECK (exercise_count >= 1 AND exercise_count <= 10);
`;

async function applyMigration() {
  try {
    console.log('Applying workout extension migration...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error executing SQL:', errorData);
      return;
    }
    
    console.log('Migration applied successfully!');
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

// Need to use node-fetch in Node.js environment
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

applyMigration();
