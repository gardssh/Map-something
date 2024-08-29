//@ts-ignore
import polyline from '@mapbox/polyline';

// Changes coordinate position to fit mapbox'.

export function switchCoordinates(activity: any) {
	var coordinates = polyline.decode(activity.map.summary_polyline);

	for (let i = 0; i < coordinates.length; i++) {
		coordinates[i] = [coordinates[i][1], coordinates[i][0]];
	}

	return coordinates;
}
