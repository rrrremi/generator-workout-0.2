'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthForm from '@/components/auth/AuthForm'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, Lock, LogIn } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const supabase = createClient()

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/protected/workouts')
      }
    }
    checkUser()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in.')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      if (data.session) {
        // Successfully logged in, use router for smoother navigation
        router.push('/protected/workouts')
        router.refresh()
      } else {
        setError('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <AuthForm
      title="Welcome Back"
      description="Sign in to continue to your dashboard"
      error={error}
      onSubmit={handleLogin}
      footer={
        <div className="text-center mt-2">
          <p className="text-xs text-white/60">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-white/90 font-light hover:text-white transition-colors underline">
              Create account
            </Link>
          </p>
        </div>
      }
    >
      <div className="space-y-3">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="your.email@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={14} />}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={14} />}
        />

        <div className="flex items-center justify-between py-0.5 mt-0.5">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3 w-3 rounded bg-white/5 border-white/20 text-white/90 focus:ring-white/30"
            />
            <label htmlFor="remember-me" className="ml-1.5 block text-xs text-white/70">
              Remember me
            </label>
          </div>

          <div>
            <Link 
              href="/auth/reset-password" 
              className="text-xs text-white/60 hover:text-white/90 transition-colors font-light"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          variant="primary"
          fullWidth
          leftIcon={!loading ? <LogIn size={14} /> : undefined}
          className="mt-1 py-2"
          size="sm"
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </AuthForm>
  )
}
