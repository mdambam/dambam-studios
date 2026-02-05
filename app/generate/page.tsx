"use client"

import { ProtectedRoute } from '@/components/protected-route'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Monitor, Smartphone, Square, Film, Instagram, ArrowLeft, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [highRes, setHighRes] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const { refreshUser } = useAuth()
  const router = useRouter()

  const aspectRatioOptions = [
    { value: '1:1', label: 'Square', icon: Square },
    { value: '16:9', label: 'Wide', icon: Monitor },
    { value: '9:16', label: 'Portrait', icon: Smartphone },
    { value: '4:5', label: 'Instagram', icon: Instagram },
    { value: '9:21', label: 'Story', icon: Film },
  ]

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          prompt,
          highRes,
          aspectRatio 
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Generation failed');
      }

      if (data?.status === 'success' && data?.data?.image) {
        setResult(data.data.image);
        await refreshUser();
      } else {
        throw new Error(data?.message || 'Generation failed')
      }

    } catch (error) {
      console.error('🔥 Network/Code Failed:', error);
      alert(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f1e9]">
        {/* Top Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">ImageGen</h1>
            <div className="w-20"></div>
          </div>
        </div>

        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">Generate Image</h2>
              <p className="text-gray-600">Create images from text descriptions</p>
            </div>

            {!result ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6 shadow-sm">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium block mb-3 text-gray-700">Describe your image</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="A serene mountain landscape at sunset with warm orange and pink colors..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#81b441]/30 resize-none transition-colors"
                      rows={6}
                    />
                  </div>

                  {/* Resolution Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Resolution</label>
                      <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
                        <Button
                          variant={!highRes ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setHighRes(false)}
                          className={cn(
                            "px-4 py-1.5 text-sm rounded-lg transition-all",
                            !highRes 
                              ? 'bg-[#81b441] text-white shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                          )}
                        >
                          Standard (1K)
                        </Button>
                        <Button
                          variant={highRes ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setHighRes(true)}
                          className={cn(
                            "px-4 py-1.5 text-sm rounded-lg transition-all",
                            highRes 
                              ? 'bg-[#81b441] text-white shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                          )}
                        >
                          High Res (2K)
                        </Button>
                      </div>
                    </div>

                    {/* Aspect Ratio Selector */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium block text-gray-700">Aspect Ratio</label>
                      <div className="grid grid-cols-5 gap-2">
                        {aspectRatioOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = aspectRatio === option.value;
                          return (
                            <Button
                              key={option.value}
                              variant="ghost"
                              onClick={() => setAspectRatio(option.value)}
                              className={cn(
                                "flex flex-col items-center justify-center h-16 rounded-xl transition-all",
                                isActive 
                                  ? 'bg-[#81b441] text-white shadow-sm' 
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                              )}
                            >
                              <Icon className="w-5 h-5 mb-1" />
                              <span className="text-xs font-medium">{option.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt || loading}
                    className="w-full py-3 rounded-xl bg-[#81b441] text-white font-semibold hover:bg-[#72a136] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </span>
                    ) : 'Generate Image'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <img 
                    src={result} 
                    alt="Generated" 
                    className="w-full h-auto object-cover" 
                  />
                </div>
                <div className="flex gap-4">
                  <Button 
                    className="flex-1 py-3 rounded-xl bg-[#81b441] text-white font-semibold hover:bg-[#72a136] transition-all"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = result
                      link.download = `generated-${Date.now()}.png`
                      link.click()
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    className="flex-1 py-3 rounded-xl border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}