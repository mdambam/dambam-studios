import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client' // <-- I added this line for better error handling

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
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { status: 'error', message: 'Email, password, and name are required' },
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

    if (password.length < 6) {
      return NextResponse.json(
        { status: 'error', message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate name: 3-50 chars, allows letters, spaces, hyphens, and apostrophes
    const namePattern = /^[a-zA-ZÀ-ÿ\s'-]{3,50}$/
    if (!namePattern.test(name.trim())) {
      return NextResponse.json(
        { status: 'error', message: 'Please enter a valid name (3-50 characters, letters, spaces, hyphens, and apostrophes only)' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { status: 'error', message: 'Email already in use' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with 0 credits initially
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        credits: 0, // Start with 0 credits, user needs to purchase
      },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
      },
    })

    // Generate JWT token
    const token = generateToken(user.id)

    const adminEmails = getAdminEmails()
    const isAdmin = adminEmails.includes(user.email.toLowerCase())

    const response = NextResponse.json({
      status: 'success',
      data: {
        user: {
          ...user,
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
  } catch (error: any) {
    console.error('[v0] Signup API error:', error);

    // --- START: IMPROVED ERROR LOGGING ---
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // This is a known error from Prisma
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
      
      // A common error for unique constraint violations
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target?.includes('email')) {
          return NextResponse.json(
            { status: 'error', message: 'Email already in use.' },
            { status: 409 } // Use 409 Conflict for this
          );
        }
      }
      
      // This is the error we are hunting for!
      // It's a generic validation error.
      if (error.code === 'P2003') {
        return NextResponse.json(
            { status: 'error', message: `Invalid data provided: ${error.message}` },
            { status: 400 }
        );
      }

      return NextResponse.json(
        { status: 'error', message: `A database constraint was violated: ${error.message}` },
        { status: 400 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      // This happens when data types don't match the schema
      console.error('Prisma Validation Error:', error.message);
      return NextResponse.json(
        { status: 'error', message: `Data format is incorrect: ${error.message}` },
        { status: 400 }
      );
    }
    // --- END: IMPROVED ERROR LOGGING ---

    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'

    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    );
  }
}