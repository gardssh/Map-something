import polyline from '@mapbox/polyline';

interface Activity {
	map: {
		summary_polyline: string;
	};
}

export interface RoutePoints {
	coordinates: [number, number][];
	startPoint: [number, number] | null;
	endPoint: [number, number] | null;
}

export function switchCoordinates(activity: Activity): RoutePoints {
	// Only process if we have a polyline
	if (!activity?.map?.summary_polyline) {
		return {
			coordinates: [],
			startPoint: null,
			endPoint: null
		};
	}

	try {
		const decodedCoordinates = polyline.decode(activity.map.summary_polyline);
		const coordinates = decodedCoordinates.map(([lat, lng]) => [lng, lat] as [number, number]);
		
		return {
			coordinates,
			startPoint: coordinates.length > 0 ? coordinates[0] : null,
			endPoint: coordinates.length > 0 ? coordinates[coordinates.length - 1] : null
		};
	} catch (error) {
		return {
			coordinates: [],
			startPoint: null,
			endPoint: null
		};
	}
}
