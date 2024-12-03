import polyline from '@mapbox/polyline';

interface Activity {
	map: {
		summary_polyline: string;
	};
}

type Coordinate = [number, number];

export function switchCoordinates(activity: Activity): Coordinate[] {
	if (!activity?.map?.summary_polyline) {
		return [];
	}

	const decodedCoordinates = polyline.decode(activity.map.summary_polyline);
	
	return decodedCoordinates.map(([lat, lng]: [number, number]) => [lng, lat]);
}
