import type { LineString } from 'geojson';

export interface DrawnRoute {
  id: string;
  name: string;
  user_id: string;
  geometry: LineString;
  comments: string | null;
  created_at: string;
  updated_at: string;
  distance: number;
  source: 'draw' | 'gpx_upload';
} 