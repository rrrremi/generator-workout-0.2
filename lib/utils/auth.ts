import { createClient } from '../supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type User } from '@supabase/supabase-js'

/**
 * Get the current authenticated user
 * @returns The authenticated user or null
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Check if the current user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return !!user
}

/**
 * Check if the current user is an admin
 * @returns True if the user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  
  if (!user) {
    return false
  }
  
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  return !!profile?.is_admin
}

/**
 * Redirect to login page if the user is not authenticated
 */
export async function requireAuth() {
  const isAuthed = await isAuthenticated()
  
  if (!isAuthed) {
    redirect('/auth/login')
  }
}

/**
 * Redirect to dashboard if the user is not an admin
 */
export async function requireAdmin() {
  const admin = await isAdmin()
  
  if (!admin) {
    redirect('/protected/workouts')
  }
}
