'use client'

import { useCallback, useEffect, useMemo, useState, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'

interface Style {
  id: string
  name: string
  description: string
  coverImage?: string
  exampleBeforeImage?: string
  exampleAfterImage?: string
  referenceImage?: string
  prompt?: string
  styleType?: string | null
  requiresFabricUpload?: boolean | null
  requiresLogoUpload?: boolean | null
  requiresCustomInstructions?: boolean | null
  requiresMannequinReference?: boolean | null
  allowsResolutionSelection?: boolean | null
}

type HistoryItem = { url: string; createdAt?: string }
type UploadState = 'idle' | 'preview' | 'generating'

// Get UI labels based on style type
function getStyleLabels(styleType: string | null | undefined) {
  switch (styleType) {
    case 'studio-portrait':
      return {
        title: 'Studio Portrait',
        subtitle: 'Transform your photo into a professional studio portrait',
        mainUploadLabel: 'Your Photo',
        mainUploadDescription: 'Upload a photo of yourself to transform',
        secondaryUploadLabel: null,
        secondaryUploadDescription: null,
        resultLabel: 'Studio Portrait',
        generateButton: 'Generate Portrait',
        emptyStateText: 'No photo uploaded yet',
        referenceLabel: 'Sample Portrait',
        referenceDescription: 'Example of the studio portrait style',
        showReference: true,
      }
    case 'style-transfer':
      return {
        title: 'Style Transfer',
        subtitle: 'Apply artistic style to your images',
        mainUploadLabel: 'Your Image',
        mainUploadDescription: 'Upload an image to apply the style',
        secondaryUploadLabel: null,
        secondaryUploadDescription: null,
        resultLabel: 'Styled Image',
        generateButton: 'Apply Style',
        emptyStateText: 'No image uploaded yet',
        referenceLabel: 'Style Example',
        referenceDescription: 'Example of the artistic style',
        showReference: true,
      }
    case 'fabric-mockup':
    default:
      return {
        title: 'Fabric Mockup',
        subtitle: 'Create mannequin mockups with your fabric and logo',
        mainUploadLabel: 'Fabric Pattern',
        mainUploadDescription: 'Upload your fabric texture or pattern',
        secondaryUploadLabel: 'Logo',
        secondaryUploadDescription: 'Upload your brand logo',
        resultLabel: 'Mockup Result',
        generateButton: 'Create Mockup',
        emptyStateText: 'No fabric uploaded yet',
        referenceLabel: 'Mannequin Reference',
        referenceDescription: 'The mannequin template used for mockups',
        showReference: true,
      }
  }
}

// Memoized Style Image Component
const StyleImage = memo(function StyleImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
    </>
  )
})

