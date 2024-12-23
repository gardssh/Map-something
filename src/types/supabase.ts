import type { LineString } from 'geojson';

export type DbProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  updated_at: string;
  created_at: string;
};

export type DbProfile = {
  Row: DbProfileRow;
  Insert: Omit<DbProfileRow, 'created_at'>;
  Update: Partial<Omit<DbProfileRow, 'id'>>;
};

export interface Database {
  public: {
    Tables: {
      waypoints: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          coordinates: number[];
          geometry: {
            type: 'Point';
            coordinates: number[];
          };
          comments: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          coordinates: number[];
          geometry: {
            type: 'Point';
            coordinates: number[];
          };
          comments?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          coordinates?: number[];
          geometry?: {
            type: 'Point';
            coordinates: number[];
          };
          comments?: string | null;
          updated_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          geometry: LineString;
          comments: string | null;
          updated_at: string;
          distance: number;
          source: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          geometry: LineString;
          comments?: string | null;
          updated_at?: string;
          distance?: number;
          source?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          geometry?: LineString;
          comments?: string | null;
          updated_at?: string;
          distance?: number;
          source?: string;
        };
      };
      profiles: {
        Row: DbProfileRow;
        Insert: Omit<DbProfileRow, 'created_at'>;
        Update: Partial<Omit<DbProfileRow, 'id'>>;
      };
      strava_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          created_at: string;
          updated_at: string;
          strava_athlete_id?: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          created_at?: string;
          updated_at?: string;
          strava_athlete_id?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
          updated_at?: string;
          strava_athlete_id?: number;
        };
      };
      strava_activities: {
        Row: {
          id: string;
          user_id: string;
          strava_id: number;
          name: string;
          type: string;
          sport_type: string;
          distance: number;
          moving_time: number;
          total_elevation_gain: number;
          average_speed: number;
          max_speed: number;
          start_date: string;
          start_latlng: number[];
          end_latlng: number[];
          average_heartrate: number | null;
          max_heartrate: number | null;
          summary_polyline: string;
          geometry: LineString | null;
          bounds: number[][];
          elev_low: number | null;
          elev_high: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strava_id: number;
          name: string;
          type: string;
          sport_type: string;
          distance: number;
          moving_time: number;
          total_elevation_gain: number;
          average_speed: number;
          max_speed: number;
          start_date: string;
          start_latlng: number[];
          end_latlng: number[];
          average_heartrate?: number | null;
          max_heartrate?: number | null;
          summary_polyline: string;
          geometry?: LineString | null;
          bounds: number[][];
          elev_low?: number | null;
          elev_high?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strava_id?: number;
          name?: string;
          type?: string;
          sport_type?: string;
          distance?: number;
          moving_time?: number;
          total_elevation_gain?: number;
          average_speed?: number;
          max_speed?: number;
          start_date?: string;
          start_latlng?: number[];
          end_latlng?: number[];
          average_heartrate?: number | null;
          max_heartrate?: number | null;
          summary_polyline?: string;
          geometry?: LineString | null;
          bounds?: number[][];
          elev_low?: number | null;
          elev_high?: number | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type DbWaypoint = Database['public']['Tables']['waypoints']['Row'];
export type DbRoute = Database['public']['Tables']['routes']['Row'];
export type DbStravaToken = Database['public']['Tables']['strava_tokens']['Row'];
export type DbStravaActivity = Database['public']['Tables']['strava_activities']['Row'];

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
 