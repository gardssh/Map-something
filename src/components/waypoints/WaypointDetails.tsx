'use client';

import type { Waypoint } from '../../types/waypoint';

interface WaypointDetailsProps {
	waypoint: Waypoint;
}

export const WaypointDetails = ({ waypoint }: WaypointDetailsProps) => {
	return (
		<div className="p-4 space-y-4">
			<h2 className="text-xl font-semibold">{waypoint.name}</h2>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Coordinates</p>
					<p>
						{waypoint.coordinates[1].toFixed(6)}, {waypoint.coordinates[0].toFixed(6)}
					</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Created</p>
					<p>{new Date(waypoint.created_at).toLocaleDateString()}</p>
				</div>
				{waypoint.comments && (
					<div className="col-span-2">
						<p className="text-sm text-muted-foreground">Comments</p>
						<p>{waypoint.comments}</p>
					</div>
				)}
			</div>
		</div>
	);
};
