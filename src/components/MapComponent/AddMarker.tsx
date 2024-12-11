'use client';

import { Marker } from 'react-map-gl';

interface Activity {
	id: number;
	start_latlng?: [number, number];
	end_latlng?: [number, number];
	name?: string;
}

export default function AddMarker({ activity }: { activity: Activity }) {
	// Only show markers if we have both start and end coordinates
	if (!activity?.start_latlng?.length || !activity?.end_latlng?.length) {
		return null;
	}

	const [startLat, startLng] = activity.start_latlng;
	const [endLat, endLng] = activity.end_latlng;

	return (
		<>
			<Marker 
				longitude={startLng} 
				latitude={startLat} 
				scale={0.5} 
				color="#22c55e" 
				anchor="center"
			/>
			<Marker 
				longitude={endLng} 
				latitude={endLat} 
				scale={0.5} 
				color="#ef4444" 
				anchor="center"
			/>
		</>
	);
}
