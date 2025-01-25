'use client';

import { useEffect, useState } from 'react';
import type { DbRoute } from '@/types/supabase';
import { Edit2, Trash2, X, Check, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardHeader, CardContent } from '../ui/card';
import * as turf from '@turf/turf';
import ElevationProfile from '@/components/elevation/ElevationProfile';
import { encode } from '@mapbox/polyline';

interface RouteDetailsProps {
	route: DbRoute;
	onDelete?: (routeId: string) => void;
	onEdit?: (routeId: string, newName: string, newComment: string) => void;
	onClose?: () => void;
}

interface ElevationPoint {
	distance: number;
	elevation: number;
}

export function RouteDetails({ route, onDelete, onEdit, onClose }: RouteDetailsProps) {
	const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(route.name);
	const [editComment, setEditComment] = useState(route.comments || '');
	const [stats, setStats] = useState({
		totalAscent: 0,
		totalDescent: 0,
		maxElevation: 0,
		minElevation: 0,
	});
	const [distance, setDistance] = useState(0);
	const [isLoadingElevation, setIsLoadingElevation] = useState(false);

	// Calculate distance using turf.js if not available in the database
	useEffect(() => {
		if (!route.geometry?.coordinates) return;
		setIsLoadingElevation(true);
		const coordinates = route.geometry.coordinates;
		const line = turf.lineString(coordinates);
		const length = turf.length(line, { units: 'kilometers' });
		setDistance(length);
		const polyline = encode(coordinates.map(([lng, lat]) => [lat, lng]));
		setIsLoadingElevation(false);
	}, [route]);

	useEffect(() => {
		setEditName(route.name);
		setEditComment(route.comments || '');
	}, [route]);

	useEffect(() => {
		const fetchElevationData = async () => {
			if (!route.geometry?.coordinates) return;

			const coordinates = route.geometry.coordinates;
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
				let totalAscent = 0;
				let totalDescent = 0;
				let maxElevation = -Infinity;
				let minElevation = Infinity;
				let lastElevation: number | null = null;

				if (!data.features?.[0]?.properties?.legs) throw new Error('Invalid response format');

				// Calculate total API distance to normalize our points
				let totalApiDistance = 0;
				data.features[0].properties.legs.forEach((leg: any) => {
					totalApiDistance += leg.distance;
				});

				let cumulativeApiDistance = 0;
				data.features[0].properties.legs.forEach((leg: any) => {
					leg.elevation_range.forEach(([legDistance, elevation]: [number, number]) => {
						const apiDistance = cumulativeApiDistance + legDistance;
						// Convert API distance to a percentage of total, then apply to our actual distance
						const distanceRatio = apiDistance / totalApiDistance;
						const actualDistance = distance * distanceRatio;

						points.push({
							distance: actualDistance,
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
					cumulativeApiDistance += leg.distance;
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
			}
		};

		fetchElevationData();
	}, [route.geometry?.coordinates, distance]);

	const handleSave = () => {
		if (!onEdit) return;
		if (editName.trim() === '') return;
		onEdit(route.id as string, editName, editComment);
		route.name = editName;
		route.comments = editComment;
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditName(route.name);
		setEditComment(route.comments || '');
		setIsEditing(false);
	};

	const handleDownloadGPX = () => {
		if (!route.geometry) return;

		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Villspor">
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
	};

	return (
		<div className="grow flex flex-col h-full">
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 pb-16 flex flex-col gap-4">
					<div className="flex justify-between items-start bg-muted/50 p-4 rounded-lg">
						<div>
							<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{route.name}</h3>
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
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											if (onClose) onClose();
										}}
									>
										<X className="h-4 w-4" />
									</Button>
								</>
							)}
						</div>
					</div>

					{isEditing ? (
						<Card>
							<CardContent className="p-4 space-y-2">
								<Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Route name" />
								<Textarea
									value={editComment}
									onChange={(e) => setEditComment(e.target.value)}
									placeholder="Add a comment..."
									className="min-h-[100px]"
								/>
							</CardContent>
						</Card>
					) : (
						<>
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<p>Distance</p>
										<p className="text-lg font-medium">{distance.toFixed(2)} km</p>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<p>Elevation Gain</p>
										<p className="text-lg font-medium">{stats.totalAscent} m</p>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<p>Max Elevation</p>
										<p className="text-lg font-medium">{stats.maxElevation} m</p>
									</CardHeader>
								</Card>

								<Card>
									<CardHeader>
										<p>Min Elevation</p>
										<p className="text-lg font-medium">{stats.minElevation} m</p>
									</CardHeader>
								</Card>
							</div>

							{route.comments && (
								<Card>
									<CardHeader>
										<p>Comments</p>
										<p className="text-lg font-medium">{route.comments}</p>
									</CardHeader>
								</Card>
							)}

							{route.geometry?.coordinates && (
								<ElevationProfile
									polyline={encode(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]))}
									height={200}
									isLoading={isLoadingElevation}
								/>
							)}
						</>
					)}
				</div>
			</div>

			<div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t">
				<Button variant="secondary" className="w-full flex gap-2" onClick={handleDownloadGPX}>
					<Download className="h-4 w-4" />
					Download GPX
				</Button>
			</div>
		</div>
	);
}
