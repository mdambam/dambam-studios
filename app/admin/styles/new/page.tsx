'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewStylePage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [prompt, setPrompt] = useState('')
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [referenceImage, setReferenceImage] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Style configuration
    const [styleType, setStyleType] = useState('fabric-mockup')
    const [requiresFabricUpload, setRequiresFabricUpload] = useState(true)
    const [requiresLogoUpload, setRequiresLogoUpload] = useState(true)
    const [requiresCustomInstructions, setRequiresCustomInstructions] = useState(true)
    const [requiresMannequinReference, setRequiresMannequinReference] = useState(true)
    const [allowsResolutionSelection, setAllowsResolutionSelection] = useState(true)

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
                setCoverImage(result)
            } else {
                setReferenceImage(result)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name || !coverImage || !referenceImage || !prompt) {
            setError('Please fill in all required fields')
            return
        }

        setCreating(true)

        try {
            const res = await fetch('/api/styles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    coverImage,
                    referenceImage,
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
                setError(data.message || 'Failed to create style')
            }
        } catch (err) {
            setError('Failed to create style')
        } finally {
            setCreating(false)
        }
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
                            <h1 className="text-3xl font-bold mb-2">Create New Style</h1>
                            <p className="text-muted-foreground">
                                Add a new style template for users to transform their images
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
                                            Cover Image * (Preview)
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'cover')}
                                                className="hidden"
                                                id="cover-upload"
                                                required
                                            />
                                            <label htmlFor="cover-upload" className="cursor-pointer">
                                                {coverImage ? (
                                                    <div className="relative aspect-square">
                                                        <Image
                                                            src={coverImage}
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
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <label className="block text-sm font-medium mb-2">
                                            Reference Image * (Style Source)
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'reference')}
                                                className="hidden"
                                                id="reference-upload"
                                                required
                                            />
                                            <label htmlFor="reference-upload" className="cursor-pointer">
                                                {referenceImage ? (
                                                    <div className="relative aspect-square">
                                                        <Image
                                                            src={referenceImage}
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
                                    disabled={creating}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creating} className="flex-1">
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Style'
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
