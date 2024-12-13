import type { LineString } from 'geojson';
import type { DbRoute } from './supabase';

export type DrawnRoute = {
    id: string;
    name: string;
    user_id: string;
    geometry: LineString;
    created_at: string;
    distance: number;
};

export type RouteWithDistance = DbRoute & {
  distance: number;
} 