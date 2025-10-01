'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CounterButtonProps {
  initialCount: number
  userId: string
}

export default function CounterButton({ initialCount, userId }: CounterButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleClick = async () => {
    if (loading) return
    
    setError(null)
    setLoading(true)
    
    // Optimistic update
    setCount(prev => prev + 1)
    
    try {
      // Save to database
      const { error } = await supabase
        .from('clicks')
        .insert({ user_id: userId, click_count: 1 })
      
      if (error) {
        // Revert on error
        setCount(prev => prev - 1)
        setError('Failed to save click')
        console.error('Error saving click:', error)
      }
    } catch (err) {
      // Revert on error
      setCount(prev => prev - 1)
      setError('Failed to save click')
      console.error('Error saving click:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      {error && <div className="bg-red-50 border border-red text-red p-4 mb-4 rounded-md">{error}</div>}
      
      <div className="text-6xl font-bold mb-8">{count}</div>
      
      <button 
        onClick={handleClick}
        disabled={loading}
        className="bg-black text-white hover:bg-gray-800 text-xl px-8 py-4 rounded-full transition-transform active:scale-95 disabled:opacity-50"
        aria-label="Increment counter"
      >
        {loading ? 'Processing...' : 'Click Me'}
      </button>
    </div>
  )
}
