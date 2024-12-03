import { switchCoordinates } from '../activities/switchCor';
import { Marker } from 'react-map-gl';
import { useMemo } from 'react';

interface Activity {
	map: {
		summary_polyline: string;
	};
}

export default function AddMarker({ activity }: { activity: Activity }) {
	const coordinates = useMemo(() => switchCoordinates(activity), [activity]);
	
	if (coordinates.length === 0) {
		return null;
	}

	const [longStart, latStart] = coordinates[0];
	const [longEnd, latEnd] = coordinates[coordinates.length - 1];

	return (
		<>
			<Marker 
				longitude={longStart} 
				latitude={latStart}
				color="#4ade80"
			/>

			<Marker 
				longitude={longEnd} 
				latitude={latEnd}
				color="#fb923c"
			/>
		</>
	);
}
