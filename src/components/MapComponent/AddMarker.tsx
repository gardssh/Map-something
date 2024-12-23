'use client';

import { Marker } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import type { Activity } from '@/types/activity';

export default function AddMarker({ activity }: { activity: Activity }) {
	const { startPoint, endPoint } = switchCoordinates(activity);

	// Only show markers if we have both start and end points
	if (!startPoint || !endPoint) {
		return null;
	}

	const [startLng, startLat] = startPoint;
	const [endLng, endLat] = endPoint;

	return (
		<>
			{/* <Marker 
				longitude={startLng} 
				latitude={startLat} 
				scale={0.5} 
				color="#22c55e" 
				anchor="center"
			/> */}
			{/* <Marker 
				longitude={endLng} 
				latitude={endLat} 
				scale={0.5} 
				color="#ef4444" 
				anchor="center"
			/> */}
		</>
	);
}
