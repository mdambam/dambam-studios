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

    const { image, scale } = await request.json()
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
    const aiRes = await fetch(`${backend}/api/upscale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(backendSecret ? { 'X-AI-Backend-Secret': backendSecret } : {}),
      },
      body: JSON.stringify({ image, scale: scale || 2 }),
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
      return NextResponse.json({ status: 'error', message: aiData?.message || 'Upscale failed' }, { status: 502 })
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
        console.error('[v0] Image upscale refund error:', refundError)
      }
    }

    console.error('[v0] Image upscale API error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
