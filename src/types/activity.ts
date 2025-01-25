import type { Feature, LineString, GeoJsonProperties } from 'geojson';
import type { RoutePoints } from '@/components/activities/switchCor';
import type { DbStravaActivity } from './supabase';

export interface ActivityMap {
  id: string;
  summary_polyline: string;
  resource_state: number;
}

export interface Activity {
  id: number | string;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_speed: number;
  map?: ActivityMap;
  summary_polyline?: string;
  strava_id?: string | number;
  description?: string;
  elev_low?: number;
  elev_high?: number;
  selected: boolean;
  visible: boolean;
  elevation_data?: Array<{ distance: number; elevation: number }>;
  properties: GeoJsonProperties;
  source_id: string;
  layer_id: string;
  is_hovered: boolean;
  feature?: Feature<LineString>;
  geometry?: LineString;
  average_heartrate?: number;
  max_heartrate?: number;
  max_speed?: number;
  start_latlng?: number[];
  end_latlng?: number[];
  coordinates?: number[];
  bounds?: number[][];
}

export interface ActivityWithMap extends Activity {
  map: ActivityMap;
  selected: boolean;
  visible: boolean;
  properties: GeoJsonProperties;
  source_id: string;
  layer_id: string;
  is_hovered: boolean;
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
