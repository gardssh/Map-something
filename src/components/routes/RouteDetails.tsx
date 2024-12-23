'use client';

import { useEffect, useState } from 'react';
import type { DbRoute } from '@/types/supabase';
import { ElevationChart } from '../ElevationChart';
import * as turf from '@turf/turf';

interface RouteDetailsProps {
	route: DbRoute;
}

interface ElevationPoint {
	distance: number;
	elevation: number;
}

export const RouteDetails = ({ route }: RouteDetailsProps) => {
	const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);

	useEffect(() => {
		const fetchElevationData = async () => {
			if (!route.geometry?.coordinates) {
				console.log('No coordinates found in route geometry');
				return;
			}

			const coordinates = route.geometry.coordinates;
			console.log('Route coordinates:', coordinates);

			const maxWaypoints = 25;
			const skipPoints = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
			const limitedCoordinates = coordinates.filter((_, index) => index % skipPoints === 0);
			console.log('Limited coordinates:', limitedCoordinates);

			try {
				const waypoints = limitedCoordinates.map((coord) => `${coord[1]},${coord[0]}`).join('|');
				const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=9098bef0b0a04aaf8dfbd2ec98548de4`;

				console.log('Fetching elevation data from:', url);
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`Geoapify API error: ${response.status}`);
				}

				const data = await response.json();
				console.log('Raw API response:', data);

				const points: ElevationPoint[] = [];
				let cumulativeDistance = 0;

				if (!data.features?.[0]?.properties?.legs) {
					throw new Error('Invalid response format');
				}

				data.features[0].properties.legs.forEach((leg: any) => {
					leg.elevation_range.forEach(([distance, elevation]: [number, number]) => {
						points.push({
							distance: (cumulativeDistance + distance) / 1000,
							elevation: elevation,
						});
					});
					cumulativeDistance += leg.distance;
				});

				console.log('Processed elevation data:', points);
				setElevationData(points);
			} catch (error) {
				console.error('Error fetching elevation data:', error);
				// Fallback to simple distance-based elevation
				const points = coordinates.map((_, i) => ({
					distance: turf.length(turf.lineString(coordinates.slice(0, i + 1)), { units: 'kilometers' }),
					elevation: 0,
				}));
				console.log('Using fallback elevation data:', points);
				setElevationData(points);
			}
		};

		fetchElevationData();
	}, [route.geometry?.coordinates]);

	return (
		<div className="p-6 space-y-6">
			<h2 className="text-2xl font-semibold">{route.name}</h2>
			<div className="grid grid-cols-2 gap-6">
				<div className="bg-muted rounded-lg p-4">
					<p className="text-sm text-muted-foreground mb-1">Distance</p>
					<p className="text-lg font-medium">{(route.distance / 1000).toFixed(2)} km</p>
				</div>
				<div className="bg-muted rounded-lg p-4">
					<p className="text-sm text-muted-foreground mb-1">Created</p>
					<p className="text-lg font-medium">{new Date(route.created_at).toLocaleDateString()}</p>
				</div>
				{route.comments && (
					<div className="col-span-2 bg-muted rounded-lg p-4">
						<p className="text-sm text-muted-foreground mb-1">Comments</p>
						<p className="text-lg font-medium">{route.comments}</p>
					</div>
				)}
			</div>
			{elevationData.length > 0 && <ElevationChart data={elevationData} />}
			<button
				onClick={() => {
					if (!route.geometry) return;
					const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Map Something">
    <trk>
        <name>${route.name}</name>
        <trkseg>
            ${(route.geometry.coordinates as [number, number][])
							.map(([lon, lat]) => `            <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
							.join('\n')}
        </trkseg>
    </trk>
</gpx>`;
					const blob = new Blob([gpx], { type: 'application/gpx+xml' });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `${route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				}}
				className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-3 px-4 rounded-lg transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download GPX
			</button>
		</div>
	);
};
