import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

function getAiBackendBaseUrl() {
  return process.env.AI_BACKEND_URL || 'http://127.0.0.1:5001'
}

function getAiBackendSecret() {
  return process.env.AI_BACKEND_SECRET || ''
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

    const { prompt, style, sliders, highRes = false, aspectRatio = '1:1' } = await request.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Prompt is required' }, { status: 400 })
    }

    // Validate aspect ratio
    const validAspectRatios = ['1:1', '16:9', '9:16', '4:5', '9:21']
    if (!validAspectRatios.includes(aspectRatio)) {
      return NextResponse.json({ status: 'error', message: 'Invalid aspect ratio' }, { status: 400 })
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
    // Calculate dimensions based on aspect ratio and resolution
    let width, height;
    switch(aspectRatio) {
      case '1:1':
        width = highRes ? 2048 : 1024;
        height = highRes ? 2048 : 1024;
        break;
      case '16:9':
        width = highRes ? 2048 : 1024;
        height = highRes ? 1152 : 576;
        break;
      case '9:16':
        width = highRes ? 1152 : 576;
        height = highRes ? 2048 : 1024;
        break;
      case '4:5':
        width = highRes ? 1638 : 819;
        height = highRes ? 2048 : 1024;
        break;
      case '9:21':
        width = highRes ? 1080 : 540;
        height = highRes ? 2520 : 1260;
        break;
      default:
        width = highRes ? 2048 : 1024;
        height = highRes ? 2048 : 1024;
    }

    const aiRes = await fetch(`${backend}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(backendSecret ? { 'X-AI-Backend-Secret': backendSecret } : {}),
      },
      body: JSON.stringify({
        prompt,
        style: style || 'Studio',
        sliders: sliders || null,
        width,
        height,
        high_resolution: highRes,
        aspect_ratio: aspectRatio,
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

    if (!aiRes.ok || !aiData?.success || !aiData?.image) {
      await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } })
      return NextResponse.json({ status: 'error', message: aiData?.message || 'Generation failed' }, { status: 502 })
    }

    let history: any[] = []
    try {
      history = JSON.parse(user.usageHistory || '[]')
      if (!Array.isArray(history)) history = []
    } catch {
      history = []
    }

    history.unshift({ url: aiData.image, createdAt: new Date().toISOString() })
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
        image: aiData.image,
        credits: updatedUser.credits,
      },
    })
  } catch (error) {
    if (didReserveCredit && userId) {
      try {
        await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } })
      } catch (refundError) {
        console.error('[v0] Image generate refund error:', refundError)
      }
    }

    console.error('[v0] Image generate API error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
