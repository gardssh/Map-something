import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip middleware for webpack-hmr and public routes
  if (
    req.url.includes('webpack-hmr') || 
    req.url.includes('_next/webpack') ||
    req.url.includes('/login') ||
    req.url.includes('/signup') ||
    req.url.includes('/auth/callback') ||
    req.url.includes('/api/auth')
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Check for token in URL
  const token = req.nextUrl.searchParams.get('token')
  if (token && req.nextUrl.pathname === '/profile') {
    try {
      // If we have a token, try to set the session
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      })
      if (error) throw error
    } catch (error) {
      console.error('Error setting session in middleware:', error)
      // On error, redirect to login
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if we have a session
  const { data: { session } } = await supabase.auth.getSession()

  // If no session and trying to access protected route, redirect to login
  // Note: We allow /profile with token even without session
  const isProtectedRoute = req.nextUrl.pathname.match(/^(\/dashboard|\/profile|\/api\/protected|\/)$/)
  if (!session && isProtectedRoute && !(token && req.nextUrl.pathname === '/profile')) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - images (public image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
} 
