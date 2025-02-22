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
    console.log('Request URL:', request.url)
    console.log('Request domain:', url.hostname)

    // Create client
    const supabase = createMiddlewareClient({ req: request, res })

    // Get the token from cookie
    const accessToken = request.cookies.get('sb-access-token')?.value
    console.log('Found access token:', !!accessToken)

    let user = null
    if (accessToken) {
      try {
        // First set the session with the token
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        })
        console.log('Set session result:', { success: !!session, error: sessionError?.message })

        if (session) {
          // If session was set successfully, get the user
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
          console.log('Get user result:', { found: !!currentUser, error: userError?.message })
          
          if (currentUser) {
            user = currentUser
            console.log('User found:', currentUser.email)
          }
        } else {
          console.log('Failed to set session:', sessionError?.message)
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

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      console.log('No user found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Set auth header if we have a user
    if (user) {
      res.headers.set('Authorization', `Bearer ${accessToken}`)
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


