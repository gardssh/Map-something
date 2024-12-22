import { createClient } from './supabase';
import { DbStravaToken } from '@/types/supabase';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export class StravaService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async getToken(userId: string): Promise<DbStravaToken | null> {
    const { data } = await this.supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data;
  }

  async fetchActivities(userId: string): Promise<void> {
    const response = await fetch('/api/strava/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to import activities');
    }

    return response.json();
  }

  async handleWebhook(event: any): Promise<void> {
    const { object_type, object_id, aspect_type, owner_id } = event;

    if (object_type !== 'activity') return;

    // Find user by Strava athlete ID (owner_id)
    const { data: token } = await this.supabase
      .from('strava_tokens')
      .select('user_id')
      .eq('strava_athlete_id', owner_id)
      .single();

    if (!token) return;

    // Trigger a full import to ensure consistency
    if (aspect_type === 'create' || aspect_type === 'update') {
      await this.fetchActivities(token.user_id);
    }
  }
} 