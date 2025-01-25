import type { Activity } from '@/types/activity';
import type { Position } from 'geojson';
import * as polyline from '@mapbox/polyline';

interface RoutePoints {
    coordinates: Position[];
}

export function switchCoordinates(activity: Activity): RoutePoints {
    if (!activity.map?.summary_polyline) {
        return { coordinates: [] };
    }

    const decodedPath = polyline.decode(activity.map.summary_polyline);
    const coordinates = decodedPath.map(([lat, lng]): Position => [lng, lat]);

    return { coordinates };
} 