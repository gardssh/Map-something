import type { LineString } from 'geojson';
import { Database as DatabaseGenerated } from './supabase-generated';

export type Database = DatabaseGenerated;

export type DbWaypoint = Database['public']['Tables']['waypoints']['Row'];
export type DbRoute = Database['public']['Tables']['routes']['Row'];
export type DbStravaToken = Database['public']['Tables']['strava_tokens']['Row'];
export type DbStravaActivity = Database['public']['Tables']['strava_activities']['Row'];
export type DbProfile = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  updated_at: string;
  created_at: string;
};

// Extend the generated Database type to include profiles
declare module './supabase-generated' {
  interface Database {
    public: {
      Tables: {
        profiles: {
          Row: DbProfile;
          Insert: Omit<DbProfile, 'created_at'>;
          Update: Partial<Omit<DbProfile, 'id'>>;
        };
      } & DatabaseGenerated['public']['Tables'];
    };
  }
}

export type Route = {
  id: string;
  user_id: string;
  route_data: any; // This will store your route JSON data
  created_at: string;
  updated_at: string;
}

export type Waypoint = {
  id: string;
  user_id: string;
  waypoint_data: any; // This will store your waypoint JSON data
  created_at: string;
  updated_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
 