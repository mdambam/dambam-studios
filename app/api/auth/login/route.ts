import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePasswords, generateToken } from '@/lib/auth-utils'

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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email.toLowerCase())) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        credits: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password!)
    if (!isPasswordValid) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken(user.id)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    const adminEmails = getAdminEmails()
    const isAdmin = adminEmails.includes(user.email.toLowerCase())

    const response = NextResponse.json({
      status: 'success',
      data: {
        user: {
          ...userWithoutPassword,
          isAdmin,
          subscription: 'free',
        },
      },
    })

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error('[v0] Login API error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    )
  }
}
