'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            {/* Profile Info */}
            <div className="bg-card rounded-xl border border-border p-8 space-y-6 mb-8">
              <div>
                <p className="text-sm text-foreground/60 mb-1">Name</p>
                <p className="text-lg font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60 mb-1">Email</p>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60 mb-1">Account Type</p>
                <p className="text-lg font-medium capitalize">{user?.subscription}</p>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition"
            >
              Logout
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
