import type { LineString } from 'geojson';

export interface ActivityMap {
  summary_polyline: string;
}

export interface Activity {
  id: number;
  name: string;
  sport_type: string;
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
