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
    const projectToken = request.cookies.get('sb-kmespwkiycekritowlfo-auth-token')?.value
    
    console.log('Tokens found:', { 
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasProjectToken: !!projectToken
    })

    let user = null
    if (accessToken) {
      try {
        // Try to get user with the token directly first
        const { data: { user: tokenUser }, error: userError } = await supabase.auth.getUser(accessToken)
        console.log('Get user result:', { found: !!tokenUser, error: userError?.message })

        if (tokenUser) {
          user = tokenUser
          console.log('User found with token:', tokenUser.email)
          
          // Set auth header
          res.headers.set('Authorization', `Bearer ${accessToken}`)

          // Now try to establish the session
          if (refreshToken) {
            console.log('Setting session for found user...')
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            if (setError) {
              console.error('Error setting session:', setError.message)
            } else {
              console.log('Session set successfully')
              
              // Set cookies with correct attributes
              res.cookies.set('sb-access-token', accessToken, {
                path: '/',
                sameSite: 'lax',
                secure: true,
                domain: VALID_DOMAIN
              })
              
              res.cookies.set('sb-refresh-token', refreshToken, {
                path: '/',
                sameSite: 'lax',
                secure: true,
                domain: VALID_DOMAIN
              })

              if (projectToken) {
                res.cookies.set('sb-kmespwkiycekritowlfo-auth-token', projectToken, {
                  path: '/',
                  sameSite: 'lax',
                  secure: true,
                  domain: VALID_DOMAIN
                })
              }
            }
          }
        } else if (userError?.message === 'Auth session missing!') {
          // If session is missing but we have tokens, try to refresh
          console.log('Attempting to refresh session...')
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
          if (session?.user) {
            user = session.user
            console.log('Session refreshed, user found:', user.email)
          } else if (refreshError) {
            console.error('Error refreshing session:', refreshError.message)
          }
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


