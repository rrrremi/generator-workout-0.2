import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current user's profile to check admin status
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !currentUserProfile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }
    
    // Try to create the function to get all profiles
    const { error: functionError } = await supabase.rpc('create_get_all_profiles_function', {
      sql_command: `
        CREATE OR REPLACE FUNCTION get_all_profiles()
        RETURNS SETOF profiles
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT * FROM profiles ORDER BY created_at DESC;
        $$;
      `
    });
    
    if (functionError) {
      console.error('Error creating function:', functionError);
      return NextResponse.json({ 
        success: false, 
        error: functionError.message,
        message: 'Failed to create function, but this might be because it already exists.'
      });
    }
    
    // Test the function
    const { data: profiles, error: testError } = await supabase.rpc('get_all_profiles');
    
    if (testError) {
      return NextResponse.json({ 
        success: false, 
        error: testError.message,
        message: 'Function created but test failed.'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin setup completed successfully',
      profileCount: profiles?.length || 0
    });
    
  } catch (error) {
    console.error('Error in admin setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
