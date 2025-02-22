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

    // Get both access and refresh tokens
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value
    console.log('Tokens found:', { 
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    })

    let user = null
    if (accessToken) {
      try {
        // First try to set the session with both tokens
        if (refreshToken) {
          console.log('Setting session with both tokens...')
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          if (sessionError) {
            console.error('Error setting session:', sessionError.message)
          } else {
            console.log('Session set successfully')
          }
        }

        // Try to get user with the token
        const { data: { user: tokenUser }, error: userError } = await supabase.auth.getUser(accessToken)
        console.log('Get user result:', { found: !!tokenUser, error: userError?.message })

        if (tokenUser) {
          user = tokenUser
          console.log('User found:', tokenUser.email)
          
          // Set auth header
          res.headers.set('Authorization', `Bearer ${accessToken}`)
        }
      } catch (error) {
        console.error('Error in auth flow:', error)
      }
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


