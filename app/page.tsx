import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to workouts page
  if (user) {
    redirect('/protected/workouts')
  }

  // If not logged in, redirect to login page
  redirect('/auth/login')
}
