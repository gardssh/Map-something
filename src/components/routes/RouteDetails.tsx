'use client';

import { useEffect, useState } from 'react';
import type { DbRoute } from '@/types/supabase';
import { ElevationChart } from '../ElevationChart';
import { Edit2, Trash2, X, Check, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
	const [stats, setStats] = useState({
		totalAscent: 0,
		totalDescent: 0,
		maxElevation: 0,
		minElevation: 0,
	});

	// Update local state when route prop changes
	useEffect(() => {
		setEditName(route.name);
		setEditComment(route.comments || '');
	}, [route]);

	useEffect(() => {
		const fetchElevationData = async () => {
			if (!route.geometry?.coordinates) {
				console.log('No coordinates found in route geometry');
				return;
			}

			const coordinates = route.geometry.coordinates;
			const maxWaypoints = 25;
			const skipPoints = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
			const limitedCoordinates = coordinates.filter((_, index) => index % skipPoints === 0);

			try {
				const waypoints = limitedCoordinates.map((coord) => `${coord[1]},${coord[0]}`).join('|');
				const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;

				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`Geoapify API error: ${response.status}`);
				}

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
			}
		};

		fetchElevationData();
	}, [route.geometry?.coordinates]);

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

		// Create GPX content
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

		// Create and trigger download
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
		<div className="p-4 space-y-4 relative">
			<div className="space-y-4">
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

				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Distance</p>
						<p>{route.distance?.toFixed(2)} km</p>
					</div>
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

				<div className="h-[160px]">
					<ElevationChart data={elevationData} />
				</div>
			</div>

			<div className="absolute -bottom-40 left-4 right-4">
				<Button variant="secondary" className="w-full flex gap-2" onClick={handleDownloadGPX}>
					<Download className="h-4 w-4" />
					Download GPX
				</Button>
			</div>
		</div>
	);
};
