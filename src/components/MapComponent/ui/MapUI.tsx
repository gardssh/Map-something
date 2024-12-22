'use client';

import { Popup } from 'react-map-gl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Waypoint } from '@/types/waypoint';
import type { Activity, HoverInfo } from '@/types/activity';
import { categorizeActivity } from '@/lib/utils';

interface MapUIProps {
	activities: Activity[];
	selectedCategories: string[];
	hoverInfo: HoverInfo | null;
	isDrawing: boolean;
	waypoints?: Waypoint[];
	showWaypointDialog: boolean;
	setShowWaypointDialog: (show: boolean) => void;
	newWaypointName: string;
	setNewWaypointName: (name: string) => void;
	handleWaypointSave: () => void;
}

export const MapUI = ({
	activities,
	selectedCategories,
	hoverInfo,
	isDrawing,
	waypoints,
	showWaypointDialog,
	setShowWaypointDialog,
	newWaypointName,
	setNewWaypointName,
	handleWaypointSave,
}: MapUIProps) => {
	return (
		<>
			{activities.length > 0 &&
				activities
					.filter((activity) => selectedCategories.includes(categorizeActivity(activity.sport_type)))
					.map((activity) => {
						/* Commented out AddMarker component
            <AddMarker key={activity.id} activity={activity} />
            */
						return null;
					})}

			{!isDrawing && hoverInfo && (
				<Popup
					longitude={hoverInfo.longitude}
					latitude={hoverInfo.latitude}
					offset={[0, -10] as [number, number]}
					closeButton={false}
					className="activity-info"
				>
					<div className="flex flex-col gap-1">
						<div className="font-semibold">{hoverInfo.name}</div>
						<div className="text-sm text-muted-foreground">{hoverInfo.type}</div>
						<div className="text-sm">Time: {hoverInfo.time}</div>
					</div>
				</Popup>
			)}

			<Dialog open={showWaypointDialog} onOpenChange={setShowWaypointDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Waypoint</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<Input
							placeholder="Waypoint name"
							value={newWaypointName}
							onChange={(e) => setNewWaypointName(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setShowWaypointDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleWaypointSave}>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
