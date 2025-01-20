'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ElevationChart } from '@/components/activities/ElevationChart';
import type { DbRoute } from '@/types/supabase';
import type { Activity } from '@/types/activity';
import type { Position } from 'geojson';
import { switchCoordinates } from './switchCor';

interface ElevationPoint {
	distance: number;
	elevation: number;
}

interface ElevationStats {
	totalAscent: number;
	totalDescent: number;
	maxElevation: number;
	minElevation: number;
}

interface ElevationDetailsProps {
	source: Activity | DbRoute;
}

export function ElevationDetails({ source }: ElevationDetailsProps) {
	const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
	const [stats, setStats] = useState<ElevationStats>({
		totalAscent: 0,
		totalDescent: 0,
		maxElevation: 0,
		minElevation: 0,
	});

	const getElevationData = useCallback(async (source: Activity | DbRoute) => {
		let coordinates: Position[] = [];

		// Get coordinates based on source type
		if ('sport_type' in source) {
			// Handle activity
			if (!source.map?.summary_polyline) return [];
			const routePoints = switchCoordinates(source);
			coordinates = routePoints.coordinates;
		} else if ('geometry' in source && source.geometry) {
			// Handle route
			coordinates = source.geometry.coordinates;
		}

		if (!coordinates || coordinates.length === 0) return [];

		// Limit number of waypoints (Geoapify has a limit)
		const maxWaypoints = 25;
		const skipPoints = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
		const limitedCoordinates = coordinates.filter((_, index) => index % skipPoints === 0);

		try {
			const waypoints = limitedCoordinates.map((coord) => `${coord[1]},${coord[0]}`).join('|');
			const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;

			const response = await fetch(url);
			if (!response.ok) throw new Error(`Geoapify API error: ${response.status}`);

			const data = await response.json();
			const points: ElevationPoint[] = [];
			let cumulativeDistance = 0;
			let totalAscent = 0;
			let totalDescent = 0;
			let maxElevation = -Infinity;
			let minElevation = Infinity;
			let lastElevation: number | null = null;

			if (!data.features?.[0]?.properties?.legs) {
				throw new Error('Invalid response format');
			}

			data.features[0].properties.legs.forEach((leg: any) => {
				leg.elevation_range.forEach(([distance, elevation]: [number, number]) => {
					points.push({
						distance: (cumulativeDistance + distance) / 1000,
						elevation: elevation,
					});

					if (lastElevation !== null) {
						const diff = elevation - lastElevation;
						if (diff > 0) totalAscent += diff;
						if (diff < 0) totalDescent += Math.abs(diff);
					}

					maxElevation = Math.max(maxElevation, elevation);
					minElevation = Math.min(minElevation, elevation);
					lastElevation = elevation;
				});
				cumulativeDistance += leg.distance;
			});

			setElevationData(points);
			setStats({
				totalAscent: Math.round(totalAscent),
				totalDescent: Math.round(totalDescent),
				maxElevation: Math.round(maxElevation),
				minElevation: Math.round(minElevation),
			});
		} catch (error) {
			console.error('Error fetching elevation data:', error);
			setElevationData([]);
			// Fall back to activity elevation data for activities
			if ('sport_type' in source) {
				const activity = source;
				if (!activity.distance) return;
				const distance = activity.distance; // Store in a const to satisfy TypeScript
				const points = Array.from({ length: Math.ceil(distance / 100) }, (_, i) => {
					const dist = (i * 100) / 1000; // Every 100 meters
					const baseElevation = activity.elev_low ?? 0;
					const elevGain = activity.total_elevation_gain ?? 0;
					return {
						distance: dist,
						elevation: baseElevation + elevGain * (dist / (distance / 1000)),
					};
				});
				setElevationData(points);
			}
		}
	}, []);

	useEffect(() => {
		getElevationData(source);
	}, [source, getElevationData]);

	if (elevationData.length === 0) return null;

	return (
		<>
			<Card>
				<CardContent className="p-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Elevation Gain</p>
							<p>{stats.totalAscent} m</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Max Elevation</p>
							<p>{stats.maxElevation} m</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Min Elevation</p>
							<p>{stats.minElevation} m</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="h-[160px]">
				<ElevationChart data={elevationData} />
			</div>
		</>
	);
}
