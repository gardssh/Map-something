import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { StravaService } from '@/lib/strava';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/settings?error=access_denied', req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_code', req.url));
    }

    const stravaService = new StravaService();
    await stravaService.saveToken(session.user.id, code);
    
    // Fetch initial activities
    await stravaService.fetchActivities(session.user.id);

    return NextResponse.redirect(new URL('/settings?success=connected', req.url));
  } catch (error) {
    console.error('Error handling Strava callback:', error);
    return NextResponse.redirect(new URL('/settings?error=server_error', req.url));
  }
}

export const dynamic = 'force-dynamic'; 