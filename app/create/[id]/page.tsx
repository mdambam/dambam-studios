'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, Wand2, Loader2, Download } from 'lucide-react'
import Image from 'next/image'

interface Style {
    id: string
    name: string
    description: string
    coverImage: string
    referenceImage: string
    prompt: string
}

export default function StyleGeneratorPage() {
    const params = useParams()
    const router = useRouter()
    const styleId = params.id as string

    const [style, setStyle] = useState<Style | null>(null)
    const [loading, setLoading] = useState(true)

    // Fabric mockup mode
    const [fabricImage, setFabricImage] = useState<string | null>(null)
    const [logoImage, setLogoImage] = useState<string | null>(null)
    const [customPrompt, setCustomPrompt] = useState('')
    const [resolutionChoice, setResolutionChoice] = useState<'1k' | '2k' | '4k'>('1k')

    const [generating, setGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStyle()
    }, [styleId])

    const fetchStyle = async () => {
        try {
            const res = await fetch(`/api/styles/${styleId}`)
            const data = await res.json()

            if (data.status === 'success') {
                setStyle(data.data)
            } else {
                setError('Style not found')
            }
        } catch (err) {
            setError('Failed to load style')
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'fabric' | 'logo') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            if (type === 'fabric') setFabricImage(result)
            else if (type === 'logo') setLogoImage(result)
            setGeneratedImage(null)
        }
        reader.readAsDataURL(file)
    }

    const totalPrice = resolutionChoice === '4k' ? 500 : resolutionChoice === '2k' ? 300 : 100

    const handleGenerate = async () => {
        if (!style) return
        if (!fabricImage || !logoImage) return

        setGenerating(true)
        setError(null)

        try {
            const res = await fetch('/api/image/style-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    styleId: style.id,
                    fabricImage,
                    logoImage,
                    userPrompt: customPrompt,
                    resolutionChoice,
                }),
            })

            const data = await res.json()

            if (!res.ok || data?.status !== 'success') {
                throw new Error(data?.message || 'Generation failed')
            }

            setGeneratedImage(data?.data?.image || null)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate image'
            setError(errorMessage)
        } finally {
            setGenerating(false)
        }
    }

    const handleDownload = () => {
        if (!generatedImage) return
        const link = document.createElement('a')
        link.href = generatedImage
        link.download = `${style?.name || 'styled'}-${Date.now()}.png`
        link.click()
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex min-h-screen bg-background items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </ProtectedRoute>
        )
    }

    if (error && !style) {
        return (
            <ProtectedRoute>
                <div className="flex min-h-screen bg-background">
                    <Sidebar />
                    <main className="flex-1 p-4 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <Button variant="ghost" onClick={() => router.push('/create')} className="mb-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Styles
                            </Button>
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
                                {error}
                            </div>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <Button variant="ghost" onClick={() => router.push('/create')} className="mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Styles
                        </Button>

                        <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{style?.name}</h1>
                        <p className="text-muted-foreground">{style?.description}</p>
                    </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-2">Fabric Pattern</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Upload your fabric texture or pattern</p>
                                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'fabric')}
                                                className="hidden"
                                                id="fabric-upload"
                                            />
                                            <label htmlFor="fabric-upload" className="cursor-pointer">
                                                {fabricImage ? (
                                                    <div className="relative aspect-square max-w-xs mx-auto">
                                                        <Image src={fabricImage} alt="Fabric" fill className="object-contain rounded-lg" />
                                                    </div>
                                                ) : (
                                                    <div className="py-8">
                                                        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">Upload fabric</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-2">Logo</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Upload your brand logo</p>
                                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'logo')}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <label htmlFor="logo-upload" className="cursor-pointer">
                                                {logoImage ? (
                                                    <div className="relative aspect-square max-w-xs mx-auto">
                                                        <Image src={logoImage} alt="Logo" fill className="object-contain rounded-lg" />
                                                    </div>
                                                ) : (
                                                    <div className="py-8">
                                                        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">Upload logo</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <label className="block text-sm font-medium mb-2">
                                            Custom Instructions (Optional)
                                        </label>
                                        <Textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="Add specific requirements for the mockup..."
                                            rows={3}
                                            className="resize-none"
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <p className="text-sm font-medium mb-3">Resolution</p>
                                        <div className="flex items-center space-x-2 rounded-lg border border-border bg-muted/20 p-1">
                                            <Button
                                                type="button"
                                                variant={resolutionChoice === '1k' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setResolutionChoice('1k')}
                                            >
                                                1K
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={resolutionChoice === '2k' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setResolutionChoice('2k')}
                                            >
                                                2K
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={resolutionChoice === '4k' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setResolutionChoice('4k')}
                                            >
                                                4K
                                            </Button>
                                        </div>
                                        <div className="mt-4 rounded-lg border bg-primary/10 p-4 text-center">
                                            <p className="text-sm font-medium">Price</p>
                                            <p className="text-2xl font-bold text-primary">{totalPrice} credits</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={!fabricImage || !logoImage || generating}
                                    className="w-full"
                                    size="lg"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating Mockup...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Create Mockup
                                        </>
                                    )}
                                </Button>

                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Mockup Result</h3>
                                    <div className="border border-border rounded-lg p-4 min-h-[600px] flex items-center justify-center bg-muted/20">
                                        {generatedImage ? (
                                            <div className="w-full">
                                                <div className="relative aspect-square max-w-md mx-auto mb-4">
                                                    <Image src={generatedImage} alt="Mockup" fill className="object-contain rounded-lg" />
                                                </div>
                                                <Button onClick={handleDownload} className="w-full" variant="outline">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Mockup
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-center">
                                                Your mockup will appear here
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Reference Preview */}
                        <Card className="mt-6">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4">Mannequin Reference</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This is the mannequin template used for mockups
                                </p>
                                <div className="relative aspect-video max-w-md mx-auto">
                                    {style?.referenceImage ? (
                                        <Image
                                            src={style.referenceImage}
                                            alt="Reference"
                                            fill
                                            className="object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            No reference image
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
