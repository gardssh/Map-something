import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { switchCoordinates } from '@/components/activities/switchCor';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch activities from strava_activities table
        const { data: activities, error } = await supabase
            .from('strava_activities')
            .select('*');

        if (error) {
            throw error;
        }

        // Transform activities to match your application's format
        const formattedActivities = activities.map(activity => ({
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
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
} 