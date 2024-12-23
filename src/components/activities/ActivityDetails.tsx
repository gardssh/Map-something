'use client';

import type { Activity } from '../../types/activity';
import { ElevationChart } from '../ElevationChart';
import { formatTime } from '../../lib/timeFormat';
import { useEffect, useState } from 'react';
import polyline from '@mapbox/polyline';
import { Position } from 'geojson';

interface ActivityDetailsProps {
	activity: Activity;
}

interface ElevationPoint {
	distance: number;
	elevation: number;
}

interface RouteData {
	features: Array<{
		properties: {
			legs: Array<{
				elevation_range: Array<[number, number]>;
				distance: number;
			}>;
		};
	}>;
}

export const ActivityDetails = ({ activity }: ActivityDetailsProps) => {
	const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);

	useEffect(() => {
		const fetchElevationData = async () => {
			if (!activity.map?.summary_polyline) return;

			try {
				// Get coordinates from the activity
				const decodedPath = polyline.decode(activity.map.summary_polyline);
				const coordinates: Position[] = decodedPath.map(([lat, lng]) => [lng, lat]);

				if (!coordinates || coordinates.length === 0) return;

				// Limit number of waypoints (Geoapify has a limit)
				const maxWaypoints = 10;
				const skipPoints = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
				const limitedCoordinates = coordinates.filter((_: Position, index: number) => index % skipPoints === 0);

				// Get elevation data from Geoapify
				const waypoints = limitedCoordinates.map((coord: Position) => `${coord[1]},${coord[0]}`).join('|');
				const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=9098bef0b0a04aaf8dfbd2ec98548de4`;

				console.log('Fetching elevation data...');
				const response = await fetch(url);

				if (!response.ok) {
					console.error('Geoapify API error:', response.status, await response.text());
					throw new Error(`Geoapify API error: ${response.status}`);
				}

				const routeData: RouteData = await response.json();
				console.log('Got elevation data:', routeData);

				// Process elevation data from the response
				const points: ElevationPoint[] = [];
				let cumulativeDistance = 0;

				if (!routeData.features?.[0]?.properties?.legs) {
					throw new Error('Invalid response format');
				}

				routeData.features[0].properties.legs.forEach((leg) => {
					leg.elevation_range.forEach(([distance, elevation]) => {
						points.push({
							distance: (cumulativeDistance + distance) / 1000,
							elevation: elevation,
						});
					});
					cumulativeDistance += leg.distance;
				});

				if (points.length > 0) {
					setElevationData(points);
				}
			} catch (error) {
				console.error('Error processing elevation data:', error);
			}
		};

		fetchElevationData();
	}, [activity]);

	return (
		<div className="p-4 space-y-4">
			<h2 className="text-xl font-semibold">{activity.name}</h2>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Type</p>
					<p>{activity.sport_type}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Distance</p>
					<p>{((activity.distance || 0) / 1000).toFixed(2)} km</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Duration</p>
					<p>{formatTime(activity.moving_time || 0)}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Elevation Gain</p>
					<p>{activity.total_elevation_gain || 0} m</p>
				</div>
				{activity.average_heartrate && (
					<div>
						<p className="text-sm text-muted-foreground">Avg Heart Rate</p>
						<p>{Math.round(activity.average_heartrate)} bpm</p>
					</div>
				)}
				{activity.max_heartrate && (
					<div>
						<p className="text-sm text-muted-foreground">Max Heart Rate</p>
						<p>{Math.round(activity.max_heartrate)} bpm</p>
					</div>
				)}
			</div>
			{elevationData.length > 0 && <ElevationChart data={elevationData} />}
		</div>
	);
};
