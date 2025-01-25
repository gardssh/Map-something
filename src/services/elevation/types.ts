import type { Position } from 'geojson';
import type { Activity } from '@/types/activity';
import type { DbRoute } from '@/types/supabase';

export interface ElevationPoint {
    distance: number;  // in km
    elevation: number; // in meters
}

export interface ElevationStats {
    totalAscent: number;
    totalDescent: number;
    maxElevation: number;
    minElevation: number;
}

export interface RouteData {
    features: Array<{
        properties: {
            legs: Array<{
                distance: number;
                elevation_range: Array<[number, number]>;
            }>;
        };
    }>;
}

export type ElevationSource = Activity | DbRoute; 