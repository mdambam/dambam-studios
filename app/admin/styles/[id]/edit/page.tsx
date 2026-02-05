'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Style {
  id: string
  name: string
  description: string
  coverImage: string
  referenceImage: string
  prompt: string
  nanoBananaPrompt?: string | null
  styleType?: string | null
  requiresFabricUpload?: boolean | null
  requiresLogoUpload?: boolean | null
  requiresCustomInstructions?: boolean | null
  requiresMannequinReference?: boolean | null
  allowsResolutionSelection?: boolean | null
}

export default function EditStylePage() {
    const router = useRouter()
    const params = useParams()
    const styleId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [prompt, setPrompt] = useState('')
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [referenceImage, setReferenceImage] = useState<string | null>(null)
    const [newCoverImage, setNewCoverImage] = useState<string | null>(null)
    const [newReferenceImage, setNewReferenceImage] = useState<string | null>(null)
    
    // Style configuration
    const [styleType, setStyleType] = useState('fabric-mockup')
    const [requiresFabricUpload, setRequiresFabricUpload] = useState(true)
    const [requiresLogoUpload, setRequiresLogoUpload] = useState(true)
    const [requiresCustomInstructions, setRequiresCustomInstructions] = useState(true)
    const [requiresMannequinReference, setRequiresMannequinReference] = useState(true)
    const [allowsResolutionSelection, setAllowsResolutionSelection] = useState(true)

    // Load style data
    const loadStyle = useCallback(async () => {
        try {
            const res = await fetch(`/api/styles/${styleId}`)
            const data = await res.json()
            
            if (data.status === 'success' && data.data) {
                const style: Style = data.data
                setName(style.name)
                setDescription(style.description)
                setPrompt(style.prompt)
                setCoverImage(style.coverImage)
                setReferenceImage(style.referenceImage)
                setStyleType(style.styleType || 'fabric-mockup')
                setRequiresFabricUpload(style.requiresFabricUpload !== false)
                setRequiresLogoUpload(style.requiresLogoUpload !== false)
                setRequiresCustomInstructions(style.requiresCustomInstructions !== false)
                setRequiresMannequinReference(style.requiresMannequinReference !== false)
                setAllowsResolutionSelection(style.allowsResolutionSelection !== false)
            } else {
                setError('Style not found')
            }
        } catch (err) {
            setError('Failed to load style')
        } finally {
            setLoading(false)
        }
    }, [styleId])

    useEffect(() => {
        loadStyle()
    }, [loadStyle])

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'cover' | 'reference'
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            if (type === 'cover') {
                setNewCoverImage(result)
            } else {
                setNewReferenceImage(result)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name || !prompt) {
            setError('Please fill in all required fields')
            return
        }

        setSaving(true)

        try {
            const res = await fetch(`/api/styles/${styleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    coverImage: newCoverImage || coverImage,
                    referenceImage: newReferenceImage || referenceImage,
                    prompt,
                    styleType,
                    requiresFabricUpload,
                    requiresLogoUpload,
                    requiresCustomInstructions,
                    requiresMannequinReference,
                    allowsResolutionSelection,
                }),
            })

            const data = await res.json()

            if (data.status === 'success') {
                router.push('/admin/styles')
            } else {
                setError(data.message || 'Failed to update style')
            }
        } catch (err) {
            setError('Failed to update style')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <ProtectedRoute adminOnly>
                <div className="flex min-h-screen bg-background">
                    <Sidebar />
                    <main className="flex-1 p-4 md:p-8 lg:p-12">
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute adminOnly>
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 p-4 md:p-8 lg:p-12">
                    <div className="max-w-4xl mx-auto">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin/styles')}
                            className="mb-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Styles
                        </Button>

                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Edit Style</h1>
                            <p className="text-muted-foreground">
                                Update this style template
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Style Name *
                                        </label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Fashion Mockup, Portrait Style, etc."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Description
                                        </label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe what this style does..."
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Style Type *
                                        </label>
                                        <Select value={styleType} onValueChange={setStyleType}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select style type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fabric-mockup">Fabric Mockup (with logo)</SelectItem>
                                                <SelectItem value="studio-portrait">Studio Portrait (person/photo)</SelectItem>
                                                <SelectItem value="style-transfer">Style Transfer Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Choose what type of style this is to control the UI shown to users.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-4">
                                            Configuration Options
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between space-x-2 bg-muted/50 p-3 rounded-lg">
                                                <div className="flex flex-col">
                                                    <Label htmlFor="fabric-upload" className="text-sm font-medium">Fabric Upload</Label>
                                                    <span className="text-xs text-muted-foreground">Show fabric pattern upload</span>
                                                </div>
                                                <Switch
                                                    id="fabric-upload"
                                                    checked={requiresFabricUpload}
                                                    onCheckedChange={setRequiresFabricUpload}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between space-x-2 bg-muted/50 p-3 rounded-lg">
                                                <div className="flex flex-col">
                                                    <Label htmlFor="logo-upload" className="text-sm font-medium">Logo Upload</Label>
                                                    <span className="text-xs text-muted-foreground">Show logo upload field</span>
                                                </div>
                                                <Switch
                                                    id="logo-upload"
                                                    checked={requiresLogoUpload}
                                                    onCheckedChange={setRequiresLogoUpload}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between space-x-2 bg-muted/50 p-3 rounded-lg">
                                                <div className="flex flex-col">
                                                    <Label htmlFor="custom-instructions" className="text-sm font-medium">Custom Instructions</Label>
                                                    <span className="text-xs text-muted-foreground">Show custom prompt field</span>
                                                </div>
                                                <Switch
                                                    id="custom-instructions"
                                                    checked={requiresCustomInstructions}
                                                    onCheckedChange={setRequiresCustomInstructions}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between space-x-2 bg-muted/50 p-3 rounded-lg">
                                                <div className="flex flex-col">
                                                    <Label htmlFor="mannequin-ref" className="text-sm font-medium">Mannequin Reference</Label>
                                                    <span className="text-xs text-muted-foreground">Show mannequin template</span>
                                                </div>
                                                <Switch
                                                    id="mannequin-ref"
                                                    checked={requiresMannequinReference}
                                                    onCheckedChange={setRequiresMannequinReference}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between space-x-2 bg-muted/50 p-3 rounded-lg">
                                                <div className="flex flex-col">
                                                    <Label htmlFor="resolution" className="text-sm font-medium">Resolution Options</Label>
                                                    <span className="text-xs text-muted-foreground">Show 1K/2K/4K selection</span>
                                                </div>
                                                <Switch
                                                    id="resolution"
                                                    checked={allowsResolutionSelection}
                                                    onCheckedChange={setAllowsResolutionSelection}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Default AI Prompt *
                                        </label>
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Enter the AI prompt that will be used to generate images with this style..."
                                            rows={5}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This prompt will be used as the base instruction for the AI. Users can add custom prompts on top of this.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <label className="block text-sm font-medium mb-2">
                                            Cover Image (Preview)
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'cover')}
                                                className="hidden"
                                                id="cover-upload"
                                            />
                                            <label htmlFor="cover-upload" className="cursor-pointer">
                                                {newCoverImage || coverImage ? (
                                                    <div className="relative aspect-square">
                                                        <Image
                                                            src={newCoverImage || coverImage || ''}
                                                            alt="Cover"
                                                            fill
                                                            className="object-cover rounded-lg"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="py-12">
                                                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Upload cover image
                                                        </p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        {(newCoverImage || coverImage) && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Click image to change
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <label className="block text-sm font-medium mb-2">
                                            Reference Image (Style Source)
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'reference')}
                                                className="hidden"
                                                id="reference-upload"
                                            />
                                            <label htmlFor="reference-upload" className="cursor-pointer">
                                                {newReferenceImage || referenceImage ? (
                                                    <div className="relative aspect-square">
                                                        <Image
                                                            src={newReferenceImage || referenceImage || ''}
                                                            alt="Reference"
                                                            fill
                                                            className="object-cover rounded-lg"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="py-12">
                                                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Upload reference image
                                                        </p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        {(newReferenceImage || referenceImage) && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Click image to change
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/admin/styles')}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="flex-1">
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
