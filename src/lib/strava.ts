import { createClient } from './supabase';
import { DbStravaToken, DbStravaActivity } from '@/types/supabase';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export class StravaService {
  private supabase = createClient();

  async getToken(userId: string): Promise<DbStravaToken | null> {
    const { data: token } = await this.supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!token) return null;

    // Check if token needs refresh
    if (token.expires_at * 1000 < Date.now()) {
      return this.refreshToken(token);
    }

    return token;
  }

  private async refreshToken(token: DbStravaToken): Promise<DbStravaToken> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
    });

    const data = await response.json();

    const updatedToken = {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      updated_at: new Date().toISOString(),
    };

    await this.supabase
      .from('strava_tokens')
      .update(updatedToken)
      .eq('id', token.id);

    return updatedToken;
  }

  async saveToken(userId: string, stravaCode: string): Promise<DbStravaToken> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
        code: stravaCode,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    const token: DbStravaToken = {
      id: crypto.randomUUID(),
      user_id: userId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.supabase.from('strava_tokens').insert(token);

    return token;
  }

  async fetchActivities(userId: string): Promise<void> {
    const token = await this.getToken(userId);
    if (!token) throw new Error('No Strava token found');

    const response = await fetch(`${STRAVA_API_BASE}/athlete/activities`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    const activities = await response.json();

    // Transform and store activities
    const dbActivities: Omit<DbStravaActivity, 'id'>[] = activities.map((activity: any) => ({
      user_id: userId,
      strava_id: activity.id,
      name: activity.name,
      type: activity.type,
      sport_type: activity.sport_type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      start_date: activity.start_date,
      summary_polyline: activity.map.summary_polyline,
      elev_low: activity.elev_low,
      elev_high: activity.elev_high,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Upsert activities (update if exists, insert if new)
    for (const activity of dbActivities) {
      await this.supabase
        .from('strava_activities')
        .upsert({
          id: `${userId}-${activity.strava_id}`,
          ...activity,
        }, {
          onConflict: 'id',
        });
    }
  }

  async handleWebhook(event: any): Promise<void> {
    const { object_type, object_id, aspect_type, owner_id, updates } = event;

    if (object_type !== 'activity') return;

    // Find user by Strava athlete ID (owner_id)
    const { data: token } = await this.supabase
      .from('strava_tokens')
      .select('user_id, access_token')
      .eq('strava_athlete_id', owner_id)
      .single();

    if (!token) return;

    if (aspect_type === 'create' || aspect_type === 'update') {
      // Fetch the activity details
      const response = await fetch(`${STRAVA_API_BASE}/activities/${object_id}`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      const activity = await response.json();

      // Update or insert the activity
      await this.supabase
        .from('strava_activities')
        .upsert({
          id: `${token.user_id}-${activity.id}`,
          user_id: token.user_id,
          strava_id: activity.id,
          name: activity.name,
          type: activity.type,
          sport_type: activity.sport_type,
          distance: activity.distance,
          moving_time: activity.moving_time,
          total_elevation_gain: activity.total_elevation_gain,
          average_speed: activity.average_speed,
          start_date: activity.start_date,
          summary_polyline: activity.map.summary_polyline,
          elev_low: activity.elev_low,
          elev_high: activity.elev_high,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });
    } else if (aspect_type === 'delete') {
      // Delete the activity
      await this.supabase
        .from('strava_activities')
        .delete()
        .eq('id', `${token.user_id}-${object_id}`);
    }
  }
} 