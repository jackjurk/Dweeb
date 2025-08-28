import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { Adapter } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Define the credentials schema for email/password login
const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentialsSchema.parse(credentials);
          
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
            include: { client: true, developer: true },
          });
          
          if (!user) {
            throw new Error('Invalid email or password');
          }
          
          // Check if the account has a password (OAuth users won't have one)
          const account = await prisma.account.findFirst({
            where: { userId: user.id, provider: 'credentials' },
          });
          
          if (!account) {
            throw new Error('Please sign in with your OAuth provider');
          }
          
          // Verify password
          const isValid = await bcrypt.compare(password, account.password_hash || '');
          
          if (!isValid) {
            throw new Error('Invalid email or password');
          }
          
          // Return user data without sensitive information
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
          
        } catch (error) {
          console.error('Auth error:', error);
          if (error instanceof z.ZodError) {
            throw new Error('Invalid input');
          }
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      
      // Update token with OAuth provider data
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add role and ID to the session
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
