// Direct SQL execution script for special instructions migration
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
    console.log('Applying special instructions migration...');
    
    // Execute the SQL directly using rpc for Supabase v2
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS special_instructions TEXT;`
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Special instructions migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();