export default function StudioPage() {
  const { toast } = useToast()
  const { refreshUser } = useAuth()
  const [styles, setStyles] = useState<Style[]>([])
  const [loadingStyles, setLoadingStyles] = useState(true)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [fabricFile, setFabricFile] = useState<File | null>(null)
  const [fabricPreviewUrl, setFabricPreviewUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [resolutionChoice, setResolutionChoice] = useState<'1k' | '2k' | '4k'>('1k')
  const [userPrompt, setUserPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const selectedStyle = useMemo(() => styles.find((s) => s.id === selectedStyleId) ?? null, [styles, selectedStyleId])
  const labels = useMemo(() => getStyleLabels(selectedStyle?.styleType), [selectedStyle?.styleType])
  const totalPrice = useMemo(() => ({ '4k': 500, '2k': 300, '1k': 100 }[resolutionChoice]), [resolutionChoice])

  const styleType = selectedStyle?.styleType ?? 'fabric-mockup'
  const isFabricMockup = styleType === 'fabric-mockup'

  // Studio portrait + style transfer always need a single uploaded image.
  const showMainUpload = Boolean(selectedStyle) && (!isFabricMockup || selectedStyle?.requiresFabricUpload !== false)
  const showLogoUpload = Boolean(selectedStyle) && isFabricMockup && selectedStyle?.requiresLogoUpload !== false
  const showCustomInstructions = selectedStyle?.requiresCustomInstructions !== false
  const showResolutionSelection = selectedStyle?.allowsResolutionSelection !== false

  // Load styles with caching
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const cached = sessionStorage.getItem('studio_styles_v2')
        const cachedTime = sessionStorage.getItem('studio_styles_time_v2')
        if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 120000) {
          const data = JSON.parse(cached)
          setStyles(data)
          setSelectedStyleId(data[0]?.id || null)
          setLoadingStyles(false)
          return
        }
        
        const res = await fetch('/api/styles')
        const data = await res.json()
        if (data.status === 'success') {
          setStyles(data.data)
          setSelectedStyleId(data.data[0]?.id || null)
          sessionStorage.setItem('studio_styles_v2', JSON.stringify(data.data))
          sessionStorage.setItem('studio_styles_time_v2', Date.now().toString())
        }
      } catch (e) { console.error('Failed to load styles:', e) }
      finally { setLoadingStyles(false) }
    }
    fetchStyles()
  }, [])

  // Fetch full style details when selection changes (for example images)
  useEffect(() => {
    if (!selectedStyleId) return
    
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/styles/${selectedStyleId}`)
        const data = await res.json()
        if (res.ok && data?.status === 'success' && data?.data) {
          const fullStyle = data.data as Style
          setStyles((prev) => prev.map((s) => (s.id === selectedStyleId ? { ...s, ...fullStyle } : s)))
        }
      } catch (e) {
        console.error('Failed to load style details:', e)
      }
    }
    
    fetchDetails()
  }, [selectedStyleId])

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const res = await fetch('/api/user/history', { credentials: 'include' })
      const data = await res.json()
      if (data?.status === 'success') {
        setHistoryItems(Array.isArray(data?.data?.history) ? data.data.history.slice(0, 4) : [])
      }
    } catch (e) { console.error('Failed to load history:', e) }
    finally { setLoadingHistory(false) }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleFabricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFabricFile(file || null)
    if (file) {
      setFabricPreviewUrl(URL.createObjectURL(file))
      setUploadState('preview')
    } else {
      setFabricPreviewUrl(null)
      setUploadState('idle')
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLogoFile(file || null)
    setLogoPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleGenerate = async () => {
    if (!selectedStyle) return
    try {
      setUploadState('generating')
      setGeneratedImage(null)
      
      const mainDataUrl = fabricFile && showMainUpload ? await fileToDataUrl(fabricFile) : ''
      const logoDataUrl = logoFile && showLogoUpload ? await fileToDataUrl(logoFile) : ''

      if (showMainUpload && !mainDataUrl) {
        throw new Error('Please upload an image first')
      }

      const requestBody: any = {
        styleId: selectedStyle.id,
        userPrompt,
        resolutionChoice,
      }

      if (isFabricMockup) {
        requestBody.fabricImage = mainDataUrl
        requestBody.logoImage = logoDataUrl
      } else {
        requestBody.image = mainDataUrl
      }
      
      const res = await fetch('/api/image/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })
      const data = await res.json()
      if (!res.ok || data?.status !== 'success') throw new Error(data?.message || 'Generation failed')
      
      setGeneratedImage(data?.data?.image || null)
      if (data?.data?.image) {
        setHistoryItems((prev) => [{ url: data.data.image, createdAt: new Date().toISOString() }, ...prev].slice(0, 4))
      }
      refreshUser()
      toast({ title: 'Generated', description: 'Your image is ready.' })
    } catch (error: any) {
      toast({ title: 'Generation failed', description: error?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setUploadState('preview')
    }
  }

  const downloadImage = async (url: string) => {
    const blob = await fetch(url).then((r) => r.blob())
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `generated-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const resetUpload = () => {
    setFabricFile(null)
    setFabricPreviewUrl(null)
    setLogoFile(null)
    setLogoPreviewUrl(null)
    setGeneratedImage(null)
    setUploadState('idle')
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <header className="flex flex-col gap-3">
              <Badge className="w-fit" variant="secondary">{labels.title}</Badge>
              <h1 className="text-3xl font-bold tracking-tight">{labels.subtitle}</h1>
              {selectedStyle && (
                <p className="max-w-2xl text-muted-foreground">{selectedStyle.description}</p>
              )}
            </header>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              {/* Styles Panel */}
              <Card className="h-fit">
                <CardHeader className="border-b pb-6">
                  <CardTitle className="text-xl">Browse styles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingStyles ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="animate-pulse rounded-xl border p-4">
                          <Skeleton className="h-32 rounded-lg" />
                          <Skeleton className="mt-4 h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Tabs value={selectedStyleId || ''} onValueChange={setSelectedStyleId}>
                      <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
                        {styles.map((s) => (
                          <TabsTrigger key={s.id} value={s.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{s.name}</TabsTrigger>
                        ))}
                      </TabsList>
                      {styles.map((style) => (
                        <TabsContent key={style.id} value={style.id} className="mt-6">
                          {(() => {
                            const localLabels = getStyleLabels(style.styleType)
                            const showReference =
                              style.requiresMannequinReference !== false &&
                              localLabels.showReference &&
                              Boolean(style.exampleBeforeImage || style.exampleAfterImage)

                            return (
                          <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                              <div className="overflow-hidden rounded-xl border">
                                {style.coverImage ? (
                                  <StyleImage src={style.coverImage} alt={style.name} className="h-56 w-full object-cover" />
                                ) : (
                                  <div className="flex h-56 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                                    No preview
                                  </div>
                                )}
                              </div>
                              <h2 className="text-xl font-semibold">{style.name}</h2>
                              <p className="text-sm text-muted-foreground">{style.description}</p>
                            </div>
                            {showReference && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">{localLabels.referenceLabel}</p>
                                <div className="grid gap-3">
                                  {style.exampleBeforeImage && (
                                    <figure className="overflow-hidden rounded-lg border">
                                      <StyleImage src={style.exampleBeforeImage} alt="Before" className="h-40 w-full object-cover" />
                                      <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">Before</figcaption>
                                    </figure>
                                  )}
                                  {style.exampleAfterImage && (
                                    <figure className="overflow-hidden rounded-lg border">
                                      <StyleImage src={style.exampleAfterImage} alt="After" className="h-40 w-full object-cover" />
                                      <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">After</figcaption>
                                    </figure>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{localLabels.referenceDescription}</p>
                              </div>
                            )}
                          </div>
                            )
                          })()}
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </CardContent>
              </Card>

              {/* Upload & Generate Panel */}
              <Card className="sticky top-6 h-fit">
                <CardHeader className="border-b pb-6">
                  <CardTitle className="text-xl">Upload & generate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Upload (Photo/Image/Fabric) */}
                  {showMainUpload && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">{labels.mainUploadLabel}</p>
                      <Input type="file" accept="image/*" onChange={handleFabricChange} />
                      <p className="text-xs text-muted-foreground">{labels.mainUploadDescription}</p>
                    </div>
                  )}

                  {/* Secondary Upload (Logo) */}
                  {showLogoUpload && labels.secondaryUploadLabel && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">{labels.secondaryUploadLabel}</p>
                      <Input type="file" accept="image/*" onChange={handleLogoChange} />
                      <p className="text-xs text-muted-foreground">{labels.secondaryUploadDescription}</p>
                    </div>
                  )}

                  {/* Logo Preview */}
                  {showLogoUpload && logoPreviewUrl && (
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <p className="text-sm font-medium">Logo preview</p>
                      <img src={logoPreviewUrl} alt="Logo" className="h-12 w-12 object-contain" />
                    </div>
                  )}

                  {/* Main Preview */}
                  {showMainUpload && (
                    fabricPreviewUrl ? (
                      <div className="overflow-hidden rounded-xl border">
                        <img src={fabricPreviewUrl} alt="Preview" className="h-60 w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-60 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                        {labels.emptyStateText}
                      </div>
                    )
                  )}

                  {/* Custom Instructions */}
                  {showCustomInstructions && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Custom Instructions (Optional)</p>
                      <Textarea 
                        value={userPrompt} 
                        onChange={(e) => setUserPrompt(e.target.value)} 
                        placeholder="Add any specific instructions for the AI..."
                        rows={3} 
                      />
                    </div>
                  )}

                  {/* Resolution Selection */}
                  {showResolutionSelection && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Resolution</p>
                      <div className="flex space-x-2 rounded-lg border bg-muted/20 p-1">
                        {(['1k', '2k', '4k'] as const).map((res) => (
                          <Button key={res} type="button" variant={resolutionChoice === res ? 'default' : 'ghost'} size="sm" onClick={() => setResolutionChoice(res)}>
                            {res.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="rounded-lg border bg-primary/10 p-4 text-center">
                    <p className="text-sm font-medium">Price</p>
                    <p className="text-2xl font-bold text-primary">{totalPrice} credits</p>
                  </div>

                  {/* Generate Button */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1" 
                      onClick={handleGenerate} 
                      disabled={uploadState === 'generating' || (showMainUpload && !fabricFile) || (showLogoUpload && !logoFile)}
                    >
                      {uploadState === 'generating' ? 'Generating…' : labels.generateButton}
                    </Button>
                    <Button variant="outline" onClick={resetUpload}>Reset</Button>
                  </div>

                  {/* Result Section */}
                  <AnimatePresence mode="wait">
                    {generatedImage && (
                      <motion.div key={generatedImage} className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <p className="text-sm font-medium">{labels.resultLabel}</p>
                        <Button className="w-full" variant="outline" onClick={() => downloadImage(generatedImage)}>Download</Button>
                        <div className="overflow-hidden rounded-xl border">
                          <img src={generatedImage} alt="Generated" className="h-60 w-full object-cover" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* History */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Recent</p>
                      <Button variant="ghost" size="sm" onClick={loadHistory}>Refresh</Button>
                    </div>
                    {loadingHistory ? (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Loading…</div>
                    ) : historyItems.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">No generations yet</div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {historyItems.map((item) => (
                          <button key={item.url} type="button" className="overflow-hidden rounded-xl border text-left" onClick={() => setGeneratedImage(item.url)}>
                            <div className="h-24 w-full overflow-hidden bg-muted">
                              <img src={item.url} alt="History" className="h-full w-full object-cover" loading="lazy" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
