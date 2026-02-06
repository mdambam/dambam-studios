import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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

// GET /api/admin/users/export - Export users to CSV
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
    })

    // CSV Header
    const headers = [
      'ID',
      'Name',
      'Email',
      'Credits',
      'Image Count',
      'Generation Count',
      'Total Credits Spent',
      'Created At',
      'Updated At'
    ].join(',')

    // CSV Rows
    const rows = users.map((u: { id: string; name: string | null; email: string; credits: number; imageCount: number; transactions: { amount: number }[]; _count: { generatedImages: number }; createdAt: Date; updatedAt: Date }) => {
      const totalCreditsSpent = u.transactions.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)
      return [
        u.id,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        u.email,
        u.credits,
        u.imageCount,
        u._count.generatedImages,
        totalCreditsSpent,
        u.createdAt.toISOString(),
        u.updatedAt.toISOString()
      ].join(',')
    })

    const csv = [headers, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 })
  }
}
