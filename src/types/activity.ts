import type { LineString, Feature, GeoJsonProperties } from 'geojson';
import type { RoutePoints } from '@/components/activities/switchCor';
import type { DbStravaActivity } from './supabase';

export interface ActivityMap {
  summary_polyline: string;
  geometry?: RoutePoints | null;
}

export interface ActivityWithMap extends DbStravaActivity {
  map: ActivityMap;
  description?: string;
}

export interface Activity {
  id: string | number;
  name: string;
  type?: string;
  sport_type: string;
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  start_date?: string;
  start_latlng?: number[] | null;
  end_latlng?: number[] | null;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  elev_high?: number | null;
  elev_low?: number | null;
  summary_polyline?: string;
  selected?: boolean;
  visible?: boolean;
  coordinates?: number[] | null;
  bounds?: number[][] | null;
  elevation_data?: any;
  properties?: any;
  source_id?: string;
  layer_id?: string;
  is_hovered?: boolean;
  feature?: Feature<LineString, GeoJsonProperties> | null;
  geometry?: LineString | null;
  strava_id?: string | number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  map?: ActivityMap | null;
}

export interface HoverInfo {
  id: string | number;
  name: string;
  longitude: number;
  latitude: number;
  type: string;
  time: string;
}

export type ActivityCategory = 
  | 'Foot Sports'
  | 'Cycle Sports'
  | 'Water Sports'
  | 'Winter Sports'
  | 'Other Sports';
