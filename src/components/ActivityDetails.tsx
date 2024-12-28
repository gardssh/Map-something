'use client';

import { Button } from './ui/button';
import { Card, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { formatTime } from '@/lib/timeFormat';
import type { ActivityWithMap } from '@/types/activity';
import { ElevationDetails } from './ElevationDetails';

interface ActivityDetailsProps {
	activity: ActivityWithMap;
	onClose: () => void;
}

export function ActivityDetails({ activity, onClose }: ActivityDetailsProps) {
	return (
		<div id="slide" className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
			<div className="flex justify-between items-center">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{activity.name}</h3>
				<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={onClose}>
					<X className="h-4 w-4" />
					<span className="sr-only">Close activity</span>
				</Button>
			</div>
			<div className="flex justify-between gap-2">
				<Badge variant={'secondary'} className="flex-1 flex items-center justify-center">
					{activity.type}
				</Badge>
				<Badge variant={'secondary'} className="flex-1 flex items-center justify-center">
					{activity.start_date.slice(0, 10)}
				</Badge>
			</div>
			<Card>
				<CardHeader>
					<p>Distance: {(activity.distance / 1000).toFixed(2)} km</p>
				</CardHeader>
			</Card>
			<Card>
				<CardHeader>
					<p>Moving time: {formatTime(activity.moving_time)}</p>
				</CardHeader>
			</Card>
			<Card>
				<CardHeader>
					<p>Total elevation gain: {activity.total_elevation_gain} m</p>
				</CardHeader>
			</Card>
			<Card>
				<CardHeader>
					<p>Moving speed: {(activity.average_speed * 3.6).toFixed(2)} km/t</p>
				</CardHeader>
			</Card>
			<ElevationDetails source={activity} />
		</div>
	);
}
