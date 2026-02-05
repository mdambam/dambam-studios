import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-utils'

const FALLBACK_ADMIN_EMAIL = 'msdambam@gmail.com'

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || ''
  const emails = raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (emails.length > 0) {
    return emails
  }

  return [FALLBACK_ADMIN_EMAIL]
}

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  try {
    const { userId } = verifyToken(token)

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!me) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const adminEmails = getAdminEmails()
    if (!adminEmails.includes(me.email.toLowerCase())) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    return { userId }
  } catch (error) {
    console.error('ADMIN_ENHANCE_STYLE_AUTH_ERROR:', error)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

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
    console.error('ADMIN_ENHANCE_STYLE_GET_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to load enhance styles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { name, description, coverImage, prompt } = body ?? {}

    if (!name || !description || !coverImage || !prompt) {
      return NextResponse.json(
        { status: 'error', message: 'Name, description, cover image, and prompt are required' },
        { status: 400 },
      )
    }

    const style = await prisma.enhanceStyle.create({
      data: {
        name,
        description,
        coverImage,
        prompt,
      },
    })

    return NextResponse.json({ status: 'success', data: style }, { status: 201 })
  } catch (error) {
    console.error('ADMIN_ENHANCE_STYLE_POST_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to create enhance style' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { id, name, description, coverImage, prompt } = body ?? {}

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Enhance style ID is required' }, { status: 400 })
    }

    const existing = await prisma.enhanceStyle.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ status: 'error', message: 'Enhance style not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (prompt !== undefined) updateData.prompt = prompt

    const updated = await prisma.enhanceStyle.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ status: 'success', data: updated })
  } catch (error) {
    console.error('ADMIN_ENHANCE_STYLE_PUT_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to update enhance style' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Enhance style ID is required' }, { status: 400 })
    }

    const existing = await prisma.enhanceStyle.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ status: 'error', message: 'Enhance style not found' }, { status: 404 })
    }

    await prisma.enhanceStyle.delete({ where: { id } })

    return NextResponse.json({ status: 'success', message: 'Enhance style deleted' })
  } catch (error) {
    console.error('ADMIN_ENHANCE_STYLE_DELETE_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to delete enhance style' }, { status: 500 })
  }
}
