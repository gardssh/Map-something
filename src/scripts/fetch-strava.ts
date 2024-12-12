import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const STRAVA_REFRESH_TOKEN = process.env.NEXT_PUBLIC_STRAVA_REFRESH_TOKEN;
const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_ID;
const STRAVA_CLIENT_SECRET = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET;

// Add debug logging for environment variables
console.log('Environment variables loaded:', {
    hasRefreshToken: !!STRAVA_REFRESH_TOKEN,
    hasClientId: !!STRAVA_CLIENT_ID,
    hasClientSecret: !!STRAVA_CLIENT_SECRET
});

// Move USER_ID declaration before its usage
const USER_ID = '5887366d-8e17-4d61-9f45-6a47ec2aaacc';

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function refreshAccessToken() {
    try {
        console.log('Attempting to refresh token with:', {
            clientId: STRAVA_CLIENT_ID,
            hasClientSecret: !!STRAVA_CLIENT_SECRET,
            hasRefreshToken: !!STRAVA_REFRESH_TOKEN
        });

        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                refresh_token: STRAVA_REFRESH_TOKEN,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token refresh failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Failed to refresh token: ${errorText}`);
        }

        const data = await response.json();
        console.log('Token refresh successful, received new access token');
        return data;
    } catch (error) {
        console.error('Error in refreshAccessToken:', error);
        throw error;
    }
}

async function fetchActivities(accessToken: string) {
    try {
        console.log('Attempting to fetch activities with access token:', accessToken.substring(0, 10) + '...');
        
        const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Activities fetch failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Failed to fetch activities: ${errorText}`);
        }

        const data = await response.json();
        console.log(`Successfully fetched ${data.length} activities`);
        return data;
    } catch (error) {
        console.error('Error in fetchActivities:', error);
        throw error;
    }
}

async function main() {
    try {
        // Refresh the access token
        console.log('Starting token refresh...');
        const tokenData = await refreshAccessToken();
        console.log('Token refresh completed, access token:', tokenData.access_token.substring(0, 10) + '...');

        // Fetch activities
        console.log('Starting activities fetch...');
        const activities = await fetchActivities(tokenData.access_token);
        console.log(`Fetched ${activities.length} activities`);

        // Insert activities into Supabase
        console.log('Inserting activities into database...');
        for (const activity of activities) {
            // First check if activity exists
            const { data: existingActivity } = await supabase
                .from('strava_activities')
                .select('id')
                .eq('strava_id', activity.id)
                .single();

            if (existingActivity) {
                // Update existing activity
                const { error: updateError } = await supabase
                    .from('strava_activities')
                    .update({
                        name: activity.name,
                        type: activity.type,
                        sport_type: activity.sport_type,
                        distance: activity.distance,
                        moving_time: activity.moving_time,
                        total_elevation_gain: activity.total_elevation_gain,
                        average_speed: activity.average_speed,
                        start_date: activity.start_date,
                        summary_polyline: activity.map?.summary_polyline,
                        elev_low: activity.elev_low,
                        elev_high: activity.elev_high,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingActivity.id);

                if (updateError) {
                    console.error(`Error updating activity ${activity.id}:`, updateError);
                } else {
                    console.log(`Successfully updated activity ${activity.id}`);
                }
            } else {
                // Insert new activity
                const { error: insertError } = await supabase
                    .from('strava_activities')
                    .insert({
                        id: crypto.randomUUID(),
                        user_id: USER_ID,
                        strava_id: activity.id,
                        name: activity.name,
                        type: activity.type,
                        sport_type: activity.sport_type,
                        distance: activity.distance,
                        moving_time: activity.moving_time,
                        total_elevation_gain: activity.total_elevation_gain,
                        average_speed: activity.average_speed,
                        start_date: activity.start_date,
                        summary_polyline: activity.map?.summary_polyline,
                        elev_low: activity.elev_low,
                        elev_high: activity.elev_high,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error(`Error inserting activity ${activity.id}:`, insertError);
                } else {
                    console.log(`Successfully inserted activity ${activity.id}`);
                }
            }
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

main(); 