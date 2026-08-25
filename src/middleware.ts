import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-change-in-production-12345678'
);

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employeeId: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  let user: UserSession | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, {
        algorithms: ['HS256'],
      });
      user = payload as unknown as UserSession;
    } catch (error) {
      // Invalid token, remove it
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // 1. Guest paths: if user is logged in, redirect away from guest pages
  const isGuestPath = pathname.startsWith('/login') || pathname.startsWith('/forgot-password');
  
  if (isGuestPath) {
    if (user) {
      if (user.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (user.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/manager', request.url));
      } else {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Protected paths: if user is not logged in, redirect to login
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/manager') ||
    pathname.startsWith('/employee') ||
    pathname === '/';

  if (isProtectedPath) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      // Optional: keep redirect URL
      return NextResponse.redirect(loginUrl);
    }

    // Redirect Root / to dashboard
    if (pathname === '/') {
      if (user.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (user.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/manager', request.url));
      } else {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
    }

    // Role-based authorization rules
    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      // Non-admins can't go to admin panels
      if (user.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/manager', request.url));
      } else {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
    }

    if (pathname.startsWith('/manager') && user.role === 'EMPLOYEE') {
      // Employees cannot access manager panels
      return NextResponse.redirect(new URL('/employee', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/forgot-password',
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
  ],
};
