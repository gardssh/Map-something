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
    comments: string | null;
    created_at: string;
    updated_at: string;
    distance: number;
    source: 'draw' | 'gpx_upload';
};

export interface RouteWithDistance extends DbRoute {
    distance: number;
} 