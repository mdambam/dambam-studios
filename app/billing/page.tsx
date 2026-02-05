'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'

export default function BillingPage() {
  const { user } = useAuth()

  const handleCheckout = async (planId: string) => {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.message || 'Checkout failed')
      }

      if (data?.status === 'success' && data?.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl
      } else {
        throw new Error(data?.message || 'Checkout failed')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      alert(error instanceof Error ? error.message : 'Checkout failed')
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Billing</h1>
            <p className="text-foreground/60 mb-8">Manage your credits and subscription</p>

            {/* Credits Balance */}
            <div className="bg-card rounded-xl border border-border p-8 mb-8">
              <p className="text-foreground/60 text-sm mb-2">Current Balance</p>
              <p className="text-5xl font-bold">{user?.credits}</p>
              <p className="text-foreground/60 text-sm mt-2">Credits remaining</p>
            </div>

            {/* Buy Credits */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Buy Credits</h2>
              <div className="flex overflow-x-auto pb-6 -mx-8 px-8 gap-4 scrollbar-hide">
                {[
                  { planId: 'pack_500', credits: 500, price: '₦500' },
                  { planId: 'pack_1000', credits: 1000, price: '₦1000' },
                  { planId: 'pack_3000', credits: 3000, price: '₦3000' },
                ].map((plan) => (
                  <div key={plan.planId} className="shrink-0 w-72 bg-card rounded-xl border border-border p-6">
                    <p className="text-2xl font-bold mb-1">{plan.credits}</p>
                    <p className="text-foreground/60 text-sm mb-4">credits</p>
                    <p className="text-xl font-bold mb-4">{plan.price}</p>
                    <button
                      onClick={() => handleCheckout(plan.planId)}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition text-sm"
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Plans */}
            <div>
              <h2 className="text-xl font-bold mb-4">Subscription Plans</h2>
              <div className="flex overflow-x-auto pb-6 -mx-8 px-8 gap-4 scrollbar-hide">
                {[
                  { name: 'Free', price: 'Free', features: ['3 credits/month', 'Basic features'] },
                  { name: 'Pro', price: '$29/mo', features: ['100 credits/month', 'All features', '4K resolution'] },
                ].map((plan) => (
                  <div key={plan.name} className="shrink-0 w-80 bg-card rounded-xl border border-border p-6">
                    <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                    <p className="text-xl font-bold mb-4">{plan.price}</p>
                    <ul className="space-y-2 text-sm text-foreground/70">
                      {plan.features.map((f, i) => (
                        <li key={i}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
