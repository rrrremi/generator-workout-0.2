import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheHelper } from '@/lib/cache'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear all cache
    cacheHelper.clear()

    return NextResponse.json({ 
      success: true,
      message: 'Cache cleared successfully'
    })

  } catch (error: any) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
