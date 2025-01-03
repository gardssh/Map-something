import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { switchCoordinates, type RoutePoints } from '@/components/activities/switchCor';
import { type Activity } from '@/types/activity';
import * as turf from '@turf/turf';
import type { Feature, LineString, GeoJsonProperties } from 'geojson';
import polyline from 'polyline';

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

    const decodedPath = polyline.decode(activity.map.summary_polyline);
    const totalDistance = activity.distance;
    
    return decodedPath.map((point, index) => ({
        distance: (index / decodedPath.length) * totalDistance / 1000, // Convert to km
        elevation: point[2] || 0 // Elevation data if available
    }));
}

async function formatStravaActivity(activity: any): Promise<Activity> {
    const routePoints = activity.map?.summary_polyline ? switchCoordinates(activity) : null;

    // Create a GeoJSON LineString from routePoints
    const geoJsonFeature: Feature<LineString, GeoJsonProperties> | null = routePoints ? {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: routePoints.coordinates
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
    } : null;

    // Ensure arrays are properly formatted
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
        start_latlng,
        end_latlng,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        elev_high: activity.elev_high,
        elev_low: activity.elev_low,
        map: {
            summary_polyline: activity.map?.summary_polyline || '',
            geometry: routePoints || null
        } as ActivityMap,
        athlete: {
            id: activity.athlete?.id
        },
        selected: false,
        visible: true,
        coordinates: start_latlng,
        bounds,
        elevation_data: formatElevationData(activity),
        feature: geoJsonFeature,
        sourceId: 'routes',
        layerId: `route-${activity.id}`,
        isHovered: false
    };
}

export async function POST(request: Request) {
    try {
        console.log('Starting Strava import process...');
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_ID;
        const stravaClientSecret = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET;
        const stravaRefreshToken = process.env.NEXT_PUBLIC_STRAVA_REFRESH_TOKEN;

        // Log environment variables (without exposing secrets)
        console.log('Environment variables loaded:', {
            hasSupabaseUrl: !!supabaseUrl,
            hasSupabaseKey: !!supabaseKey,
            hasStravaId: !!stravaClientId,
            hasStravaSecret: !!stravaClientSecret,
            hasStravaRefreshToken: !!stravaRefreshToken
        });

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get user from request
        const body = await request.json();
        const user_id = body.user_id || body.userId;
        console.log('Processing import for user:', user_id);

        if (!user_id) {
            return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
        }

        // Get fresh Strava access token
        console.log('Fetching Strava access token...');
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: stravaClientId,
                client_secret: stravaClientSecret,
                refresh_token: stravaRefreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strava token refresh failed:', {
                status: response.status,
                error: errorText
            });
            throw new Error(`Failed to refresh Strava token: ${errorText}`);
        }

        const tokenData = await response.json();
        console.log('Successfully obtained Strava access token');

        // Replace the single fetch with getAllActivities
        console.log('Fetching all Strava activities...');
        const activities = await getAllActivities(tokenData.access_token);
        console.log(`Fetched ${activities.length} total activities from Strava`);

        // Insert activities into Supabase
        console.log('Starting Supabase import...');
        let successCount = 0;
        let errorCount = 0;

        for (const stravaActivity of activities) {
            try {
                const formattedActivity = await formatStravaActivity(stravaActivity);
                
                const { data: existingActivity } = await supabase
                    .from('strava_activities')
                    .select('id')
                    .eq('strava_id', formattedActivity.id)
                    .single();

                if (existingActivity) {
                    const { error: updateError } = await supabase
                        .from('strava_activities')
                        .update({
                            name: formattedActivity.name,
                            type: formattedActivity.type,
                            sport_type: formattedActivity.sport_type,
                            distance: formattedActivity.distance,
                            moving_time: formattedActivity.moving_time,
                            total_elevation_gain: formattedActivity.total_elevation_gain,
                            average_speed: formattedActivity.average_speed,
                            max_speed: formattedActivity.max_speed,
                            start_date: formattedActivity.start_date,
                            start_latlng: formattedActivity.start_latlng,
                            end_latlng: formattedActivity.end_latlng,
                            summary_polyline: formattedActivity.map.summary_polyline,
                            average_heartrate: formattedActivity.average_heartrate,
                            max_heartrate: formattedActivity.max_heartrate,
                            elev_low: formattedActivity.elev_low,
                            elev_high: formattedActivity.elev_high,
                            selected: formattedActivity.selected,
                            visible: formattedActivity.visible,
                            coordinates: formattedActivity.coordinates,
                            bounds: formattedActivity.bounds,
                            updated_at: new Date().toISOString(),
                            feature: formattedActivity.feature,
                            source_id: formattedActivity.sourceId,
                            layer_id: formattedActivity.layerId
                        })
                        .eq('id', existingActivity.id);

                    if (updateError) {
                        console.error(`Error updating activity ${formattedActivity.id}:`, updateError);
                        errorCount++;
                    } else {
                        successCount++;
                    }
                } else {
                    const { error: insertError } = await supabase
                        .from('strava_activities')
                        .insert({
                            id: crypto.randomUUID(),
                            user_id: user_id,
                            strava_id: formattedActivity.id,
                            name: formattedActivity.name,
                            type: formattedActivity.type,
                            sport_type: formattedActivity.sport_type,
                            distance: formattedActivity.distance,
                            moving_time: formattedActivity.moving_time,
                            total_elevation_gain: formattedActivity.total_elevation_gain,
                            average_speed: formattedActivity.average_speed,
                            max_speed: formattedActivity.max_speed,
                            start_date: formattedActivity.start_date,
                            start_latlng: formattedActivity.start_latlng,
                            end_latlng: formattedActivity.end_latlng,
                            summary_polyline: formattedActivity.map.summary_polyline,
                            average_heartrate: formattedActivity.average_heartrate,
                            max_heartrate: formattedActivity.max_heartrate,
                            elev_low: formattedActivity.elev_low,
                            elev_high: formattedActivity.elev_high,
                            selected: formattedActivity.selected,
                            visible: formattedActivity.visible,
                            coordinates: formattedActivity.coordinates,
                            bounds: formattedActivity.bounds,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            feature: formattedActivity.feature,
                            source_id: formattedActivity.sourceId,
                            layer_id: formattedActivity.layerId
                        });

                    if (insertError) {
                        console.error(`Error inserting activity ${formattedActivity.id}:`, insertError);
                        errorCount++;
                    } else {
                        successCount++;
                    }
                }
            } catch (error) {
                console.error(`Error processing activity ${stravaActivity.id}:`, error);
                errorCount++;
            }
        }

        console.log(`Import complete. Success: ${successCount}, Errors: ${errorCount}`);
        return NextResponse.json({ 
            success: true, 
            stats: { 
                total: activities.length, 
                success: successCount, 
                errors: errorCount 
            } 
        });
    } catch (error) {
        console.error('Error in import process:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to import activities' 
        }, { status: 500 });
    }
} 