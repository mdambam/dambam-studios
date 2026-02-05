import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { usageHistory: true },
    })

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    let history: any[] = []
    try {
      history = JSON.parse(user.usageHistory || '[]')
      if (!Array.isArray(history)) history = []
    } catch {
      history = []
    }

    return NextResponse.json(
      {
        status: 'success',
        data: {
          history: history.slice(0, 2),
        },
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('[v0] User history API error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
