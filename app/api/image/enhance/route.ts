import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

function getAiBackendBaseUrl() {
  return process.env.AI_BACKEND_URL || 'http://127.0.0.1:5001'
}

function getAiBackendSecret() {
  return process.env.AI_BACKEND_SECRET || ''
}

function getImageDimensionsFromDataUrl(dataUrl: string): { width: number; height: number } | null {
  if (typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) return null

  const mime = match[1]
  const base64 = match[2]
  const buf = Buffer.from(base64, 'base64')

  if (mime === 'image/png') {
    if (buf.length < 24) return null
    const signature = buf.slice(0, 8)
    const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    if (!signature.equals(expected)) return null
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    return { width, height }
  }

  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    if (buf.length < 4) return null
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null
    let offset = 2
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1
        continue
      }

      const marker = buf[offset + 1]
      const isSof = marker === 0xc0 || marker === 0xc1 || marker === 0xc2
      if (isSof) {
        if (offset + 8 >= buf.length) return null
        const height = buf.readUInt16BE(offset + 5)
        const width = buf.readUInt16BE(offset + 7)
        return { width, height }
      }

      if (offset + 4 >= buf.length) return null
      const segmentLength = buf.readUInt16BE(offset + 2)
      if (segmentLength <= 0) return null
      offset += 2 + segmentLength
    }
  }

  return null
}

function getApproxBytesFromDataUrl(dataUrl: string): number | null {
  if (typeof dataUrl !== 'string') return null
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
  if (!match) return null
  const base64 = match[1]
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export async function POST(request: NextRequest) {
  let didReserveCredit = false
  let userId: string | null = null

  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    userId = verifyToken(token).userId

    const { image, prompt, styleName, sliders, highRes = true } = await request.json()
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Image is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { usageHistory: true },
    })

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const reserved = await prisma.user.updateMany({
      where: { id: userId, credits: { gte: 1 } },
      data: { credits: { decrement: 1 } },
    })

    if (reserved.count === 0) {
      return NextResponse.json({ status: 'error', message: 'Insufficient credits' }, { status: 402 })
    }

    didReserveCredit = true

    const backend = getAiBackendBaseUrl()
    const backendSecret = getAiBackendSecret()
    const aiRes = await fetch(`${backend}/api/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(backendSecret ? { 'X-AI-Backend-Secret': backendSecret } : {}),
      },
      body: JSON.stringify({
        image,
        prompt: prompt || '',
        styleName: styleName || 'Enhance',
        sliders: sliders || null,
        highRes: !!highRes,
      }),
    })

    const aiText = await aiRes.text()
    let aiData: any = null
    try {
      aiData = JSON.parse(aiText)
    } catch {
      await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } })
      return NextResponse.json({ status: 'error', message: 'AI backend returned invalid response' }, { status: 502 })
    }

    if (!aiRes.ok || !aiData?.success || !aiData?.enhancedImage) {
      await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } })
      return NextResponse.json({ status: 'error', message: aiData?.message || 'Enhancement failed' }, { status: 502 })
    }

    let finalImage: string = aiData.enhancedImage
    const shouldAutoUpscale = process.env.AI_AUTO_UPSCALE === 'true'
    if (shouldAutoUpscale && highRes !== false) {
      const desiredMinDim = 2048
      const desiredMinBytes = 2_000_000
      const maxReasonableMinDim = 4096
      let didRerenderForBytes = false

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const dims = getImageDimensionsFromDataUrl(finalImage)
        const minDim = dims ? Math.min(dims.width, dims.height) : null

        const bytes = getApproxBytesFromDataUrl(finalImage)
        const hasEnoughPixels = minDim !== null && minDim >= desiredMinDim
        const hasEnoughBytes = bytes !== null && bytes >= desiredMinBytes

        if (hasEnoughPixels && hasEnoughBytes) {
          break
        }

        if (hasEnoughPixels && !hasEnoughBytes && didRerenderForBytes) {
          break
        }

        if (minDim !== null && minDim >= maxReasonableMinDim) {
          break
        }

        const upscaleScale = minDim !== null && minDim >= desiredMinDim ? 1 : 2
        if (upscaleScale === 1) didRerenderForBytes = true

        const upscaleRes = await fetch(`${backend}/api/upscale`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(backendSecret ? { 'X-AI-Backend-Secret': backendSecret } : {}),
          },
          body: JSON.stringify({ image: finalImage, scale: upscaleScale }),
        })

        const upscaleText = await upscaleRes.text()
        let upscaleData: any = null
        try {
          upscaleData = JSON.parse(upscaleText)
        } catch {
          upscaleData = null
        }

        if (upscaleRes.ok && upscaleData?.success && upscaleData?.image) {
          if (upscaleData.image === finalImage) {
            break
          }
          finalImage = upscaleData.image
          continue
        }

        break
      }
    }

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
      },
      select: { credits: true },
    })

    return NextResponse.json({
      status: 'success',
      data: {
        enhancedImage: finalImage,
        credits: updatedUser.credits,
      },
    })
  } catch (error) {
    if (didReserveCredit && userId) {
      try {
        await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } })
      } catch (refundError) {
        console.error('[v0] Image enhance refund error:', refundError)
      }
    }

    console.error('[v0] Image enhance API error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
