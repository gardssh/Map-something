import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function getActivities() {
    try {
        const supabase = createRouteHandlerClient<Database>({ cookies });
        
        // Get the current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.error('Session error:', sessionError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch activities from strava_activities table
        const { data: activities, error } = await supabase
            .from('strava_activities')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) {
            throw error;
        }

        // Transform activities to match your application's format
        const formattedActivities = activities
            .filter(activity => activity.summary_polyline && activity.summary_polyline.length > 0)
            .map(activity => ({
                id: activity.strava_id,
                name: activity.name,
                type: activity.type,
                sport_type: activity.sport_type,
                distance: activity.distance,
                moving_time: activity.moving_time,
                total_elevation_gain: activity.total_elevation_gain,
                start_date: activity.start_date,
                start_latlng: activity.start_latlng,
                end_latlng: activity.end_latlng,
                average_speed: activity.average_speed,
                max_speed: activity.max_speed,
                average_heartrate: activity.average_heartrate,
                max_heartrate: activity.max_heartrate,
                elev_high: activity.elev_high,
                elev_low: activity.elev_low,
                map: {
                    summary_polyline: activity.summary_polyline,
                    geometry: activity.geometry
                },
                // These fields are important for map display
                selected: false,
                visible: true,
                coordinates: activity.start_latlng,
                bounds: activity.bounds,
                // Add route-specific properties
                properties: {
                    id: activity.strava_id,
                    name: activity.name,
                    type: activity.type,
                    distance: activity.distance,
                    moving_time: activity.moving_time,
                    isRoute: false,
                    isActivity: true,
                    selected: false,
                    visible: true,
                    source: 'strava'
                }
            }));

        return NextResponse.json({ activities: formattedActivities });
    } catch (error) {
        console.error('Activities fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
} 