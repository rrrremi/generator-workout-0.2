'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function SignOutButton({ 
  className = '',
  children = 'Sign Out'
}: SignOutButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button 
      onClick={handleSignOut}
      className={`px-3 py-1 bg-white text-black border border-black rounded-md hover:opacity-80 ${className}`}
    >
      {children}
    </button>
  )
}
