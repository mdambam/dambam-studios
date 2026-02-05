'use client'

import { useState, useRef } from 'react'

interface UploadCardProps {
  onImageSelect: (file: File) => void
  preview: string | null
  onRemove: () => void
}

export function UploadCard({ onImageSelect, preview, onRemove }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      onImageSelect(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) {
      onImageSelect(file)
    }
  }

  if (preview) {
    return (
      <div className="rounded-xl border-2 border-border bg-muted/30 p-6 relative">
        <div className="aspect-video relative rounded-lg overflow-hidden bg-background">
          <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
        </div>
        <button
          onClick={onRemove}
          className="mt-4 w-full py-2 rounded-lg border border-border text-foreground hover:bg-muted transition text-sm font-medium"
        >
          Remove Image
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/20'
      }`}
    >
      <div className="text-4xl mb-3">📸</div>
      <h3 className="font-bold mb-1">Drop your image here</h3>
      <p className="text-sm text-foreground/60 mb-4">or click to browse (JPG, PNG)</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
