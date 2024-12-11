import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip middleware for webpack-hmr
  if (req.url.includes('webpack-hmr') || req.url.includes('_next/webpack')) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: [
    // Only match specific paths we want to protect
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/protected/:path*',
    '/',
  ],
} 
