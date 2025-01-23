'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';
import type { DbWaypoint } from '../types/supabase';
import { useState, useEffect } from 'react';

interface WaypointListProps {
	waypoints: DbWaypoint[];
	userId: string;
	onWaypointSelect?: (waypoint: DbWaypoint | null) => void;
}

export function WaypointList({ waypoints, userId, onWaypointSelect }: WaypointListProps) {
	const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);

	// Listen for custom events
	useEffect(() => {
		const handleWaypointSaved = () => {
			console.log('[WaypointList] Waypoint saved event received');
			setIsAddingWaypoint(false);
		};

		const handleWaypointDialogOpen = () => {
			console.log('[WaypointList] Waypoint dialog opened');
			setIsAddingWaypoint(false);
		};

		window.addEventListener('waypoint-saved', handleWaypointSaved);
		window.addEventListener('waypoint-dialog-open', handleWaypointDialogOpen);

		return () => {
			window.removeEventListener('waypoint-saved', handleWaypointSaved);
			window.removeEventListener('waypoint-dialog-open', handleWaypointDialogOpen);
		};
	}, []);

	const toggleAddWaypoint = () => {
		// Try to find the button multiple times with a small delay
		const findAndClickButton = (retries = 0) => {
			if (retries >= 5) {
				console.log('[WaypointList] Could not find waypoint button after 5 retries');
				return;
			}

			const addWaypointButton = document.querySelector(
				'.mapboxgl-ctrl-group button[title^="Add waypoint"], .mapboxgl-ctrl-group button[title^="Cancel adding waypoint"]'
			) as HTMLButtonElement;

			if (addWaypointButton) {
				addWaypointButton.click();
				setIsAddingWaypoint(!isAddingWaypoint);
			} else {
				console.log(`[WaypointList] Retrying to find waypoint button... (${retries + 1}/5)`);
				setTimeout(() => findAndClickButton(retries + 1), 100); // Retry after 100ms
			}
		};

		findAndClickButton();
	};

	return (
		<div className="grow gap-2 overflow-y-auto">
			<div className="flex flex-col gap-4 mb-4">
				<div className="flex items-center justify-between">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Waypoints</h3>
				</div>
				<div className="flex flex-col gap-2">
					<Button
						variant={isAddingWaypoint ? 'destructive' : 'default'}
						className="w-full flex items-center justify-center gap-2"
						onClick={toggleAddWaypoint}
					>
						<MapPin className="h-4 w-4" />
						{isAddingWaypoint ? 'Cancel Adding' : 'Add Waypoint'}
					</Button>
				</div>
			</div>
			{waypoints && waypoints.length > 0 ? (
				waypoints.map((waypoint) => (
					<Card
						key={waypoint.id}
						className="mb-2 hover:bg-accent cursor-pointer transition-colors"
						onClick={() => onWaypointSelect?.(waypoint)}
					>
						<CardHeader>
							<CardTitle>{waypoint.name}</CardTitle>
							<CardDescription>
								{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
							</CardDescription>
						</CardHeader>
						{waypoint.comments && (
							<CardContent>
								<p>{waypoint.comments}</p>
							</CardContent>
						)}
					</Card>
				))
			) : (
				<p className="text-muted-foreground">No waypoints yet</p>
			)}
		</div>
	);
}
