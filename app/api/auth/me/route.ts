import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

const FALLBACK_ADMIN_EMAIL = 'msdambam@gmail.com'

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || ''
  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (emails.length > 0) return emails
  return [FALLBACK_ADMIN_EMAIL]
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = getAdminEmails()
    const isAdmin = adminEmails.includes(user.email.toLowerCase())

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          ...user,
          isAdmin,
          subscription: 'free',
        },
      },
    })
  } catch (error) {
    console.error('[v0] Me API error:', error)
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
  }
}
