import { NextRequest, NextResponse } from 'next/server';
import { StravaService } from '@/lib/strava';

const VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook subscription
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return new NextResponse('Invalid verification token', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const stravaService = new StravaService();
    await stravaService.handleWebhook(event);
    return new NextResponse('OK');
  } catch (error) {
    console.error('Error handling Strava webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 