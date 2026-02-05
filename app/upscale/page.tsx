'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Sidebar } from '@/components/sidebar'
import { UploadCard } from '@/components/upload-card'
import { imageToBase64 } from '@/lib/prompt-helper'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function UpscalePage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [factor, setFactor] = useState<'2' | '4'>('2')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { refreshUser } = useAuth()

  const handleImageSelect = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpscale = async () => {
    if (!imageFile) return
    setLoading(true)
    try {
      const base64 = await imageToBase64(imageFile)
      const response = await fetch('/api/image/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: base64, scale: factor === '4' ? 4 : 2 }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.message || 'Upscale failed')
      }

      if (data?.status === 'success' && data?.data?.image) {
        setResult(data.data.image)
        await refreshUser()
      } else {
        throw new Error(data?.message || 'Upscale failed')
      }
    } catch (error) {
      console.error('Upscale failed:', error)
      alert(error instanceof Error ? error.message : 'Upscale failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Upscale Image</h1>
            <p className="text-foreground/60 mb-8">Increase resolution without losing quality</p>

            {!result ? (
              <div className="space-y-6">
                <UploadCard
                  onImageSelect={handleImageSelect}
                  preview={preview}
                  onRemove={() => {
                    setImageFile(null)
                    setPreview(null)
                  }}
                />

                <div className="bg-card rounded-xl border border-border p-6">
                  <label className="text-sm font-medium block mb-3">Upscale Factor</label>
                  <div className="flex gap-4">
                    {['2', '4'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFactor(f as '2' | '4')}
                        className={`flex-1 py-2 rounded-lg border transition font-medium ${
                          factor === f
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-foreground hover:border-primary/30'
                        }`}
                      >
                        {f}x
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleUpscale}
                  disabled={!imageFile || loading}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? 'Upscaling...' : 'Upscale Image'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={result || "/placeholder.svg"} alt="Upscaled" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                    Download
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
                  >
                    Upscale Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
