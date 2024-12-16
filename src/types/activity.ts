import type { LineString } from 'geojson';

export interface ActivityMap {
  summary_polyline: string;
}

export interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elev_high?: number;
  elev_low?: number;
  map: ActivityMap;
}

export interface HoverInfo {
  id: string | number;
  name: string;
  longitude: number;
  latitude: number;
}

export type ActivityCategory = 
  | 'Foot Sports'
  | 'Cycle Sports'
  | 'Water Sports'
  | 'Winter Sports'
  | 'Other Sports';
