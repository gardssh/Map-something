import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch activities for the user
    const { data: activities, error } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_date', { ascending: false });

    if (error) throw error;

    // Transform the data to match the expected structure
    const transformedActivities = activities?.map(activity => ({
      ...activity,
      map: {
        summary_polyline: activity.summary_polyline
      },
      // Remove the original summary_polyline to avoid duplication
      summary_polyline: undefined
    })) || [];

    return NextResponse.json({ activities: transformedActivities });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 