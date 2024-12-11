import polyline from '@mapbox/polyline';

interface Activity {
	map: {
		summary_polyline: string;
	};
}

export function switchCoordinates(activity: Activity): [number, number][] {
	// Only process if we have a polyline
	if (!activity?.map?.summary_polyline) {
		return [];
	}

	try {
		const coordinates = polyline.decode(activity.map.summary_polyline);
		return coordinates.map(([lat, lng]) => [lng, lat]);
	} catch (error) {
		return [];
	}
}
