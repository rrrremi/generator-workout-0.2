'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DebugExercisesPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true)
        
        // Fetch exercises from the debug API
        const response = await fetch(`/api/debug/exercises${searchTerm ? `?name=${encodeURIComponent(searchTerm)}` : ''}`)
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        setExercises(data.exercises || [])
        setTotalCount(data.totalCount || 0)
      } catch (err) {
        console.error('Error fetching exercises:', err)
        setError('Failed to load exercises')
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [searchTerm])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search is handled by the useEffect dependency on searchTerm
  }

  return (
    <>
      {/* Main Content */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link href="/protected/workouts">
                <button className="rounded-lg border border-transparent bg-white/5 p-2 text-white/80 hover:bg-white/10 transition-colors">
                  ← Back
                </button>
              </Link>
              <h1 className="text-xl font-semibold tracking-tight">
                Debug Exercises ({totalCount})
              </h1>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-transparent bg-white/5 px-3 py-1 text-sm text-white/90 placeholder-white/40"
              />
              <button
                type="submit"
                className="rounded-lg border border-transparent bg-white/10 px-3 py-1 text-sm text-white/90 hover:bg-white/20"
              >
                Search
              </button>
            </form>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-white/80 rounded-full" />
            </div>
          )}

          {/* Exercises table */}
          {!loading && exercises.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-transparent">
                    <th className="text-left p-2 text-xs font-medium text-white/70">Name</th>
                    <th className="text-left p-2 text-xs font-medium text-white/70">Search Key</th>
                    <th className="text-left p-2 text-xs font-medium text-white/70">Primary Muscles</th>
                    <th className="text-left p-2 text-xs font-medium text-white/70">Equipment</th>
                    <th className="text-left p-2 text-xs font-medium text-white/70">Type</th>
                    <th className="text-left p-2 text-xs font-medium text-white/70">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((exercise) => (
                    <tr key={exercise.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-2 text-sm text-white/90">{exercise.name}</td>
                      <td className="p-2 text-xs text-white/70 font-mono">{exercise.search_key}</td>
                      <td className="p-2 text-xs text-white/70">
                        {exercise.primary_muscles?.join(', ')}
                      </td>
                      <td className="p-2 text-xs text-white/70">{exercise.equipment}</td>
                      <td className="p-2 text-xs text-white/70">{exercise.movement_type}</td>
                      <td className="p-2 text-xs text-white/70">
                        {new Date(exercise.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No results */}
          {!loading && exercises.length === 0 && (
            <div className="text-center py-8 text-white/60">
              No exercises found
            </div>
          )}
        </div>
      </section>
    </>
  )
}
