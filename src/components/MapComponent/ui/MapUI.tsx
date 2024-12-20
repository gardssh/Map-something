'use client';

import { Popup, Marker } from 'react-map-gl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AddMarker from '../AddMarker';
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
					Name: {hoverInfo.name}
					<p> </p>
					ID: {hoverInfo.id}
				</Popup>
			)}

			{waypoints?.map(
				(waypoint) =>
					/* Commented out Marker component
        <Marker
          key={waypoint.id}
          longitude={waypoint.coordinates[0]}
          latitude={waypoint.coordinates[1]}
          color="#9333ea"
        />
        */
					null
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
