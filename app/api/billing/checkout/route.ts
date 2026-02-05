import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export const runtime = 'nodejs'

const PLANS = {
  pack_500: { credits: 500, amountNgn: 500 },
  pack_1000: { credits: 1000, amountNgn: 1000 },
  pack_3000: { credits: 3000, amountNgn: 3000 },
} as const

type PlanId = keyof typeof PLANS

function getAppUrl(request: NextRequest) {
  const env = process.env.APP_URL
  if (env) return env.replace(/\/$/, '')

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = verifyToken(token)

    const { planId } = (await request.json().catch(() => ({}))) as { planId?: string }
    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ status: 'error', message: 'Invalid plan' }, { status: 400 })
    }

    const plan = PLANS[planId as PlanId]

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { status: 'error', message: 'PAYSTACK_SECRET_KEY is not configured' },
        { status: 500 }
      )
    }

    const appUrl = getAppUrl(request)
    const callback_url = `${appUrl}/billing/success`

    const reference = `cred_${user.id}_${Date.now()}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.amountNgn * 100,
        currency: 'NGN',
        reference,
        callback_url,
        metadata: {
          userId: user.id,
          planId,
          credits: plan.credits,
          amountNgn: plan.amountNgn,
        },
      }),
    })

    const paystackJson = await paystackRes.json().catch(() => ({}))

    if (!paystackRes.ok || !paystackJson?.status) {
      return NextResponse.json(
        { status: 'error', message: paystackJson?.message || 'Failed to initialize payment' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: {
        authorizationUrl: paystackJson.data.authorization_url as string,
        reference,
      },
    })
  } catch (error) {
    console.error('[v0] Billing checkout error:', error)
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
