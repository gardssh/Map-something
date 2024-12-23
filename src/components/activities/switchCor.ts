'use client';

import type { Activity } from '../../types/activity';
import polyline from '@mapbox/polyline';

export interface RoutePoints {
	coordinates: [number, number][];
	startPoint?: [number, number];
	endPoint?: [number, number];
}

export const hasValidPolyline = (activity: Activity): boolean => {
	if (!activity.map?.summary_polyline) {
		return false;
	}

	try {
		const coords = polyline.decode(activity.map.summary_polyline);
		return Array.isArray(coords) && coords.length > 0;
	} catch (error) {
		return false;
	}
};

export const switchCoordinates = (activity: Activity): RoutePoints => {
	if (!activity.map?.summary_polyline) {
		return { coordinates: [] };
	}

	try {
		const decodedCoordinates = polyline.decode(activity.map.summary_polyline);
		// Swap lat/lng to lng/lat for Mapbox and ensure correct typing
		const coordinates = decodedCoordinates.map(([lat, lng]): [number, number] => [lng, lat]);
		
		return {
			coordinates,
			startPoint: coordinates[0],
			endPoint: coordinates[coordinates.length - 1]
		};
	} catch (error) {
		return { coordinates: [] };
	}
};
