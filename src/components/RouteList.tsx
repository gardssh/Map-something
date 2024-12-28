'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { GpxUpload } from './MapComponent/controls/GpxUpload';
import type { DbRoute } from '@/types/supabase';
import type { DrawnRoute } from '@/types/route';
import { LineString } from 'geojson';

interface RouteListProps {
	routes: DbRoute[];
	userId: string;
	onRouteSave?: (route: DrawnRoute) => void;
	onRouteSelect?: (route: DbRoute | null) => void;
	setSelectedRouteId: (id: string | number | null) => void;
}

const calculateRouteDistance = (coordinates: [number, number][]) => {
	return coordinates.reduce((total, coord, i) => {
		if (i === 0) return 0;
		const prev = coordinates[i - 1];
		const R = 6371; // Earth's radius in km
		const dLat = ((coord[1] - prev[1]) * Math.PI) / 180;
		const dLon = ((coord[0] - prev[0]) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((prev[1] * Math.PI) / 180) *
				Math.cos((coord[1] * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return total + R * c;
	}, 0);
};

export function RouteList({ routes, userId, onRouteSave, onRouteSelect, setSelectedRouteId }: RouteListProps) {
	return (
		<div className="grow gap-2 overflow-y-auto">
			<div className="flex flex-col gap-4 mb-4">
				<div className="flex items-center justify-between">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Routes</h3>
				</div>
				<div className="relative">
					<Button
						variant="outline"
						className="w-full flex items-center justify-center gap-2"
						disabled={!userId || !onRouteSave}
					>
						<Upload className="h-4 w-4" />
						Upload GPX File
					</Button>
					{userId && onRouteSave && (
						<GpxUpload
							onRouteSave={onRouteSave}
							userId={userId}
							className="absolute inset-0 opacity-0 cursor-pointer"
						/>
					)}
				</div>
			</div>
			{routes && routes.length > 0 ? (
				routes.map((route) => (
					<Card
						key={route.id}
						className="mb-2 hover:bg-accent cursor-pointer transition-colors"
						onClick={() => {
							onRouteSelect?.(route);
							setSelectedRouteId(route.id);
						}}
					>
						<CardHeader>
							<CardTitle>{route.name}</CardTitle>
							{route.geometry && (route.geometry as LineString).coordinates && (
								<CardDescription>
									Distance:{' '}
									{calculateRouteDistance((route.geometry as LineString).coordinates as [number, number][]).toFixed(2)}{' '}
									km
								</CardDescription>
							)}
						</CardHeader>
						<CardContent>
							<p>Created: {new Date(route.created_at).toLocaleString()}</p>
						</CardContent>
					</Card>
				))
			) : (
				<p className="text-muted-foreground">No routes yet</p>
			)}
		</div>
	);
}
