'use client';

import type { Activity } from '@/features/map/shared/types/activity';
import { ElevationChart } from '@/features/map/shared/components/charts/ElevationChart';
import { formatTime } from '@/features/map/shared/utils/timeFormat';
import { useEffect, useState } from 'react';
import polyline from '@mapbox/polyline';
import { Position } from 'geojson';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/shared/components/ui/card';

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
				const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;

				const response = await fetch(url);

				if (!response.ok) {
					console.error('Geoapify API error:', response.status, await response.text());
					// Fall back to simple distance-based elevation for activities
					const distance = activity.distance || 0;
					const points = Array.from({ length: Math.ceil(distance / 100) }, (_, i) => {
						const dist = (i * 100) / 1000; // Every 100 meters
						const baseElevation = activity.elev_low ?? 0;
						const elevGain = activity.total_elevation_gain ?? 0;
						return {
							distance: dist,
							elevation: baseElevation + (elevGain * dist) / (distance / 1000),
						};
					});
					setElevationData(points);
					return;
				}

				const routeData: RouteData = await response.json();

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
				// Fall back to simple distance-based elevation for activities
				const distance = activity.distance || 0;
				const points = Array.from({ length: Math.ceil(distance / 100) }, (_, i) => {
					const dist = (i * 100) / 1000; // Every 100 meters
					const baseElevation = activity.elev_low ?? 0;
					const elevGain = activity.total_elevation_gain ?? 0;
					return {
						distance: dist,
						elevation: baseElevation + (elevGain * dist) / (distance / 1000),
					};
				});
				setElevationData(points);
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
				{(activity.average_heartrate || activity.max_heartrate) && (
					<>
						<div>
							<p className="text-sm text-muted-foreground">Avg Heart Rate</p>
							<p>{activity.average_heartrate || 0} bpm</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Max Heart Rate</p>
							<p>{activity.max_heartrate || 0} bpm</p>
						</div>
					</>
				)}
			</div>
			{elevationData.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Elevation Profile</CardTitle>
					</CardHeader>
					<CardContent className="pl-0">
						<div className="h-[220px]">
							<ElevationChart data={elevationData} />
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};
