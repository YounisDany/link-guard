'use client'

import { useState } from 'react'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'

interface LoginPageProps {
  onNavigate: (view: 'register' | 'landing') => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setCurrentView } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }

      // Fetch full user profile
      const meRes = await fetch('/api/auth/me')
      if (meRes.ok) {
        const meData = await meRes.json()
        setUser(meData.user)
        setCurrentView('dashboard')
        toast.success('Welcome back!')
      } else {
        setUser(data.user as Parameters<typeof setUser>[0])
        setCurrentView('dashboard')
        toast.success('Welcome back!')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden w-1/2 landing-gradient lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/20">
            <Shield className="h-8 w-8 text-teal-400" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">LinkGuard</h1>
          <p className="text-lg text-slate-400">
            Smart System for Real-Time Detection of Suspicious Internet Links
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Protect yourself from phishing, malware, and fraudulent websites with our AI-powered URL analysis
            engine.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-8 w-8 text-teal-500" />
              <span className="text-xl font-bold text-slate-900">LinkGuard</span>
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="mb-8 text-slate-500">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="btn-teal-gradient h-11 w-full border-0 text-white hover:text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="font-semibold text-teal-600 hover:text-teal-700"
            >
              Create Account
            </button>
          </p>

          <button
            onClick={() => onNavigate('landing')}
            className="mt-4 block w-full text-center text-sm text-slate-400 hover:text-slate-600"
          >
            &larr; Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
