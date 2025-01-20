import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import * as turf from '@turf/turf';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const route = await request.json();
    
    // Calculate the route distance using turf.js
    const distance = turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' });
    
    // Insert the route data into Supabase
    const { data, error } = await supabase
      .from('routes')
      .insert({
        name: route.name,
        geometry: route.geometry,
        user_id: session.user.id,
        distance: distance,
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ route: data[0] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save route' }, { status: 500 });
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

    // Get routes for the current user
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ routes: data });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to read routes' }, { status: 500 });
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

    const { routeId } = await request.json();
    
    // Delete the route
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
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

    const { routeId, newName, comments, recalculateDistance } = await request.json();
    
    // Update the route
    const updateData: { name?: string; comments?: string; distance?: number } = {};
    if (newName !== undefined) updateData.name = newName;
    if (comments !== undefined) updateData.comments = comments;

    if (recalculateDistance) {
      // Fetch the current route to get its geometry
      const { data: currentRoute } = await supabase
        .from('routes')
        .select('geometry')
        .eq('id', routeId)
        .single();

      if (currentRoute?.geometry) {
        const distance = turf.length(turf.lineString(currentRoute.geometry.coordinates), { units: 'kilometers' });
        updateData.distance = distance;
      }
    }

    const { error } = await supabase
      .from('routes')
      .update(updateData)
      .eq('id', routeId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all routes for the current user
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', session.user.id);

    if (routesError) {
      console.error('Error fetching routes:', routesError);
      return NextResponse.json({ error: routesError.message }, { status: 500 });
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Update each route with its calculated distance
    for (const route of routes) {
      if (route.geometry?.coordinates) {
        const distance = turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' });
        
        const { error: updateError } = await supabase
          .from('routes')
          .update({ distance })
          .eq('id', route.id)
          .eq('user_id', session.user.id);

        if (updateError) {
          console.error(`Error updating route ${route.id}:`, updateError);
          errorCount++;
        } else {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      updated: updatedCount,
      errors: errorCount,
      total: routes.length 
    });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update routes' }, { status: 500 });
  }
} 