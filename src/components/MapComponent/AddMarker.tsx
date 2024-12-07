import { switchCoordinates } from '../activities/switchCor';
import { Marker } from 'react-map-gl';
import { useMemo } from 'react';

interface Activity {
	map: {
		summary_polyline: string;
	};
	id: number;
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
			<Marker longitude={longStart} latitude={latStart} scale={0.5} color="#22c55e" anchor="center" />

			<Marker longitude={longEnd} latitude={latEnd} scale={0.5} color="#ef4444" anchor="center" />
		</>
	);
}
