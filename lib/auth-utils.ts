import { compare, hash } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import prisma from './prisma'

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 12)
}

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await compare(password, hashedPassword)
}

export const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }
  return sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export const verifyToken = (token: string): { userId: string } => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }
  const payload = verify(token, process.env.JWT_SECRET)
  if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
    throw new Error('Invalid token')
  }
  return { userId: String((payload as any).userId) }
}

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

export const getSessionUser = async (req: NextRequest) => {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return null

    const { userId } = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, credits: true },
    })

    if (!user) return null

    const adminEmails = getAdminEmails()
    const isAdmin = adminEmails.includes(user.email.toLowerCase())

    return { ...user, isAdmin }
  } catch {
    return null
  }
}
