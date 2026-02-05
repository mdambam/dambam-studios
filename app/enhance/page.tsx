'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { UploadCard } from '@/components/upload-card'
import { SliderSet } from '@/components/slider-set'
import { composeFinalPrompt, imageToBase64 } from '@/lib/prompt-helper'
import { SliderValues } from '@/lib/types'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export default function EnhancePage() {
  type EnhanceStyle = {
    id: string
    name: string
    description: string
    coverImage: string
    prompt: string
  }

  const [enhanceStyles, setEnhanceStyles] = useState<EnhanceStyle[]>([])
  const [loadingEnhanceStyles, setLoadingEnhanceStyles] = useState(true)
  const [selectedEnhanceStyleId, setSelectedEnhanceStyleId] = useState<string | null>(null)

  const selectedEnhanceStyle = useMemo(
    () => enhanceStyles.find((s) => s.id === selectedEnhanceStyleId) ?? null,
    [enhanceStyles, selectedEnhanceStyleId],
  )

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [highRes, setHighRes] = useState(true)
  const [enableSliders, setEnableSliders] = useState(false)
  const [sliders, setSliders] = useState<SliderValues>({
    realism: 50,
    stylization: 50,
    closeup: 50,
    complexity: 50,
    lighting: 50,
  })
  const [faceDirection, setFaceDirection] = useState('forward')
  const [keepAppearance, setKeepAppearance] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const [swapReferenceFile, setSwapReferenceFile] = useState<File | null>(null)
  const [swapReferencePreview, setSwapReferencePreview] = useState<string | null>(null)
  const [swapUserFile, setSwapUserFile] = useState<File | null>(null)
  const [swapUserPreview, setSwapUserPreview] = useState<string | null>(null)
  const [swapPrompt, setSwapPrompt] = useState('')
  const [swapHighRes, setSwapHighRes] = useState(true)
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapResult, setSwapResult] = useState<string | null>(null)

  const { refreshUser } = useAuth()

  useEffect(() => {
    const fetchEnhanceStyles = async () => {
      try {
        setLoadingEnhanceStyles(true)
        const res = await fetch('/api/enhance-styles', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.status !== 'success') {
          throw new Error(data?.message || 'Failed to load enhance styles')
        }

        const list = Array.isArray(data?.data) ? data.data : []
        setEnhanceStyles(list)
        if (list.length > 0) {
          setSelectedEnhanceStyleId(list[0].id)
        }
      } catch (error) {
        console.error('Failed to load enhance styles:', error)
        setEnhanceStyles([])
      } finally {
        setLoadingEnhanceStyles(false)
      }
    }

    fetchEnhanceStyles()
  }, [])

  const handleImageSelect = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSwapReferenceSelect = (file: File) => {
    setSwapReferenceFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setSwapReferencePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSwapUserSelect = (file: File) => {
    setSwapUserFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setSwapUserPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSwapReset = () => {
    setSwapReferenceFile(null)
    setSwapReferencePreview(null)
    setSwapUserFile(null)
    setSwapUserPreview(null)
    setSwapResult(null)
  }

  const handleIdentitySwap = async () => {
    if (!swapReferenceFile || !swapReferencePreview || !swapUserFile || !swapUserPreview) return

    setSwapLoading(true)
    try {
      const response = await fetch('/api/image/identity-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referenceImage: swapReferencePreview,
          userImage: swapUserPreview,
          userPrompt: swapPrompt,
          highRes: swapHighRes,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.status !== 'success') {
        throw new Error(data?.message || 'Identity swap failed')
      }

      if (data?.data?.image) {
        setSwapResult(data.data.image)
        await refreshUser()
      } else {
        throw new Error(data?.message || 'Identity swap failed')
      }
    } catch (error: any) {
      console.error('Identity swap failed:', error)
      alert('❌ ERROR: ' + (error?.message || 'Identity swap failed'))
    } finally {
      setSwapLoading(false)
    }
  }


  const handleRemoveImage = () => {
    setImageFile(null)
    setPreview(null)
    setResult(null)
  }

  const handleSliderChange = (key: string, value: number) => {
    setSliders(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleEnhance = async () => {
    if (!imageFile) return
    if (!selectedEnhanceStyle) return

    setLoading(true)
    try {
      const base64 = await imageToBase64(imageFile)
      const styleName = selectedEnhanceStyle.name
      const stylePrompt = selectedEnhanceStyle.prompt
      const finalPrompt = composeFinalPrompt(
        stylePrompt,
        userPrompt,
        enableSliders ? sliders : null,
        faceDirection,
        keepAppearance
      )

      console.log("🚀 Sending request to backend...");

      const response = await fetch('/api/image/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image: base64,
          prompt: finalPrompt,
          styleName,
          sliders: enableSliders ? sliders : null,
          highRes,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.message || 'Enhancement failed')
      }

      if (data?.status === 'success' && data?.data?.enhancedImage) {
        setResult(data.data.enhancedImage)
        await refreshUser()
      } else {
        throw new Error(data?.message || 'Enhancement failed')
      }

    } catch (error: any) {
      console.error('Enhancement failed:', error)
      alert("❌ ERROR: " + error.message); // Show the real error!
      // setResult(preview) // <--- WE REMOVED THE SAFETY NET
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Enhance Image</h1>
            <p className="text-foreground/60 mb-8">Transform your photo into studio-quality</p>

            <Tabs defaultValue="enhance" className="w-full">
              <TabsList>
                <TabsTrigger value="enhance">Enhance</TabsTrigger>
                <TabsTrigger value="swap">Custom Swap</TabsTrigger>
              </TabsList>

              <TabsContent value="enhance" className="mt-6">
                {!result ? (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <UploadCard onImageSelect={handleImageSelect} preview={preview} onRemove={handleRemoveImage} />
                    </div>

                    <div className="space-y-6">
                      <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium">Choose a style</p>
                            <p className="text-xs text-foreground/60">Pick a preset (admin-managed) before enhancing.</p>
                          </div>
                        </div>

                        {loadingEnhanceStyles ? (
                          <div className="text-sm text-foreground/60">Loading styles…</div>
                        ) : enhanceStyles.length === 0 ? (
                          <div className="text-sm text-foreground/60">No enhance styles yet. Ask an admin to create one.</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {enhanceStyles.map((style) => {
                              const active = style.id === selectedEnhanceStyleId
                              return (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() => setSelectedEnhanceStyleId(style.id)}
                                  className={`rounded-xl border overflow-hidden text-left transition ${
                                    active ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
                                  }`}
                                >
                                  <div className="h-24 bg-muted">
                                    <img src={style.coverImage} alt={style.name} className="h-24 w-full object-cover" />
                                  </div>
                                  <div className="p-3">
                                    <p className="text-sm font-semibold">{style.name}</p>
                                    <p className="mt-1 text-xs text-foreground/60 line-clamp-2">{style.description}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <label className="text-sm font-medium block mb-3">Additional Prompt</label>
                        <textarea
                          value={userPrompt}
                          onChange={(e) => setUserPrompt(e.target.value)}
                          placeholder="studio quality, professional lighting, sharp details..."
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          rows={4}
                        />
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <label className="text-sm font-medium block mb-3">Resolution</label>
                        <div className="flex items-center space-x-2 rounded-lg border border-border bg-muted/20 p-1">
                          <Button
                            type="button"
                            variant={!highRes ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setHighRes(false)}
                            className={`px-3 py-1.5 text-sm rounded-md ${!highRes ? '' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            1K
                          </Button>
                          <Button
                            type="button"
                            variant={highRes ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setHighRes(true)}
                            className={`px-3 py-1.5 text-sm rounded-md ${highRes ? '' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            2K (Best)
                          </Button>
                        </div>
                        <p className="text-xs text-foreground/60 mt-2">2K requests higher resolution and will upscale if needed.</p>
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <input
                            type="checkbox"
                            id="enable-sliders"
                            checked={enableSliders}
                            onChange={(e) => setEnableSliders(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="enable-sliders" className="text-sm font-medium cursor-pointer">
                            Enable Sliders
                          </label>
                        </div>

                        {enableSliders && <SliderSet values={sliders} onChange={handleSliderChange} />}
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <label className="text-sm font-medium block mb-3">Face Direction</label>
                        <select
                          value={faceDirection}
                          onChange={(e) => setFaceDirection(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="forward">Forward</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="three_quarters">Three-quarters</option>
                        </select>
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="keep-appearance"
                            checked={keepAppearance}
                            onChange={(e) => setKeepAppearance(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="keep-appearance" className="text-sm font-medium cursor-pointer">
                            Preserve Identity
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleEnhance}
                        disabled={!imageFile || !selectedEnhanceStyle || loading}
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {loading ? 'Enhancing...' : 'Enhance Image'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="font-bold mb-3">Original</h3>
                        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-background">
                          <img src={preview || "/placeholder.svg"} alt="Original" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold mb-3">Enhanced</h3>
                        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-background">
                          <img src={result || "/placeholder.svg"} alt="Enhanced" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = result
                          link.download = 'enhanced-image.png'
                          link.click()
                        }}
                        className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                      >
                        Download Result
                      </button>
                      <button
                        onClick={() => setResult(null)}
                        className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
                      >
                        New Image
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="swap" className="mt-6">
                {!swapResult ? (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">Reference image</h2>
                        <p className="text-sm text-foreground/60 mb-4">
                          Upload the reference photo (pose/background/style stays the same).
                        </p>
                        <UploadCard
                          onImageSelect={handleSwapReferenceSelect}
                          preview={swapReferencePreview}
                          onRemove={() => {
                            setSwapReferenceFile(null)
                            setSwapReferencePreview(null)
                          }}
                        />
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold mb-2">Your person</h2>
                        <p className="text-sm text-foreground/60 mb-4">Upload the person to insert into the reference.</p>
                        <UploadCard
                          onImageSelect={handleSwapUserSelect}
                          preview={swapUserPreview}
                          onRemove={() => {
                            setSwapUserFile(null)
                            setSwapUserPreview(null)
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-card rounded-xl border border-border p-6">
                        <label className="text-sm font-medium block mb-3">Extra prompt (optional)</label>
                        <textarea
                          value={swapPrompt}
                          onChange={(e) => setSwapPrompt(e.target.value)}
                          placeholder="e.g. keep lighting exactly; match skin tone; clean output"
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          rows={4}
                        />
                      </div>

                      <div className="bg-card rounded-xl border border-border p-6">
                        <label className="text-sm font-medium block mb-3">Resolution</label>
                        <div className="flex items-center space-x-2 rounded-lg border border-border bg-muted/20 p-1">
                          <Button
                            type="button"
                            variant={!swapHighRes ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSwapHighRes(false)}
                            className={`px-3 py-1.5 text-sm rounded-md ${!swapHighRes ? '' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            1K
                          </Button>
                          <Button
                            type="button"
                            variant={swapHighRes ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSwapHighRes(true)}
                            className={`px-3 py-1.5 text-sm rounded-md ${swapHighRes ? '' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            2K (Best)
                          </Button>
                        </div>
                        <p className="text-xs text-foreground/60 mt-2">2K requests higher resolution and will upscale if needed.</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleIdentitySwap}
                          disabled={!swapReferenceFile || !swapUserFile || swapLoading}
                          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {swapLoading ? 'Swapping…' : 'Swap person'}
                        </button>
                        <button
                          onClick={handleSwapReset}
                          disabled={!swapReferenceFile && !swapUserFile && !swapResult}
                          className="w-full py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-xl overflow-hidden border border-border bg-background">
                      <img src={swapResult || "/placeholder.svg"} alt="Swapped" className="w-full h-auto object-cover" />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = swapResult
                          link.download = 'identity-swap.png'
                          link.click()
                        }}
                        className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                      >
                        Download Result
                      </button>
                      <button
                        onClick={() => setSwapResult(null)}
                        className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleSwapReset}
                        className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
                      >
                        New Images
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
