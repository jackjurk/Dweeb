import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';
import { env } from '@/config/env';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      client: true,
      developer: true,
    },
  });
  
  if (!user) {
    return null;
  }
  
  return {
    ...user,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function requireUser(requiredRole?: 'ADMIN' | 'DEVELOPER' | 'CLIENT') {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (requiredRole && user.role !== requiredRole) {
    redirect('/dashboard');
  }
  
  return user;
}

export async function requireDeveloper() {
  return requireUser('DEVELOPER');
}

export async function requireClient() {
  return requireUser('CLIENT');
}

export async function requireAdmin() {
  return requireUser('ADMIN');
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

export async function redirectIfAuthenticated() {
  const isAuth = await isAuthenticated();
  
  if (isAuth) {
    redirect('/dashboard');
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
