import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as turf from '@turf/turf'

interface WebhookEvent {
  aspect_type: 'create' | 'update' | 'delete'
  event_time: number
  object_id: number
  object_type: 'activity' | 'athlete'
  owner_id: number
  subscription_id: number
  updates?: {
    title?: string
    type?: string
    private?: boolean
    authorized?: boolean
  }
}

// Create a Supabase client with the service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key to bypass RLS
  {
    auth: {
      persistSession: false
    }
  }
)

// Format the Strava activity for our database
async function formatStravaActivity(activity: any) {
  // Create a GeoJSON LineString from the polyline
  let geoJsonFeature = null;
  
  if (activity.map?.summary_polyline) {
    const polyline = await import('@mapbox/polyline')
    const decodedCoordinates = polyline.decode(activity.map.summary_polyline)
    // Swap lat/lng to lng/lat for Mapbox
    const coordinates = decodedCoordinates.map(([lat, lng]): [number, number] => [lng, lat])
    
    geoJsonFeature = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
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
    }
  }

  // Ensure arrays are properly formatted as numeric arrays
  const start_latlng = Array.isArray(activity.start_latlng) ? activity.start_latlng.map(Number) : []
  const end_latlng = Array.isArray(activity.end_latlng) ? activity.end_latlng.map(Number) : []
  const bbox = geoJsonFeature ? turf.bbox(geoJsonFeature).map(Number) : []
  const bounds = bbox.length === 4 ? [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] : []

  return {
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
    elevation_data: null, // We'll calculate this later if needed
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
  }
}

// Add this function at the top with other imports
async function refreshStravaToken(refresh_token: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
      client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data;
}

