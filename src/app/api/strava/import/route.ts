import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Activity } from '@/types/activity'
import * as turf from '@turf/turf'
import type { Feature, LineString, GeoJsonProperties } from 'geojson'
import polyline from '@mapbox/polyline'

interface ActivityMap {
    summary_polyline: string;
}

async function getAllActivities(accessToken: string) {
    console.log('Starting to fetch all activities...');
    let page = 1;
    let allActivities: any[] = [];
    let hasMore = true;
    
    while (hasMore) {
        console.log(`Fetching page ${page}...`);
        const response = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch activities page ${page}: ${errorText}`);
        }

        const activities = await response.json();
        console.log(`Received ${activities.length} activities on page ${page}`);
        
        if (activities.length === 0) {
            hasMore = false;
        } else {
            allActivities = [...allActivities, ...activities];
            page++;
        }
    }

    console.log(`Total activities fetched: ${allActivities.length}`);
    return allActivities;
}

function formatElevationData(activity: any) {
    if (!activity.map?.summary_polyline) return null;

    try {
        const decodedPath = polyline.decode(activity.map.summary_polyline);
        const totalDistance = activity.distance;
        
        // Only use lat/lng coordinates, ignore elevation
        return decodedPath.map((point, index) => ({
            distance: (index / decodedPath.length) * totalDistance / 1000, // Convert to km
            elevation: 0 // Default to 0 since elevation data isn't reliable in the polyline
        }));
    } catch (error) {
        console.error('Error formatting elevation data:', error);
        return null;
    }
}

async function formatStravaActivity(activity: any): Promise<Activity> {
    // Create a GeoJSON LineString from the polyline
    let geoJsonFeature: Feature<LineString, GeoJsonProperties> | null = null;
    
    if (activity.map?.summary_polyline) {
        const decodedCoordinates = polyline.decode(activity.map.summary_polyline);
        // Swap lat/lng to lng/lat for Mapbox
        const coordinates = decodedCoordinates.map(([lat, lng]): [number, number] => [lng, lat]);
        
        geoJsonFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates
            },
            properties: {
                id: activity.id,
                name: activity.name,
                type: activity.type,
                distance: activity.distance,
                moving_time: activity.moving_time,
                isRoute: false,
                isActivity: true,
                selected: false,
                visible: true,
                source: 'strava',
                color: '#ff4400'
            }
        };
    }

    // Ensure arrays are properly formatted as numeric arrays
    const start_latlng = Array.isArray(activity.start_latlng) ? activity.start_latlng.map(Number) : [];
    const end_latlng = Array.isArray(activity.end_latlng) ? activity.end_latlng.map(Number) : [];
    const bbox = geoJsonFeature ? turf.bbox(geoJsonFeature).map(Number) : [];
    const bounds = bbox.length === 4 ? [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] : [];

    return {
        id: activity.id,
        name: activity.name,
        type: activity.type,
        sport_type: activity.sport_type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        total_elevation_gain: activity.total_elevation_gain,
        start_date: activity.start_date,
        average_speed: activity.average_speed,
        summary_polyline: activity.map?.summary_polyline || '',
        elev_low: activity.elev_low,
        elev_high: activity.elev_high,
        selected: false,
        visible: true,
        elevation_data: formatElevationData(activity),
        properties: geoJsonFeature?.properties || null,
        source_id: 'routes',
        layer_id: `route-${activity.id}`,
        is_hovered: false,
        feature: geoJsonFeature,
        geometry: geoJsonFeature?.geometry || null,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        max_speed: activity.max_speed,
        start_latlng,
        end_latlng,
        coordinates: start_latlng,
        bounds
    };
}

export async function POST(request: Request) {
    try {
        // Get Supabase client and verify authentication
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!session?.user) {
            console.error('No session found:', sessionError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { access_token } = await request.json()
        if (!access_token) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 400 })
        }

        // Fetch all activities from Strava
        console.log('Fetching all Strava activities...')
        const activities = await getAllActivities(access_token)
        console.log(`Fetched ${activities.length} total activities from Strava`)

        // Insert/update activities in Supabase
        console.log('Starting Supabase import...')
        let successCount = 0
        let updateCount = 0

        for (const stravaActivity of activities) {
            try {
                const formattedActivity = await formatStravaActivity(stravaActivity)
                
                // Prepare the activity data
                const activityData = {
                    id: crypto.randomUUID(),
                    user_id: session.user.id,
                    strava_id: formattedActivity.id,
                    name: formattedActivity.name,
                    type: formattedActivity.type,
                    sport_type: formattedActivity.sport_type,
                    distance: formattedActivity.distance,
                    moving_time: formattedActivity.moving_time,
                    total_elevation_gain: formattedActivity.total_elevation_gain,
                    start_date: formattedActivity.start_date,
                    average_speed: formattedActivity.average_speed,
                    summary_polyline: formattedActivity.summary_polyline,
                    elev_low: formattedActivity.elev_low,
                    elev_high: formattedActivity.elev_high,
                    selected: false,
                    visible: true,
                    elevation_data: formattedActivity.elevation_data,
                    properties: formattedActivity.properties,
                    source_id: formattedActivity.source_id,
                    layer_id: formattedActivity.layer_id,
                    is_hovered: formattedActivity.is_hovered,
                    feature: formattedActivity.feature,
                    geometry: formattedActivity.geometry,
                    average_heartrate: formattedActivity.average_heartrate,
                    max_heartrate: formattedActivity.max_heartrate,
                    max_speed: formattedActivity.max_speed,
                    start_latlng: formattedActivity.start_latlng,
                    end_latlng: formattedActivity.end_latlng,
                    coordinates: formattedActivity.coordinates,
                    bounds: formattedActivity.bounds,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }

                const { error: upsertError } = await supabase
                    .from('strava_activities')
                    .upsert(activityData, {
                        onConflict: 'strava_id',
                        ignoreDuplicates: false // We want to update existing records
                    })

                if (upsertError) {
                    console.error('Upsert error:', upsertError)
                    throw upsertError
                }
                
                // If we get here, the operation was successful
                successCount++
            } catch (error) {
                console.error('Error processing activity:', error)
            }
        }

        return NextResponse.json({
            message: 'Import completed',
            stats: {
                total: activities.length,
                success: successCount
            }
        })
    } catch (error) {
        console.error('Import error:', error)
        return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }
} 