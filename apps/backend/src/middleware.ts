import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export const config = {
  matcher: '/api/:path*',
  runtime: 'nodejs',
};

export function middleware(request: NextRequest) {
  // Skip authentication for public routes
  const publicPaths = ['/api/auth/login', '/api/auth/register'];
  const { pathname } = request.nextUrl;

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
