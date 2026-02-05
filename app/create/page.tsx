'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { StyleCard, StyleCardSkeleton } from '@/components/style-card'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

interface Style {
    id: string
    name: string
    description: string
    coverImage?: string
}

export default function CreatePage() {
    const router = useRouter()
    const { user } = useAuth()
    const [styles, setStyles] = useState<Style[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStyles = useCallback(async () => {
        try {
            setError(null)
            
            const res = await fetch('/api/styles')
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`)
            }
            
            const data = await res.json()

            if (data.status === 'success') {
                setStyles(data.data)
            } else {
                setError(data.message || 'Failed to load styles')
            }
        } catch (err: any) {
            console.error('Fetch styles error:', err)
            setError(err.message || 'Failed to load styles')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStyles()
    }, [fetchStyles])

    const handleSelectStyle = (styleId: string) => {
        router.push(`/create/${styleId}`)
    }

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Create with Style Templates</h1>
                                <p className="text-muted-foreground">
                                    Transform your images using professional style templates
                                </p>
                            </div>
                            {user?.isAdmin ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => router.push('/admin/styles')}>Manage Styles</Button>
                                    <Button onClick={() => router.push('/admin/styles/new')}>Create Style</Button>
                                </div>
                            ) : null}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map((i) => (
                                    <StyleCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                                <p className="text-destructive font-medium">Error: {error}</p>
                                <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchStyles(); }} className="mt-2">
                                    Retry
                                </Button>
                            </div>
                        ) : styles.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-muted-foreground text-lg">No styles available yet.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Contact your admin to create style templates.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {styles.map((style) => (
                                    <StyleCard
                                        key={style.id}
                                        id={style.id}
                                        name={style.name}
                                        description={style.description}
                                        coverImage={style.coverImage}
                                        onSelect={handleSelectStyle}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
