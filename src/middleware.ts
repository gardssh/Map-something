import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip middleware for public routes and static files
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

  try {
    // Check for token in cookie (from iOS WebView)
    const accessToken = req.cookies.get('sb-access-token')?.value

    if (accessToken) {
      // Set the session using the token from cookie
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Cookie-based auth doesn't use refresh tokens
      })

      if (sessionError) {
        console.error('Error setting session from cookie:', sessionError)
        // Don't redirect here - let the session check below handle it
      }
    }

    // Get the current session state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error getting session:', sessionError)
    }

    // Define protected routes that require authentication
    const isProtectedRoute = !req.nextUrl.pathname.startsWith('/login') && 
                           !req.nextUrl.pathname.startsWith('/signup') && 
                           !req.nextUrl.pathname.startsWith('/auth/callback')

    // Redirect to login if accessing protected route without session
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/login', req.url)
      // Preserve the original URL as a "next" parameter
      redirectUrl.searchParams.set('next', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On critical errors, redirect to login
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - images (public image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|images).*)',
  ],
} 
