import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'

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

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null

  const { userId } = verifyToken(token)
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!me) return null

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(me.email.toLowerCase())) return null

  return me
}

// GET /api/admin/users - Get all users with stats
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            generatedImages: true,
            transactions: true,
          },
        },
        transactions: {
          where: { type: 'debit' },
          select: { amount: true },
        },
      },
    });

    // Calculate total credits spent per user
    const usersWithStats = users.map((u: { id: string; name: string | null; email: string; credits: number; imageCount: number; transactions: { amount: number }[]; _count: { generatedImages: number; transactions: number }; createdAt: Date; updatedAt: Date }) => {
      const totalCreditsSpent = u.transactions.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        credits: u.credits,
        imageCount: u.imageCount,
        generationCount: u._count.generatedImages,
        transactionCount: u._count.transactions,
        totalCreditsSpent,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }
    })

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("ADMIN_API_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, password, credits = 0 } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        credits,
      },
    })

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      credits: newUser.credits,
      createdAt: newUser.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
