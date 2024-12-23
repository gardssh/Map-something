import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { waypoints } = await request.json();
    console.log('Received waypoints data:', waypoints);
    const waypointsToInsert = Array.isArray(waypoints) ? waypoints : [waypoints];
    console.log('Formatted waypoints to insert:', waypointsToInsert);
    
    // Insert the waypoint data into Supabase
    const { data, error } = await supabase
      .from('waypoints')
      .insert(waypointsToInsert.map(waypoint => {
        const formattedWaypoint = {
          id: waypoint.id,
          name: waypoint.name,
          geometry: {
            type: 'Point' as const,
            coordinates: waypoint.coordinates
          },
          coordinates: waypoint.coordinates,
          user_id: session.user.id,
          created_at: new Date().toISOString()
        };
        console.log('Formatted waypoint:', formattedWaypoint);
        return formattedWaypoint;
      }))
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Successfully inserted waypoints:', data);
    return NextResponse.json({ waypoints: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save waypoints' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get waypoints for the current user
    const { data, error } = await supabase
      .from('waypoints')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ waypoints: data });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to read waypoints' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { waypointId } = await request.json();
    
    // Delete the waypoint
    const { error } = await supabase
      .from('waypoints')
      .delete()
      .eq('id', waypointId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete waypoint' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { waypointId, newName, comments } = await request.json();
    
    // Update the waypoint
    const updateData: { name?: string; comments?: string } = {};
    if (newName !== undefined) updateData.name = newName;
    if (comments !== undefined) updateData.comments = comments;

    const { error } = await supabase
      .from('waypoints')
      .update(updateData)
      .eq('id', waypointId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update waypoint' }, { status: 500 });
  }
} 