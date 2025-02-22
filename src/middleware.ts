import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response early so we can modify headers
    const res = NextResponse.next()
    
    // Debug logs for request
    console.log('Request URL:', request.url)
    console.log('Cookie header:', request.headers.get('cookie'))
    console.log('Auth header:', request.headers.get('authorization'))
    
    // Create client
    const supabase = createMiddlewareClient({ req: request, res })
    
    // Try to get the session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
    }
    console.log('Session found:', !!session)

    // Get the access token from cookie
    const accessToken = request.cookies.get('sb-access-token')?.value
    console.log('Access token found in cookie:', !!accessToken)

    if (accessToken) {
      try {
        // Try to set the session with the token
        const { data: { user }, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        })
        
        if (setSessionError) {
          console.error('Error setting session:', setSessionError)
        } else {
          console.log('Session set successfully with token')
        }
      } catch (error) {
        console.error('Error in setSession:', error)
      }
    }

    // Get the user - this is key for validation
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User error:', userError)
    }
    console.log('User found:', !!user)

    // Define public routes that don't require authentication
    const isPublicRoute = request.nextUrl.pathname.startsWith('/login') ||
                         request.nextUrl.pathname.startsWith('/signup') ||
                         request.nextUrl.pathname === '/' ||
                         request.nextUrl.pathname.startsWith('/auth/callback')

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      console.log('No user found, redirecting to login')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On critical errors, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 


