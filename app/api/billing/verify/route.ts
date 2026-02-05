import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = verifyToken(token)

    const reference = request.nextUrl.searchParams.get('reference')
    if (!reference) {
      return NextResponse.json({ status: 'error', message: 'Missing reference' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { status: 'error', message: 'PAYSTACK_SECRET_KEY is not configured' },
        { status: 500 }
      )
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const verifyJson = await verifyRes.json().catch(() => ({}))
    if (!verifyRes.ok || !verifyJson?.status) {
      return NextResponse.json(
        { status: 'error', message: verifyJson?.message || 'Failed to verify payment' },
        { status: 502 }
      )
    }

    const data = verifyJson.data
    const paid = data?.status === 'success'
    if (!paid) {
      return NextResponse.json({ status: 'error', message: 'Payment not successful' }, { status: 400 })
    }

    const amountKobo = Number(data?.amount || 0)
    const amountNgn = Math.round(amountKobo / 100)
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      return NextResponse.json({ status: 'error', message: 'Invalid payment amount' }, { status: 400 })
    }

    const expectedAmount = Number(data?.metadata?.amountNgn)
    if (Number.isFinite(expectedAmount) && expectedAmount > 0 && expectedAmount !== amountNgn) {
      return NextResponse.json({ status: 'error', message: 'Payment amount mismatch' }, { status: 400 })
    }

    const creditsToAdd = amountNgn

    const existing = await prisma.transaction.findFirst({
      where: { description: reference },
      select: { id: true },
    })

    if (existing) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
      return NextResponse.json({ status: 'success', data: { credits: user?.credits ?? 0, alreadyCredited: true } })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { increment: creditsToAdd },
        transactions: {
          create: {
            amount: creditsToAdd,
            type: 'credit',
            description: reference,
          },
        },
      },
      select: { credits: true },
    })

    return NextResponse.json({
      status: 'success',
      data: {
        credits: updatedUser.credits,
        added: creditsToAdd,
      },
    })
  } catch (error) {
    console.error('[v0] Billing verify error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
