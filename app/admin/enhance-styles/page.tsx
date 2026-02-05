'use client'

import { useEffect, useState } from 'react'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'

type EnhanceStyle = {
  id: string
  name: string
  description: string
  coverImage: string
  prompt: string
  createdAt: string
}

const EMPTY_FORM = {
  name: '',
  description: '',
  coverImage: '',
  prompt: '',
}

export default function AdminEnhanceStylesPage() {
  const { toast } = useToast()
  const [styles, setStyles] = useState<EnhanceStyle[]>([])
  const [loadingStyles, setLoadingStyles] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const fetchStyles = async () => {
    try {
      setLoadingStyles(true)
      const res = await fetch('/api/admin/enhance-styles', { credentials: 'include' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.status !== 'success') {
        throw new Error(data?.message || 'Failed to load enhance styles')
      }

      setStyles(Array.isArray(data.data) ? data.data : [])
    } catch (error: any) {
      console.error('Failed to fetch enhance styles:', error)
      toast({
        title: 'Failed to load enhance styles',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoadingStyles(false)
    }
  }

  useEffect(() => {
    fetchStyles()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting) return

    try {
      setSubmitting(true)
      const isEdit = !!editingId
      const res = await fetch('/api/admin/enhance-styles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isEdit ? { ...formData, id: editingId } : formData),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.status !== 'success') {
        throw new Error(data?.message || `Failed to ${isEdit ? 'update' : 'create'} enhance style`)
      }

      toast({
        title: isEdit ? 'Enhance style updated' : 'Enhance style created',
        description: `${formData.name} ${isEdit ? 'updated' : 'created'} successfully.`,
      })

      setFormData(EMPTY_FORM)
      setEditingId(null)
      await fetchStyles()
    } catch (error: any) {
      console.error('Enhance style submit failed:', error)
      toast({
        title: `Failed to ${editingId ? 'update' : 'create'} enhance style`,
        description: error.message || 'Please check the details and try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (style: EnhanceStyle) => {
    setFormData({
      name: style.name,
      description: style.description,
      coverImage: style.coverImage,
      prompt: style.prompt,
    })
    setEditingId(style.id)
  }

  const handleCancelEdit = () => {
    setFormData(EMPTY_FORM)
    setEditingId(null)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/enhance-styles?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.status !== 'success') {
        throw new Error(data?.message || 'Failed to delete enhance style')
      }

      toast({
        title: 'Enhance style deleted',
        description: `${name} has been removed.`,
      })

      await fetchStyles()
    } catch (error: any) {
      console.error('Failed to delete enhance style:', error)
      toast({
        title: 'Failed to delete enhance style',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Enhance Styles</h1>
              <p className="text-muted-foreground">
                Create style presets that appear in the Enhance page as selectable cards.
              </p>
            </div>

            <Card>
              <CardHeader className="border-b pb-6">
                <CardTitle>{editingId ? 'Edit enhance style' : 'Create a new enhance style'}</CardTitle>
                <CardDescription>
                  Add a cover image, short description, and an AI prompt. Users will pick one before enhancing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 gap-6 lg:grid-cols-2" onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="name">
                        Style name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Clean Studio Portrait"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="description">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Short text shown under the card"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="coverImage">
                        Cover image URL
                      </label>
                      <Input
                        id="coverImage"
                        name="coverImage"
                        value={formData.coverImage}
                        onChange={handleChange}
                        placeholder="https://..."
                        type="url"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="prompt">
                        AI prompt
                      </label>
                      <Textarea
                        id="prompt"
                        name="prompt"
                        value={formData.prompt}
                        onChange={handleChange}
                        placeholder="e.g. professional studio lighting, high detail skin, clean background"
                        rows={5}
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={submitting}>
                        {submitting
                          ? editingId
                            ? 'Updating…'
                            : 'Creating…'
                          : editingId
                            ? 'Update enhance style'
                            : 'Create enhance style'}
                      </Button>
                      {editingId ? (
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border overflow-hidden">
                      {formData.coverImage ? (
                        <img src={formData.coverImage} alt="Cover preview" className="h-64 w-full object-cover" />
                      ) : (
                        <div className="h-64 w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                          Cover preview
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-dashed p-4 text-sm">
                      <p className="font-medium text-muted-foreground">Prompt preview</p>
                      <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{formData.prompt || '—'}</p>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-6">
                <CardTitle>Existing enhance styles</CardTitle>
                <CardDescription>
                  {styles.length === 0 ? 'No enhance styles yet.' : 'These are shown to users on the Enhance page.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStyles ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          Loading enhance styles…
                        </TableCell>
                      </TableRow>
                    ) : styles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No enhance styles yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      styles.map((style) => (
                        <TableRow key={style.id}>
                          <TableCell className="font-medium">{style.name}</TableCell>
                          <TableCell className="max-w-2xl">
                            <p className="line-clamp-2 text-muted-foreground text-sm">{style.description}</p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {new Date(style.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(style)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(style.id, style.name)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
