// This file ensures environment variables are loaded consistently across the app

// Server-side only env vars (not exposed to client)
const serverEnv = {
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
} as const;

// Client-side env vars (prefixed with NEXT_PUBLIC_)
const clientEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
} as const;

// Paystack configuration
export function getPaystackConfig() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!secretKey) {
    console.error('❌ PAYSTACK_SECRET_KEY is not configured in environment variables');
    console.error('Current NODE_ENV:', process.env.NODE_ENV);
    throw new Error('Payment processor configuration error');
  }
  
  return {
    secretKey,
    publicKey,
    appUrl
  };
}

// Runtime check for required env vars
if (typeof window === 'undefined') {
  // Server-side checks
  if (!serverEnv.PAYSTACK_SECRET_KEY) {
    console.error('❌ PAYSTACK_SECRET_KEY is not set in environment variables');
  }
  if (!serverEnv.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in environment variables');
  }
}

export const env = {
  ...serverEnv,
  ...clientEnv
};

export default env;
