// Environment Configuration
// Copy this to .env.local and fill in the values

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dweeb',
  
  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret',
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PLATFORM_FEE_BPS: process.env.PLATFORM_FEE_BPS || '2000', // 20% platform fee in basis points (2000 = 20%)
  
  // URLs
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
} as const;

// Type-safe environment variables
type EnvKey = keyof typeof env;

export function getEnv(key: EnvKey): string {
  const value = env[key];
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function isProd(): boolean {
  return env.NODE_ENV === 'production';
}

export function isDev(): boolean {
  return !isProd();
}
