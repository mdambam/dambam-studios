import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

import Replicate from 'replicate'

export const runtime = 'nodejs'

function toReplicateImageInput(image: string): string | Buffer {
  if (typeof image !== 'string') {
    throw new Error('Invalid image input')
  }

  if (!image.startsWith('data:')) {
    return image
  }

  const commaIndex = image.indexOf(',')
  if (commaIndex === -1) {
    throw new Error('Invalid data URL')
  }
  const base64 = image.slice(commaIndex + 1)
  return Buffer.from(base64, 'base64')
}

function outputToUrl(output: any): string | null {
  if (!output) return null
  if (typeof output === 'string') return output
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') return output[0]

  if (typeof output === 'object') {
    const maybeUrl = (output as any).url
    if (typeof maybeUrl === 'function') {
      const urlObj = maybeUrl.call(output)
      return typeof urlObj?.toString === 'function' ? urlObj.toString() : String(urlObj)
    }
    if (typeof (output as any).toString === 'function') {
      return (output as any).toString()
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  let didReserveCredit = false
  let reservedCredits = 0
  let userId: string | null = null

  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    userId = verifyToken(token).userId

    const body = await request.json()
    const { styleId, image, fabricImage, userPrompt, logoImage, modelChoice, resolutionChoice } = body ?? {}

    const incomingMainImage = typeof image === 'string' ? image : typeof fabricImage === 'string' ? fabricImage : null

    if (!styleId || typeof styleId !== 'string') {
      return NextResponse.json({ status: 'error', message: 'styleId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { usageHistory: true },
    })

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const style = (await prisma.style.findUnique({
      where: { id: styleId },
    })) as any

    if (!style) {
      return NextResponse.json({ status: 'error', message: 'Style not found' }, { status: 404 })
    }

    if (!style.referenceImage || typeof style.referenceImage !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Style is missing reference image' }, { status: 400 })
    }

    const styleType: string = typeof style.styleType === 'string' ? style.styleType : 'fabric-mockup'
    const isFabricMockup = styleType === 'fabric-mockup'
    const isStudioPortrait = styleType === 'studio-portrait'
    const isStyleTransfer = styleType === 'style-transfer'

    if (!incomingMainImage) {
      return NextResponse.json(
        { status: 'error', message: isFabricMockup ? 'fabricImage is required' : 'image is required' },
        { status: 400 }
      )
    }

    const requiresLogo = isFabricMockup && style.requiresLogoUpload !== false

    if (requiresLogo && (!logoImage || typeof logoImage !== 'string')) {
      return NextResponse.json({ status: 'error', message: 'logoImage is required' }, { status: 400 })
    }

    if (logoImage && typeof logoImage !== 'string') {
      return NextResponse.json(
        { status: 'error', message: 'logoImage must be a base64 data URL string' },
        { status: 400 }
      )
    }

    const normalizedIncomingResolution =
      resolutionChoice === '4k'
        ? '4k'
        : resolutionChoice === '2k'
          ? '2k'
          : resolutionChoice === '1k' || resolutionChoice === 'standard' || !resolutionChoice
            ? '1k'
            : null

    if (!normalizedIncomingResolution) {
      return NextResponse.json(
        { status: 'error', message: 'resolutionChoice must be one of 1k, 2k, 4k' },
        { status: 400 }
      )
    }

    const normalizedModelChoice = normalizedIncomingResolution === '1k' ? 'model1' : 'model2'

    const normalizedResolutionChoice: 'standard' | '2k' | '4k' =
      normalizedIncomingResolution === '1k' ? 'standard' : normalizedIncomingResolution

    const price = normalizedIncomingResolution === '4k' ? 500 : normalizedIncomingResolution === '2k' ? 300 : 100

    const reserved = await prisma.user.updateMany({
      where: { id: userId, credits: { gte: price } },
      data: { credits: { decrement: price } },
    })

    if (reserved.count === 0) {
      return NextResponse.json({ status: 'error', message: 'Insufficient credits' }, { status: 402 })
    }

    didReserveCredit = true
    reservedCredits = price

    if (!process.env.REPLICATE_API_TOKEN) {
      await prisma.user.update({ where: { id: userId }, data: { credits: { increment: reservedCredits } } })
      didReserveCredit = false
      return NextResponse.json(
        { status: 'error', message: 'REPLICATE_API_TOKEN is not configured' },
        { status: 500 }
      )
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    const modelIdentifier = normalizedModelChoice === 'model2' ? 'google/nano-banana-pro' : 'google/nano-banana'

    const basePrompt =
      normalizedModelChoice === 'model2'
        ? (style.nanoBananaProPrompt || style.prompt)
        : (style.nanoBananaPrompt || style.prompt)

    const systemPrompt = isStudioPortrait
      ? `
You are an expert studio portrait retoucher.

You will receive 2 images:
- Image 1: a reference studio portrait that defines the desired lighting, background, color grading, and overall vibe.
- Image 2: the user's photo to transform.

Goals (must follow strictly):
- Keep the identity and facial features of the person from Image 2.
- Transform Image 2 to match the studio style of Image 1 (lighting, backdrop, color grading, mood).
- Keep it photorealistic, professional, and clean.
- Do not add text, watermarks, or borders.
      `.trim()
      : isStyleTransfer
        ? `
You are an expert image stylization assistant.

You will receive 2 images:
- Image 1: a reference style image that defines the desired artistic look.
- Image 2: the user's image to stylize.

Goals (must follow strictly):
- Preserve the main subject/identity from Image 2.
- Apply the artistic style and aesthetics of Image 1 (colors, brush/texture, mood, rendering).
- Keep it high-quality, with no watermarks or borders.
        `.trim()
        : `
You are an expert apparel mockup retoucher for e-commerce.

You will receive 3 images:
- Image 1: a mannequin product photo template (contains the garment and an EXISTING logo on the neck area)
- Image 2: a fabric photo/texture (this is the new fabric/pattern to apply to the garment)
- Image 3: a logo image (this must REPLACE the existing neck logo)

Goals (must follow strictly):
- Keep the mannequin, pose, shadows, wrinkles, stitching, and lighting EXACTLY from Image 1.
- Replace ONLY the garment fabric in Image 1 with the fabric from Image 2.
  - Preserve realistic folds/wrinkles/texture and lighting from Image 1.
  - Do not make the fabric look pasted; it should look like the garment is made from that fabric.
- Find the existing logo on the neck/collar area in Image 1, REMOVE it completely, and replace it with the logo from Image 3.
  - Place it in the same neck location, centered and natural.
  - Keep logo proportions and colors; do NOT distort; keep it readable.
  - Blend it naturally as printed/embroidered (no hard edges, no stickers).
- Background: choose a clean studio background color that ACCENTS the fabric colors with strong but tasteful contrast.
- Output: e-commerce clean, high quality. No borders or watermarks.
          `.trim()

    const finalPrompt = `${systemPrompt}\n\n${basePrompt || ''}\n\n${userPrompt || ''}`.trim()

    const desiredModelResolution =
      normalizedModelChoice === 'model2'
        ? normalizedResolutionChoice === '4k'
          ? '4K'
          : '2K'
        : undefined

    const replicateInputs = isFabricMockup
      ? [
          toReplicateImageInput(style.referenceImage),
          toReplicateImageInput(incomingMainImage),
          toReplicateImageInput(logoImage),
        ]
      : [
          toReplicateImageInput(style.referenceImage),
          toReplicateImageInput(incomingMainImage),
        ]

    const editOutput = await replicate.run(modelIdentifier, {
      input: {
        prompt: finalPrompt,
        image_input: replicateInputs,
        output_format: 'png',
        ...(desiredModelResolution ? { resolution: desiredModelResolution } : {}),
      },
    })

    const editUrl = outputToUrl(editOutput)
    if (!editUrl) {
      throw new Error('Replicate did not return an image URL')
    }

    let finalImage: string = editUrl

    let history: any[] = []
    try {
      history = JSON.parse(user.usageHistory || '[]')
      if (!Array.isArray(history)) history = []
    } catch {
      history = []
    }

    history.unshift({ url: finalImage, createdAt: new Date().toISOString() })
    const updatedHistory = history.slice(0, 2)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        usageHistory: JSON.stringify(updatedHistory),
        imageCount: { increment: 1 },
        transactions: {
          create: {
            amount: reservedCredits,
            type: 'debit',
            description: `studio:${styleId}:${normalizedModelChoice}:${normalizedResolutionChoice}`,
          },
        },
      },
      select: { credits: true },
    })

    try {
      await prisma.generatedImage.create({
        data: {
          originalImageUrl: incomingMainImage,
          generatedImageUrl: finalImage,
          userId,
          styleId,
        },
      })
    } catch (logError) {
      console.error('[v0] Failed to save generated image:', logError)
    }

    return NextResponse.json({
      status: 'success',
      data: {
        image: finalImage,
        credits: updatedUser.credits,
      },
    })
  } catch (error) {
    if (didReserveCredit && userId) {
      try {
        await prisma.user.update({ where: { id: userId }, data: { credits: { increment: reservedCredits || 0 } } })
      } catch (refundError) {
        console.error('[v0] Image style-transfer refund error:', refundError)
      }
    }

    console.error('[v0] Image style-transfer API error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'

    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
