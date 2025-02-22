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

    // Create client
    const supabase = createMiddlewareClient({ req: request, res })

    // Get the token from cookie
    const accessToken = request.cookies.get('sb-access-token')?.value
    console.log('Found access token:', !!accessToken)

    let user = null
    if (accessToken) {
      try {
        // Try to get user directly first
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(accessToken)
        console.log('Get user result:', { found: !!currentUser, error: userError?.message })
        
        if (currentUser) {
          user = currentUser
        } else if (userError) {
          // If error, try to refresh the session
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
          console.log('Refresh session result:', { found: !!session, error: refreshError?.message })
          
          if (session) {
            user = session.user
          }
        }
      } catch (error) {
        console.error('Error validating token:', error)
      }
    }

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


