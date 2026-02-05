import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ status: 'success' })
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
