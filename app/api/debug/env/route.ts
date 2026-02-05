import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    paystackKeyExists: !!process.env.PAYSTACK_SECRET_KEY,
    paystackKeyLength: process.env.PAYSTACK_SECRET_KEY?.length,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    publicApiUrl: process.env.NEXT_PUBLIC_API_URL,
    mongoUriExists: !!process.env.MONGODB_URI
  });
}
