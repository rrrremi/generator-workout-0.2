'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, BarChart3, Settings, ArrowLeft, Edit, Users, Activity, ExternalLink, TrendingUp } from 'lucide-react'
import { HealthKPISummary } from '@/types/health-analysis'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [workoutCount, setWorkoutCount] = useState(0)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [kpis, setKpis] = useState<HealthKPISummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setProfile(profileData)

        // Get user's workout count
        const { count } = await supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setWorkoutCount(count || 0)

        // Get user's health analyses and KPIs in parallel
        const [analysesResult, kpisResult] = await Promise.all([
          supabase
            .from('health_analyses')
            .select('id, created_at, summary, status, metrics_count')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
          fetch('/api/measurements/kpis').then(res => res.ok ? res.json() : { kpis: [] })
        ])

        setAnalyses(analysesResult.data || [])
        setKpis(kpisResult.kpis || [])
      } catch (err) {
        console.error('Error fetching profile data:', err)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <svg className="animate-spin h-5 w-5 text-white mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs text-white/70">Loading...</p>
          </div>
        </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <section className="mx-auto w-full max-w-3xl px-2 pb-10">
        {/* Back button moved to left side above profile header */}
        <div className="mb-2">
          <Link href="/protected/workouts">
            <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >

          {/* Profile Header */}
          <div className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-4 backdrop-blur-2xl">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl opacity-50" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-2xl opacity-50" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Your Profile</h1>
                  <p className="mt-0.5 text-xs text-white/70">Account settings and stats</p>
                </div>
                <Link href="/protected/profile/edit">
                  <button className="rounded-lg border border-transparent bg-white/10 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors flex items-center gap-1.5">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </Link>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300 backdrop-blur-xl mt-2">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* Account Information */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
                <div className="flex items-center justify-between p-2 border-b border-transparent">
                  <h3 className="text-xs  text-white/90 flex items-center">
                    <User className="h-3.5 w-3.5 mr-1" />
                    Account Information
                  </h3>
                </div>
                <div className="p-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                    <span className="text-white/90">{profile?.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <User className="h-3 w-3" />
                      Full Name
                    </div>
                    <span className="text-white/90">{profile?.full_name || 'Not set'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <Calendar className="h-3 w-3" />
                      Member Since
                    </div>
                    <span className="text-white/90">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <Users className="h-3 w-3" />
                      Age
                    </div>
                    <span className="text-white/90">{profile?.age ? `${profile.age} years` : 'Not set'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <Users className="h-3 w-3" />
                      Sex
                    </div>
                    <span className="text-white/90 capitalize">{profile?.sex ? profile.sex.replace(/_/g, ' ') : 'Not set'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <Settings className="h-3 w-3" />
                      Account Type
                    </div>
                    <span className="text-white/90">{profile?.is_admin ? 'Administrator' : 'Member'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Fitness Stats */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
                <div className="flex items-center justify-between p-2 border-b border-transparent">
                  <h3 className="text-xs  text-white/90 flex items-center">
                    <BarChart3 className="h-3.5 w-3.5 mr-1" />
                    Fitness Statistics
                  </h3>
                </div>
                <div className="p-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <BarChart3 className="h-3 w-3" />
                      Total Workouts
                    </div>
                    <span className="text-sm  text-white/90">{workoutCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <Calendar className="h-3 w-3" />
                      Daily Limit
                    </div>
                    <span className="text-white/90">100 workouts/day</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/70">
                      <User className="h-3 w-3" />
                      Status
                    </div>
                    <span className="text-white/90">{profile?.is_admin ? 'Premium' : 'Active'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between p-2 border-b border-transparent">
                <h3 className="text-xs  text-white/90">Quick Actions</h3>
              </div>
              <div className="p-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href="/protected/workouts/generate">
                    <button className="w-full rounded-lg border border-transparent bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors text-left">
                      Generate New Workout
                    </button>
                  </Link>
                  <Link href="/protected/workouts">
                    <button className="w-full rounded-lg border border-transparent bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors text-left">
                      View Workout History
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Health Analyses */}
          {analyses.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
                <div className="flex items-center justify-between p-2 border-b border-transparent">
                  <h3 className="text-xs text-white/90 flex items-center">
                    <Activity className="h-3.5 w-3.5 mr-1" />
                    Recent Health Analyses
                  </h3>
                  <Link href="/protected/measurements">
                    <span className="text-[10px] text-white/50 hover:text-white/80 transition-colors">View All</span>
                  </Link>
                </div>
                <div className="p-2 space-y-2">
                  {analyses.map((analysis) => (
                    <Link key={analysis.id} href={`/protected/measurements/analysis/${analysis.id}`}>
                      <div className="rounded-lg border border-transparent bg-white/5 p-2 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-white/50">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-white/50">
                                {analysis.metrics_count} metrics
                              </span>
                            </div>
                            <p className="text-xs text-white/80 line-clamp-2">
                              {analysis.summary}
                            </p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-white/40 flex-shrink-0 mt-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Health KPIs */}
          {kpis.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="rounded-lg border border-transparent bg-white/5 backdrop-blur-xl">
                <div className="flex items-center justify-between p-2 border-b border-transparent">
                  <h3 className="text-xs text-white/90 flex items-center">
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    Recent Health KPIs
                  </h3>
                  <Link href="/protected/measurements">
                    <span className="text-[10px] text-white/50 hover:text-white/80 transition-colors">View All</span>
                  </Link>
                </div>
                <div className="p-2 space-y-2">
                  {kpis.map((kpi) => (
                    <Link key={kpi.id} href={`/protected/measurements/kpis/${kpi.id}`}>
                      <div className="rounded-lg border border-transparent bg-white/5 p-2 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-white/50">
                                {new Date(kpi.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-white/50">
                                {kpi.kpi_count} KPIs
                              </span>
                              <span className="text-[10px] text-white/50">
                                {kpi.metrics_count} metrics
                              </span>
                            </div>
                            <p className="text-xs text-white/80">
                              {kpi.categories.join(', ')}
                            </p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-white/40 flex-shrink-0 mt-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    </>
  )
}
