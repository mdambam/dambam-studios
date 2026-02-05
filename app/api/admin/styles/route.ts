import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-utils'

const FALLBACK_ADMIN_EMAIL = 'msdambam@gmail.com'

function toOptionalNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

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
    console.error('ADMIN_STYLE_AUTH_ERROR:', error)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}

export async function GET(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const styles = await prisma.style.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const safe = Array.isArray(styles)
      ? styles.map(({ referenceImage, ...rest }: any) => rest)
      : []

    return NextResponse.json({ status: 'success', data: safe })
  } catch (error) {
    console.error('ADMIN_STYLE_GET_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to load styles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const {
      name,
      description,
      coverImage,
      exampleBeforeImage,
      exampleAfterImage,
      referenceImage,
      prompt,
      nanoBananaPrompt,
      nanoBananaProPrompt,
      model1Name,
      model1Identifier,
      model1Price,
      model2Name,
      model2Identifier,
      model2Price,
      price2kUpcharge,
      price4kUpcharge,
    } = body ?? {}

    if (!name || !description || !prompt || !referenceImage) {
      return NextResponse.json(
        { status: 'error', message: 'Name, description, reference image, and prompt are required' },
        { status: 400 }
      )
    }

    const finalCover = coverImage || referenceImage
    const finalBefore = exampleBeforeImage || referenceImage
    const finalAfter = exampleAfterImage || referenceImage

    const style = await prisma.style.create({
      data: {
        name,
        description,
        coverImage: finalCover,
        exampleBeforeImage: finalBefore,
        exampleAfterImage: finalAfter,
        referenceImage,
        prompt,
        nanoBananaPrompt: nanoBananaPrompt ?? undefined,
        nanoBananaProPrompt: nanoBananaProPrompt ?? undefined,
        model1Name: model1Name ?? undefined,
        model1Identifier: model1Identifier ?? undefined,
        model1Price: toOptionalNumber(model1Price),
        model2Name: model2Name ?? undefined,
        model2Identifier: model2Identifier ?? undefined,
        model2Price: toOptionalNumber(model2Price),
        price2kUpcharge: toOptionalNumber(price2kUpcharge),
        price4kUpcharge: toOptionalNumber(price4kUpcharge),
      },
    } as any)

    return NextResponse.json({ status: 'success', data: style }, { status: 201 })
  } catch (error) {
    console.error('ADMIN_STYLE_POST_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to create style' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      coverImage,
      exampleBeforeImage,
      exampleAfterImage,
      referenceImage,
      prompt,
      nanoBananaPrompt,
      nanoBananaProPrompt,
      model1Name,
      model1Identifier,
      model1Price,
      model2Name,
      model2Identifier,
      model2Price,
      price2kUpcharge,
      price4kUpcharge,
    } = body ?? {}

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Style ID is required' }, { status: 400 })
    }

    const existing = await prisma.style.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ status: 'error', message: 'Style not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (prompt !== undefined) updateData.prompt = prompt
    if (nanoBananaPrompt !== undefined) updateData.nanoBananaPrompt = nanoBananaPrompt
    if (nanoBananaProPrompt !== undefined) updateData.nanoBananaProPrompt = nanoBananaProPrompt
    if (model1Name !== undefined) updateData.model1Name = model1Name
    if (model1Identifier !== undefined) updateData.model1Identifier = model1Identifier
    if (model1Price !== undefined) updateData.model1Price = toOptionalNumber(model1Price)
    if (model2Name !== undefined) updateData.model2Name = model2Name
    if (model2Identifier !== undefined) updateData.model2Identifier = model2Identifier
    if (model2Price !== undefined) updateData.model2Price = toOptionalNumber(model2Price)
    if (price2kUpcharge !== undefined) updateData.price2kUpcharge = toOptionalNumber(price2kUpcharge)
    if (price4kUpcharge !== undefined) updateData.price4kUpcharge = toOptionalNumber(price4kUpcharge)
    if (referenceImage !== undefined) {
      updateData.referenceImage = referenceImage
      updateData.coverImage = coverImage || referenceImage
      updateData.exampleBeforeImage = exampleBeforeImage || referenceImage
      updateData.exampleAfterImage = exampleAfterImage || referenceImage
    } else {
      if (coverImage !== undefined) updateData.coverImage = coverImage
      if (exampleBeforeImage !== undefined) updateData.exampleBeforeImage = exampleBeforeImage
      if (exampleAfterImage !== undefined) updateData.exampleAfterImage = exampleAfterImage
    }

    const updated = await prisma.style.update({
      where: { id },
      data: updateData,
    } as any)

    return NextResponse.json({ status: 'success', data: updated })
  } catch (error) {
    console.error('ADMIN_STYLE_PUT_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to update style' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await assertAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Style ID is required' }, { status: 400 })
    }

    const existing = await prisma.style.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ status: 'error', message: 'Style not found' }, { status: 404 })
    }

    await prisma.style.delete({ where: { id } })

    return NextResponse.json({ status: 'success', message: 'Style deleted' })
  } catch (error) {
    console.error('ADMIN_STYLE_DELETE_ERROR:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to delete style' }, { status: 500 })
  }
}
