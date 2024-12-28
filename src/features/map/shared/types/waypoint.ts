import type { Point } from 'geojson';

export interface Waypoint {
  id: string;
  user_id: string;
  name: string;
  coordinates: number[];
  geometry: Point;
  comments: string | null;
  created_at: string;
  updated_at: string;
} 