// Handle initial webhook verification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // These are the exact parameters Strava sends
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('Received verification request:', { 
      mode, 
      token, 
      challenge,
      expectedToken: process.env.STRAVA_VERIFY_TOKEN 
    })

    // Verify that this is a valid subscription request from Strava
    if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
      const response = { "hub.challenge": challenge }
      console.log('Sending response:', response)
      
      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    console.log('Verification failed:', { mode, token })
    return NextResponse.json({ error: 'Invalid verification request' }, { status: 403 })
  } catch (error) {
    console.error('Webhook verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

// Handle webhook events
export async function POST(request: Request) {
  try {
    const event: WebhookEvent = await request.json()
    console.log('Received webhook event:', JSON.stringify(event, null, 2))

    // Process the event and wait for it to complete
    try {
      await processWebhookEvent(event)
      return NextResponse.json({ message: 'Success' })
    } catch (error) {
      console.error('Error processing webhook event:', error)
      // Still return 200 to Strava as required
      return NextResponse.json({ message: 'Processed with errors' })
    }
  } catch (error) {
    console.error('Webhook event error:', error)
    return NextResponse.json({ error: 'Event processing failed' }, { status: 500 })
  }
}

// Modify the processWebhookEvent function to handle token refresh
async function processWebhookEvent(event: WebhookEvent) {
  try {
    switch (event.object_type) {
      case 'activity':
        switch (event.aspect_type) {
          case 'create':
            console.log('Processing create activity event:', event.object_id)
            console.log('Owner ID:', event.owner_id)
            
            // Get the user's tokens using service role client
            const { data: tokenData, error: tokenError } = await supabase
              .from('strava_tokens')
              .select('access_token, refresh_token, user_id, strava_athlete_id, expires_at')
              .eq('strava_athlete_id', event.owner_id)
              .single()

            if (tokenError) {
              console.error('Token lookup error:', tokenError)
              console.error('Looking for athlete_id:', event.owner_id)
              return
            }

            if (!tokenData?.access_token) {
              console.error('No access token found for athlete:', event.owner_id)
              return
            }

            // Check if token needs refresh
            let accessToken = tokenData.access_token;
            if (tokenData.expires_at * 1000 < Date.now()) {
              console.log('Token expired, refreshing...');
              try {
                const refreshedData = await refreshStravaToken(tokenData.refresh_token);
                accessToken = refreshedData.access_token;
                
                // Update tokens in database
                await supabase
                  .from('strava_tokens')
                  .update({
                    access_token: refreshedData.access_token,
                    refresh_token: refreshedData.refresh_token,
                    expires_at: refreshedData.expires_at,
                    updated_at: new Date().toISOString()
                  })
                  .eq('strava_athlete_id', event.owner_id);
                
                console.log('Token refreshed successfully');
              } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                return;
              }
            }

            console.log('Found token for user:', tokenData.user_id)

            // Fetch the full activity details from Strava using the potentially refreshed token
            console.log('Fetching activity details from Strava...')
            const response = await fetch(
              `https://www.strava.com/api/v3/activities/${event.object_id}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            )

            if (!response.ok) {
              const errorText = await response.text()
              console.error('Failed to fetch activity:', errorText)
              return
            }

            const activity = await response.json()
            console.log('Received activity from Strava:', activity.name)
            
            // Format and store the activity
            console.log('Formatting activity...')
            const formattedActivity = await formatStravaActivity(activity)
            
            // Prepare the activity data
            const activityData = {
              id: crypto.randomUUID(),
              user_id: tokenData.user_id,
              strava_id: event.object_id,
              name: activity.name,
              type: activity.type,
              sport_type: activity.sport_type,
              distance: activity.distance,
              moving_time: activity.moving_time,
              total_elevation_gain: activity.total_elevation_gain,
              start_date: activity.start_date,
              average_speed: activity.average_speed,
              max_speed: activity.max_speed || 0,
              summary_polyline: activity.map?.summary_polyline || '',
              elev_low: activity.elev_low,
              elev_high: activity.elev_high,
              selected: false,
              visible: true,
              start_latlng: Array.isArray(activity.start_latlng) ? activity.start_latlng.map(Number) : [],
              end_latlng: Array.isArray(activity.end_latlng) ? activity.end_latlng.map(Number) : [],
              geometry: formattedActivity.geometry,
              bounds: formattedActivity.bounds,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            console.log('Inserting activity into database:', activityData)
            const { error: insertError } = await supabase
              .from('strava_activities')
              .insert(activityData)

            if (insertError) {
              console.error('Failed to insert activity:', insertError)
              throw insertError
            } else {
              console.log('Successfully inserted activity:', event.object_id)
            }
            break

          case 'update':
            // Update the activity in our database
            if (event.updates) {
              const { error: updateError } = await supabase
                .from('strava_activities')
                .update({
                  name: event.updates.title,
                  type: event.updates.type,
                  updated_at: new Date().toISOString()
                })
                .eq('strava_id', event.object_id)
              
              if (updateError) {
                console.error('Failed to update activity:', updateError)
              } else {
                console.log('Successfully updated activity:', event.object_id)
              }
            }
            break

          case 'delete':
            // Delete the activity from our database
            const { error: deleteError } = await supabase
              .from('strava_activities')
              .delete()
              .eq('strava_id', event.object_id)
            
            if (deleteError) {
              console.error('Failed to delete activity:', deleteError)
            } else {
              console.log('Successfully deleted activity:', event.object_id)
            }
            break
        }
        break

      case 'athlete':
        if (event.updates?.authorized === false) {
          // Handle deauthorization
          const { error: deauthError } = await supabase
            .from('strava_tokens')
            .delete()
            .eq('strava_athlete_id', event.owner_id)
          
          if (deauthError) {
            console.error('Failed to handle deauthorization:', deauthError)
          } else {
            console.log('Successfully handled deauthorization for athlete:', event.owner_id)
          }
        }
        break
    }
  } catch (error) {
    console.error('Error processing webhook event:', error)
    throw error // Re-throw to be caught by the POST handler
  }
} 