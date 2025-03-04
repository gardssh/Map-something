import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const REDIRECT_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://kart.gardsh.no'
  : 'http://localhost:3000'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('Strava callback received:', request.url);
    const url = new URL(REDIRECT_BASE)
    const searchParams = new URL(request.url).searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    console.log('Strava callback params:', { 
      code: code ? 'present' : 'missing', 
      state: state ? 'present' : 'missing',
      error: error || 'none'
    });
    
    // Handle Strava OAuth errors
    if (error) {
      console.error('Strava OAuth error:', error)
      return NextResponse.redirect(new URL(`/profile?error=${error}`, REDIRECT_BASE))
    }

    if (!code) {
      console.error('Missing code in Strava callback');
      return NextResponse.redirect(new URL('/profile?error=missing_code', REDIRECT_BASE))
    }

    // Exchange the authorization code for tokens
    console.log('Exchanging code for tokens...');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token exchange response:', { 
      status: tokenResponse.status, 
      ok: tokenResponse.ok,
      error: tokenData.error || 'none',
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      hasAthlete: !!tokenData.athlete
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/profile?error=token_exchange', REDIRECT_BASE))
    }

    // Get the current user from Supabase
    console.log('Getting current user from Supabase...');
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Auth user result:', { 
      found: !!user, 
      error: authError?.message || 'none',
      userId: user?.id
    });

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.redirect(new URL('/profile?error=not_authenticated', REDIRECT_BASE))
    }

    // Check if this Strava account is already connected to another user
    const { data: existingToken } = await supabase
      .from('strava_tokens')
      .select('user_id')
      .eq('strava_athlete_id', tokenData.athlete.id)
      .single()

    if (existingToken && existingToken.user_id !== user.id) {
      console.error('Strava account already connected to another user')
      return NextResponse.redirect(
        new URL('/profile?error=strava_account_already_connected', REDIRECT_BASE)
      )
    }

    // Store tokens in Supabase
    const { error: upsertError } = await supabase
      .from('strava_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        strava_athlete_id: tokenData.athlete.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError)
      return NextResponse.redirect(new URL('/profile?error=token_storage', REDIRECT_BASE))
    }

    // Success! Redirect back to profile
    const successUrl = new URL('/profile', REDIRECT_BASE)
    successUrl.searchParams.set('success', 'connected')
    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error('Strava callback error:', error)
    return NextResponse.redirect(new URL('/profile?error=unknown', REDIRECT_BASE))
  }
} 