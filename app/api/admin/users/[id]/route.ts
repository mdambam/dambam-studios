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

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, credits, password } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      })
      if (emailTaken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (credits !== undefined) updateData.credits = credits
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      credits: updatedUser.credits,
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
