import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_DOMAIN = 'kart.gardsh.no'

export async function middleware(request: NextRequest) {
  try {
    // Create a response early so we can modify headers
    const res = NextResponse.next()
    
    // Debug logs for request
    const url = new URL(request.url)
    console.log('Request domain:', url.hostname)
    console.log('Cookie header:', request.headers.get('cookie'))
    console.log('Auth header:', request.headers.get('authorization'))

    // Create client
    const supabase = createMiddlewareClient({ req: request, res })
    
    // Try to get the session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Initial session check:', { found: !!session, error: sessionError?.message })

    // Get the token only from the valid domain
    const accessToken = request.cookies.get('sb-access-token')?.value
    console.log('Found access token:', !!accessToken)

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
          console.log('Session set successfully with token, user:', !!user)
        }
      } catch (error) {
        console.error('Error in setSession:', error)
      }
    }

    // Final user check
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Final user check:', { found: !!user, error: userError?.message })

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

    // Set the token in the response headers if we have a user
    if (user && accessToken) {
      res.headers.set('Authorization', `Bearer ${accessToken}`)
      
      // Ensure cookie is set for the correct domain
      res.cookies.set('sb-access-token', accessToken, {
        domain: VALID_DOMAIN,
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })
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


