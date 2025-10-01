'use client'

import { useState } from 'react'
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      // Update session if remember me is checked
      if (rememberMe && !error) {
        await supabase.auth.refreshSession({
          refresh_token: (await supabase.auth.getSession()).data.session?.refresh_token || ''
        })
      }

      if (error) {
        setError(error.message)
        return
      }

      router.push('/protected/workouts')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
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
            <Link href="/auth/signup" className="text-fuchsia-400 font-medium hover:text-fuchsia-300 transition-colors">
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
              className="h-3 w-3 rounded bg-white/5 border-transparent text-fuchsia-500 focus:ring-fuchsia-500/30"
            />
            <label htmlFor="remember-me" className="ml-1.5 block text-xs text-white/70">
              Remember me
            </label>
          </div>

          <div>
            <Link 
              href="/auth/reset-password" 
              className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
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
          leftIcon={<LogIn size={14} />}
          className="mt-1 py-1.5"
          size="sm"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </AuthForm>
  )
}
