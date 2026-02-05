'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password) throw new Error('Please enter both email and password')
      await login(email, password)
      toast({ title: 'Success!', description: 'Login successful.' })
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex flex-col relative bg-black text-white p-12 justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/sample-fashion.png" alt="Creative Background" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-6xl font-bold leading-tight mb-6">Great to have you back!</h1>
          <p className="text-xl text-gray-300">
            Sign in to continue your work.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold">Sign in</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username or Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-2 border-border focus-visible:ring-0 focus-visible:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">Password</label>
                <Link href="/forgot-password" className="text-sm text-muted-foreground underline">Forgot?</Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-2 border-border focus-visible:ring-0 focus-visible:border-primary"
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold bg-[#81b441] hover:bg-[#72a136] text-black" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New here? <Link href="/signup" className="underline hover:text-primary">Create an account</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
