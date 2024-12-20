import type { LineString } from 'geojson';
import type { DbRoute } from './supabase';

export type DrawnRoute = {
    id: string;
    name: string;
    user_id: string;
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
    created_at: string;
    distance: number;
    source?: 'draw' | 'gpx_upload';
};

export type RouteWithDistance = DbRoute & {
  distance: number;
} 