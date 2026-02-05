'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { useEffect, useState } from 'react'

type HistoryItem = {
  url: string
  createdAt?: string
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const res = await fetch('/api/user/history', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message || 'Failed to load history')
        setItems(Array.isArray(data?.data?.history) ? data.data.history : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">History</h1>
            <p className="text-foreground/60 mb-8">Your recent generations and enhancements</p>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-6 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex overflow-x-auto pb-6 -mx-8 px-8 gap-6 scrollbar-hide">
              {loading ? (
                <div className="text-foreground/60 w-full text-center py-10">Loading…</div>
              ) : items.length === 0 ? (
                <div className="text-foreground/60 w-full text-center py-10">No history yet</div>
              ) : items.map((item, idx) => (
                <div key={`${item.url}-${idx}`} className="shrink-0 w-80 bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition">
                  <div className="aspect-video relative">
                    <img src={item.url || "/placeholder.svg"} alt="Result" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium mb-1">Result</p>
                    <p className="text-xs text-foreground/60 mb-4">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted transition">
                        Download
                      </button>
                      <button className="flex-1 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted transition">
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
