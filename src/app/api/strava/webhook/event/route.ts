import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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

export async function POST(request: Request) {
  try {
    const event: WebhookEvent = await request.json()
    console.log('Received webhook event:', event)

    // Return 200 OK quickly as required by Strava
    // Process the event asynchronously
    processWebhookEvent(event).catch(console.error)

    return NextResponse.json({ message: 'Success' })
  } catch (error) {
    console.error('Webhook event error:', error)
    return NextResponse.json({ error: 'Event processing failed' }, { status: 500 })
  }
}

async function processWebhookEvent(event: WebhookEvent) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    switch (event.object_type) {
      case 'activity':
        switch (event.aspect_type) {
          case 'create':
            // Get the user's access token
            const { data: tokenData } = await supabase
              .from('strava_tokens')
              .select('access_token')
              .eq('strava_athlete_id', event.owner_id)
              .single()

            if (!tokenData?.access_token) {
              console.error('No access token found for athlete:', event.owner_id)
              return
            }

            // Fetch the full activity details from Strava
            const response = await fetch(
              `https://www.strava.com/api/v3/activities/${event.object_id}`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`
                }
              }
            )

            if (!response.ok) {
              console.error('Failed to fetch activity:', await response.text())
              return
            }

            const activity = await response.json()
            
            // Format and store the activity
            const formattedActivity = await formatStravaActivity(activity)
            const { error: insertError } = await supabase
              .from('strava_activities')
              .insert({
                ...formattedActivity,
                id: crypto.randomUUID(),
                strava_id: event.object_id,
                user_id: event.owner_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (insertError) {
              console.error('Failed to insert activity:', insertError)
            }
            break

          case 'update':
            // Update the activity in our database
            if (event.updates) {
              await supabase
                .from('strava_activities')
                .update({
                  name: event.updates.title,
                  type: event.updates.type,
                  updated_at: new Date().toISOString()
                })
                .eq('strava_id', event.object_id)
            }
            break

          case 'delete':
            // Delete the activity from our database
            await supabase
              .from('strava_activities')
              .delete()
              .eq('strava_id', event.object_id)
            break
        }
        break

      case 'athlete':
        if (event.updates?.authorized === false) {
          // Handle deauthorization
          await supabase
            .from('strava_tokens')
            .delete()
            .eq('strava_athlete_id', event.owner_id)
        }
        break
    }
  } catch (error) {
    console.error('Error processing webhook event:', error)
    // Log to error tracking service in production
  }
} 