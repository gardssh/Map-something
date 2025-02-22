import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_DOMAIN = 'kart.gardsh.no'

export async function middleware(request: NextRequest) {
  try {
    // Create a response early so we can modify headers
    const res = NextResponse.next()
    
    // Array to collect logs
    const logs: string[] = []
    const log = (message: string) => {
      console.log(message)
      logs.push(message)
    }
    
    log('=== Middleware Start ===')
    log(`URL: ${request.url}`)
    log(`Method: ${request.method}`)
    
    // Debug logs for request
    const url = new URL(request.url)
    log(`Request domain: ${url.hostname}`)
    log(`Cookie header: ${request.headers.get('cookie')}`)
    log(`Authorization header: ${request.headers.get('authorization')}`)

    // Create client
    const supabase = createMiddlewareClient({ req: request, res })

    // Get all cookies and log them
    const cookies = request.cookies.getAll()
    log(`All request cookies: ${cookies.map(c => `${c.name}=${c.value.substring(0, 10)}...`).join(', ')}`)

    // Get the token from cookie
    const accessToken = request.cookies.get('sb-access-token')?.value
    log(`Found access token: ${!!accessToken}`)

    let user = null
    if (accessToken) {
      try {
        // Try to get user directly first
        log('Attempting to get user with token')
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        log(`Get user result: ${JSON.stringify({ found: !!currentUser, error: userError?.message })}`)
        
        if (currentUser) {
          user = currentUser
          log(`User found: ${currentUser.email}`)
        } else {
          log('No user found with token, attempting refresh')
          // Try to refresh the session
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
          log(`Refresh session result: ${JSON.stringify({ found: !!session, error: refreshError?.message })}`)
          
          if (session?.user) {
            user = session.user
            log(`User found after refresh: ${session.user.email}`)
          }
        }
      } catch (error) {
        log(`Error validating token: ${error}`)
      }
    } else {
      log('No access token found in cookies')
    }

    // Define public routes that don't require authentication
    const isPublicRoute = request.nextUrl.pathname.startsWith('/login') ||
                         request.nextUrl.pathname.startsWith('/signup') ||
                         request.nextUrl.pathname === '/' ||
                         request.nextUrl.pathname.startsWith('/auth/callback')

    log(`Route info: ${JSON.stringify({ 
      path: request.nextUrl.pathname,
      isPublic: isPublicRoute,
      hasUser: !!user
    })}`)

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      log('No user found, redirecting to login')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Set the token in the response headers if we have a user
    if (user && accessToken) {
      log('Setting auth headers for authenticated user')
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

    // Add logs to response headers
    res.headers.set('X-Middleware-Logs', logs.join('\n'))
    
    log('=== Middleware End ===')
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On critical errors, redirect to login
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.headers.set('X-Middleware-Error', String(error))
    return res
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


