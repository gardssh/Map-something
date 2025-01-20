'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { GpxUpload } from './MapComponent/controls/GpxUpload';
import type { DbRoute } from '@/types/supabase';
import type { DrawnRoute } from '@/types/route';
import { LineString } from 'geojson';
import * as turf from '@turf/turf';

interface RouteListProps {
	routes: DbRoute[];
	userId: string;
	onRouteSave?: (route: DrawnRoute) => void;
	onRouteSelect?: (route: DbRoute | null) => void;
	setSelectedRouteId: (id: string | number | null) => void;
}

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
				routes.map((route) => {
					const distance =
						route.distance ||
						(route.geometry?.coordinates
							? turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' })
							: 0);

					return (
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
								<CardDescription>Distance: {distance.toFixed(2)} km</CardDescription>
							</CardHeader>
							<CardContent>
								<p>Created: {new Date(route.created_at).toLocaleString()}</p>
							</CardContent>
						</Card>
					);
				})
			) : (
				<p className="text-muted-foreground">No routes yet</p>
			)}
		</div>
	);
}
