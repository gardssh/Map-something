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
    console.log('=== Request Info ===')
    console.log('URL:', request.url)
    console.log('Method:', request.method)
    console.log('Domain:', url.hostname)
    
    // Log all cookies for debugging
    const allCookies = request.cookies.getAll()
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })))

    // Create client
    const supabase = createMiddlewareClient({ req: request, res })

    // Try to get existing session first
    console.log('Checking existing session...')
    const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession()
    console.log('Existing session:', { found: !!existingSession, error: sessionError?.message })

    // Get the token from cookie
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value
    console.log('Auth tokens in cookies:', { 
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    })

    let user = null
    if (accessToken && !existingSession) {
      try {
        console.log('No existing session, trying to create one with token')
        // Try to get user with the token
        const { data: { user: tokenUser }, error: userError } = await supabase.auth.getUser(accessToken)
        console.log('Get user result:', { found: !!tokenUser, error: userError?.message })

        if (tokenUser) {
          user = tokenUser
          console.log('User found with token:', tokenUser.email)
          
          // Set session explicitly
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          console.log('Set session result:', { error: setError?.message })
        }
      } catch (error) {
        console.error('Error in auth flow:', error)
      }
    } else if (existingSession) {
      user = existingSession.user
      console.log('Using existing session user:', user.email)
    }

    // Define public routes that don't require authentication
    const isPublicRoute = request.nextUrl.pathname.startsWith('/login') ||
                         request.nextUrl.pathname.startsWith('/signup') ||
                         request.nextUrl.pathname === '/' ||
                         request.nextUrl.pathname.startsWith('/auth/callback')

    console.log('Route info:', {
      path: request.nextUrl.pathname,
      isPublic: isPublicRoute,
      hasUser: !!user
    })

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      console.log('No user found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Set auth header if we have a user
    if (user) {
      console.log('Setting auth header for user:', user.email)
      res.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    console.log('=== Request End ===')
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


