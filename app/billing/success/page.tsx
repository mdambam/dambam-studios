'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'

function BillingSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying payment…')

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!reference) {
      setStatus('error')
      setMessage('Missing payment reference')
      return
    }

    const run = async () => {
      try {
        const res = await fetch(`/api/billing/verify?reference=${encodeURIComponent(reference)}`, {
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message || 'Payment verification failed')

        await refreshUser()
        setStatus('success')
        setMessage('Payment verified. Credits added.')

        setTimeout(() => router.push('/billing'), 1200)
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : 'Payment verification failed')
      }
    }

    run()
  }, [searchParams, router, refreshUser])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Billing</h1>
            <p className="text-foreground/60 mb-8">{status === 'loading' ? 'Please wait…' : status === 'success' ? 'Success' : 'Error'}</p>

            <div className="bg-card rounded-xl border border-border p-6">
              <p className={status === 'error' ? 'text-destructive' : 'text-foreground'}>{message}</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 lg:p-12">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Billing</h1>
                <p className="text-foreground/60 mb-8">Please wait…</p>
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-foreground">Verifying payment…</p>
                </div>
              </div>
            </main>
          </div>
        </ProtectedRoute>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  )
}
