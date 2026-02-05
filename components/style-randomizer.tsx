'use client'

import { STYLES_LIST } from '@/lib/styles-list'
import { useState } from 'react'

interface StyleRandomizerProps {
  onStyleChange: (name: string, prompt: string) => void
  styleName: string
  stylePrompt: string
}

export function StyleRandomizer({
  onStyleChange,
  styleName,
  stylePrompt,
}: StyleRandomizerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const randomize = () => {
    const random = STYLES_LIST[Math.floor(Math.random() * STYLES_LIST.length)]
    onStyleChange(random.name, random.prompt)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Style</label>
        <button
          onClick={randomize}
          className="text-xs px-3 py-1 rounded-lg border border-border text-foreground hover:bg-muted transition"
        >
          Randomize
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-left hover:border-primary/30 transition flex justify-between items-center"
        >
          <span>{styleName || 'Select a style'}</span>
          <span className="text-foreground/50">▼</span>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {STYLES_LIST.map((style) => (
              <button
                key={style.name}
                onClick={() => {
                  onStyleChange(style.name, style.prompt)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-muted transition border-b border-border/50 last:border-b-0"
              >
                <p className="font-medium text-sm">{style.name}</p>
                <p className="text-xs text-foreground/60">{style.prompt.substring(0, 60)}...</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {stylePrompt && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Style Prompt</p>
          <p className="text-sm">{stylePrompt}</p>
        </div>
      )}
    </div>
  )
}
