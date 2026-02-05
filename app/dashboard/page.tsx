'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Sparkles, ArrowRight, Zap } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                  Hello, <span className="text-primary">{user?.name?.split(' ')[0] || 'Creator'}</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Ready to create something amazing today? Your studio is fully charged.
                </p>
              </div>

              <div className="bg-muted/50 backdrop-blur-sm border border-border px-6 py-3 rounded-2xl flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits</span>
                  <span className="text-2xl font-bold font-mono text-primary">{user?.credits || 0}</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <Link href="/billing" className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1">
                  Get More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { href: '/enhance', icon: '✨', title: 'Enhance', desc: 'Upscale & fix details', color: 'from-blue-500/20 to-cyan-500/20' },
                { href: '/generate', icon: '🎨', title: 'Generate', desc: 'Text to image', color: 'from-purple-500/20 to-pink-500/20' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group relative overflow-hidden bg-card hover:bg-muted/50 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                >
                  <div className={`absolute top-0 right-0 p-32 bg-gradient-to-br ${action.color} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">{action.icon}</div>
                    <h3 className="font-bold text-xl mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.desc}</p>

                    <div className="mt-4 flex items-center text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      Launch Tool <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent Activity (Placeholder) */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Recent Creations
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors flex items-center justify-center group cursor-pointer relative overflow-hidden">
                    <span className="text-muted-foreground text-sm group-hover:opacity-0 transition-opacity">Empty</span>
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ArrowRight className="text-primary w-6 h-6" />
                    </div>
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
