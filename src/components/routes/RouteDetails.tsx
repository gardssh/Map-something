'use client';

import { useEffect, useState } from 'react';
import type { DbRoute } from '@/types/supabase';
import { ElevationChart } from '../ElevationChart';
import * as turf from '@turf/turf';
import { Edit2, Trash2, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface RouteDetailsProps {
	route: DbRoute;
	onDelete?: (routeId: string) => void;
	onEdit?: (routeId: string, newName: string, newComment: string) => void;
}

interface ElevationPoint {
	distance: number;
	elevation: number;
}

export const RouteDetails = ({ route, onDelete, onEdit }: RouteDetailsProps) => {
	const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(route.name);
	const [editComment, setEditComment] = useState(route.comments || '');

	const handleSave = () => {
		if (!onEdit) return;
		if (editName.trim() === '') return;
		onEdit(route.id as string, editName, editComment);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditName(route.name);
		setEditComment(route.comments || '');
		setIsEditing(false);
	};

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
		<div className="p-4 space-y-4">
			<div className="flex justify-between items-start">
				<div className="flex-1 mr-4">
					{isEditing ? (
						<div className="space-y-2">
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								placeholder="Route name"
								className="font-semibold text-lg"
							/>
							<Textarea
								value={editComment}
								onChange={(e) => setEditComment(e.target.value)}
								placeholder="Add a comment..."
								className="min-h-[100px]"
							/>
						</div>
					) : (
						<>
							<h2 className="text-xl font-semibold">{route.name}</h2>
							<p className="text-sm text-muted-foreground">Distance: {route.distance?.toFixed(1)} km</p>
							{route.comments && <p className="text-sm text-muted-foreground mt-2">{route.comments}</p>}
						</>
					)}
				</div>
				<div className="flex gap-2">
					{isEditing ? (
						<>
							<Button variant="ghost" size="icon" onClick={handleSave}>
								<Check className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="icon" onClick={handleCancel}>
								<X className="h-4 w-4" />
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									if (!onDelete) return;
									if (window.confirm('Are you sure you want to delete this route?')) {
										onDelete(route.id as string);
									}
								}}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
