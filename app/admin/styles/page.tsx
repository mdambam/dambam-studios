'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react'
import Image from 'next/image'

interface Style {
  id: string
  name: string
  description: string
  coverImage?: string
  createdAt: string
}

export default function AdminStylesPage() {
  const router = useRouter()
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchStyles()
  }, [])

  const fetchStyles = async () => {
    try {
      const res = await fetch('/api/styles')
      const data = await res.json()

      if (data.status === 'success') {
        setStyles(data.data)
      }
    } catch (err) {
      console.error('Failed to load styles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (styleId: string) => {
    if (!confirm('Are you sure you want to delete this style?')) return

    setDeleting(styleId)
    try {
      const res = await fetch(`/api/styles/${styleId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setStyles(styles.filter(s => s.id !== styleId))
      }
    } catch (err) {
      console.error('Failed to delete style:', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12 xl:p-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Styles</h1>
                <p className="text-muted-foreground">
                  Create and manage style templates for users
                </p>
              </div>
              <Button onClick={() => router.push('/admin/styles/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Style
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : styles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">No styles created yet</p>
                  <Button onClick={() => router.push('/admin/styles/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Style
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styles.map((style) => (
                  <Card key={style.id} className="overflow-hidden">
                    <div className="relative aspect-square bg-muted">
                      {style.coverImage ? (
                        <Image
                          src={style.coverImage}
                          alt={style.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Preview
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{style.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {style.description}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/admin/styles/${style.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(style.id)}
                          disabled={deleting === style.id}
                        >
                          {deleting === style.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
