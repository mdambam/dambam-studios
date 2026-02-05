import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const styles = await prisma.enhanceStyle.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        prompt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ status: 'success', data: styles })
  } catch (error) {
    console.error('PUBLIC_ENHANCE_STYLES_GET_ERROR:', error)
    return NextResponse.json(
      { status: 'error', message: 'Could not fetch enhance styles' },
      { status: 500 },
    )
  }
}
