import { SliderValues } from './types'

export function composeFinalPrompt(
  stylePrompt: string,
  userPrompt: string,
  sliders: SliderValues | null,
  faceDirection: string,
  keepAppearance: boolean
): string {
  let finalPrompt = stylePrompt

  if (userPrompt) {
    finalPrompt += `, ${userPrompt}`
  }

  if (sliders) {
    // Map Realism slider
    if (sliders.realism <= 20) {
      finalPrompt += ', highly stylized, cartoonish'
    } else if (sliders.realism <= 40) {
      finalPrompt += ', stylized illustration'
    } else if (sliders.realism <= 60) {
      finalPrompt += ', semi-realistic'
    } else if (sliders.realism <= 85) {
      finalPrompt += ', realistic'
    } else {
      finalPrompt += ', photorealistic, cinematic'
    }

    // Map Stylization
    if (sliders.stylization < 50) {
      finalPrompt += ', photographic style'
    } else {
      finalPrompt += ', painterly, illustrative'
    }

    // Map Closeup
    if (sliders.closeup <= 33) {
      finalPrompt += ', wide shot, full body'
    } else if (sliders.closeup <= 66) {
      finalPrompt += ', mid-shot, waist-up'
    } else {
      finalPrompt += ', close-up, head and shoulders'
    }

    // Map Complexity
    if (sliders.complexity <= 33) {
      finalPrompt += ', clean, minimal background'
    } else if (sliders.complexity <= 66) {
      finalPrompt += ', moderately detailed scene'
    } else {
      finalPrompt += ', rich, complex environment'
    }

    // Map Lighting
    if (sliders.lighting <= 33) {
      finalPrompt += ', natural outdoor light'
    } else if (sliders.lighting <= 66) {
      finalPrompt += ', soft studio light'
    } else {
      finalPrompt += ', dramatic studio lighting, rim light'
    }
  }

  // Face direction
  if (faceDirection === 'forward') {
    finalPrompt += ', face looking at camera'
  } else if (faceDirection === 'left') {
    finalPrompt += ', face turning left'
  } else if (faceDirection === 'right') {
    finalPrompt += ', face turning right'
  } else if (faceDirection === 'three_quarters') {
    finalPrompt += ', three-quarter view'
  }

  // Keep appearance
  if (keepAppearance) {
    finalPrompt += ', preserve facial features and skin tone'
  } else {
    finalPrompt += ', allow creative appearance changes'
  }

  finalPrompt += '. Ultra-detailed skin texture, realistic eyes, soft studio lighting, high resolution, minimal noise.'

  return finalPrompt
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
