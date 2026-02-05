'use client'

interface SliderSetProps {
  values: {
    realism: number
    stylization: number
    closeup: number
    complexity: number
    lighting: number
  }
  onChange: (key: string, value: number) => void
}

const SLIDERS = [
  { key: 'realism', label: 'Realism', hint: 'Cartoonish → Photorealistic' },
  { key: 'stylization', label: 'Stylization', hint: 'Photographic → Painterly' },
  { key: 'closeup', label: 'Closeup', hint: 'Wide shot → Close-up' },
  { key: 'complexity', label: 'Complexity', hint: 'Minimal → Complex' },
  { key: 'lighting', label: 'Lighting', hint: 'Outdoor → Studio' },
]

export function SliderSet({ values, onChange }: SliderSetProps) {
  return (
    <div className="space-y-6">
      {SLIDERS.map((slider) => (
        <div key={slider.key}>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">{slider.label}</label>
            <span className="text-sm text-foreground/60">{values[slider.key as keyof typeof values]}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={values[slider.key as keyof typeof values]}
            onChange={(e) => onChange(slider.key, parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-xs text-foreground/50 mt-1">{slider.hint}</p>
        </div>
      ))}
    </div>
  )
}
