import { decode } from '@mapbox/polyline';
import type { Activity } from '@/types/activity';
import type { DbRoute } from '@/types/supabase';
import type { ElevationPoint, ElevationStats } from './types';
import { getElevationsFromTile, fixElevationErrors, calculateElevationStats } from './mapbox';

export type ElevationSource = Activity | DbRoute;

function getSourceCoordinates(source: ElevationSource): [number, number][] {
    if ('summary_polyline' in source && source.summary_polyline) {
        return decode(source.summary_polyline).map(([lat, lng]) => [lng, lat] as [number, number]);
    }
    if (source.geometry?.coordinates) {
        return source.geometry.coordinates as [number, number][];
    }
    return [];
}

export async function getElevationData(source: ElevationSource) {
    const coordinates = getSourceCoordinates(source);
    if (coordinates.length === 0) {
        return {
            points: [],
            stats: {
                totalAscent: 0,
                totalDescent: 0,
                maxElevation: 0,
                minElevation: 0
            }
        };
    }

    const elevations = await getElevationsFromTile(coordinates, 15);
    const fixedElevations = fixElevationErrors(elevations);
    const stats = calculateElevationStats(fixedElevations);

    // Create elevation points with distance
    const points: ElevationPoint[] = fixedElevations.map((elevation, i) => ({
        distance: i / (fixedElevations.length - 1), // Normalized distance from 0 to 1
        elevation,
    }));

    return { points, stats };
} 