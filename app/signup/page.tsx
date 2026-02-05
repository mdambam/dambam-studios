'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, signup } = useAuth()
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
      if (!name || !email || !password) throw new Error('Please fill in all fields')
      await signup(name, email, password)
      toast({ title: 'Account created!', description: 'Welcome to AI Studios.' })
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed'
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
          <img src="/sample-car.png" alt="Creative Background" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-6xl font-bold leading-tight mb-6">Create something extraordinary.</h1>
          <p className="text-xl text-gray-300">
            Join AI Studios today.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold">Create account</h2>
            <p className="text-muted-foreground mt-2">Create your account to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 border-2 border-border focus-visible:ring-0 focus-visible:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-2 border-border focus-visible:ring-0 focus-visible:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-2 border-border focus-visible:ring-0 focus-visible:border-primary"
                required
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold bg-[#81b441] hover:bg-[#72a136] text-black" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground max-w-xs mx-auto">
            By clicking "Create Account", you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className="text-center text-sm text-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
