import type { LineString } from 'geojson';
import type { DbRoute } from './supabase';

export interface DrawnRoute {
    id: string;
    name: string;
    user_id: string;
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
    created_at: string;
    updated_at: string;
    comments: string | null;
    distance: number;
    source: 'draw' | 'gpx_upload';
}

export interface RouteWithDistance extends DbRoute {
    distance: number;
} 