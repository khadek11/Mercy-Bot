import { NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/token-login'];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  console.log(`Middleware: Pathname: ${pathname}, IsPublic: ${isPublicPath}`);

  // Only apply auth check to non-public paths
  if (!isPublicPath) {
    // For client-side redirects, we'll handle auth in the component
    return NextResponse.next();
  }

  // Allow access to public paths
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', // Home page
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/token-login',
  ],
};