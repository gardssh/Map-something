import type { LineString } from 'geojson';

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

export interface Database {
  public: {
    Tables: {
      waypoints: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          coordinates: number[]
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          coordinates: number[]
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          coordinates?: number[]
        }
      }
      routes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          geometry: LineString
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          geometry: LineString
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          geometry?: LineString
        }
      }
      strava_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: number
          updated_at?: string
        }
      }
      strava_activities: {
        Row: {
          id: string
          user_id: string
          strava_id: number
          name: string
          type: string
          sport_type: string
          distance: number
          moving_time: number
          total_elevation_gain: number
          average_speed: number
          max_speed: number
          start_date: string
          start_latlng: number[]
          end_latlng: number[]
          average_heartrate: number | null
          max_heartrate: number | null
          summary_polyline: string
          geometry: LineString | null
          bounds: number[][]
          elev_low: number | null
          elev_high: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strava_id: number
          name: string
          type: string
          sport_type: string
          distance: number
          moving_time: number
          total_elevation_gain: number
          average_speed: number
          max_speed: number
          start_date: string
          start_latlng: number[]
          end_latlng: number[]
          average_heartrate?: number | null
          max_heartrate?: number | null
          summary_polyline: string
          geometry?: LineString | null
          bounds: number[][]
          elev_low?: number | null
          elev_high?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strava_id?: number
          name?: string
          type?: string
          sport_type?: string
          distance?: number
          moving_time?: number
          total_elevation_gain?: number
          average_speed?: number
          max_speed?: number
          start_date?: string
          start_latlng?: number[]
          end_latlng?: number[]
          average_heartrate?: number | null
          max_heartrate?: number | null
          summary_polyline?: string
          geometry?: LineString | null
          bounds?: number[][]
          elev_low?: number | null
          elev_high?: number | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type DbRoute = Database['public']['Tables']['routes']['Row']
export type DbWaypoint = Database['public']['Tables']['waypoints']['Row']
export type DbStravaToken = Database['public']['Tables']['strava_tokens']['Row']
export type DbStravaActivity = Database['public']['Tables']['strava_activities']['Row'] 