import type { LineString } from 'geojson';
import type { DbRoute } from './supabase';

export interface DrawnRoute extends DbRoute {
  distance?: number;
}

export type RouteWithDistance = DbRoute & {
  distance: number;
} 