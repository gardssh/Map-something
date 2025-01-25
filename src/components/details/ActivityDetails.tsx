'use client';

import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { X, ExternalLink } from 'lucide-react';
import { formatTime } from '@/lib/timeFormat';
import type { ActivityWithMap } from '@/types/activity';
import ElevationProfile from '@/components/elevation/ElevationProfile';

interface ActivityDetailsProps {
	activity: ActivityWithMap;
	onClose?: () => void;
}

interface ElevationPoint {
	distance: number;
	elevation: number;
}

export function ActivityDetails({ activity, onClose }: ActivityDetailsProps) {
	return (
		<div className="grow flex flex-col h-full">
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 pb-16 flex flex-col gap-4">
					<div className="flex justify-between items-start bg-muted/50 p-4 rounded-lg">
						<div>
							<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{activity.name}</h3>
							{activity.strava_id && (
								<a
									href={`https://www.strava.com/activities/${activity.strava_id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 mt-1 text-sm text-orange-600 hover:text-orange-700"
								>
									View in Strava
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
						</div>
						{onClose && (
							<Button variant="ghost" size="icon" onClick={onClose}>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>

					<div className="flex justify-between gap-2">
						<Badge variant="secondary" className="flex-1 flex items-center justify-center">
							{activity.type || activity.sport_type}
						</Badge>
						<Badge variant="secondary" className="flex-1 flex items-center justify-center">
							{activity.start_date.slice(0, 10)}
						</Badge>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<p>Distance</p>
								<p className="text-lg font-medium">{(activity.distance / 1000).toFixed(2)} km</p>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader>
								<p>Moving Time</p>
								<p className="text-lg font-medium">{formatTime(activity.moving_time)}</p>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader>
								<p>Elevation Gain</p>
								<p className="text-lg font-medium">{activity.total_elevation_gain} m</p>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader>
								<p>Average Speed</p>
								<p className="text-lg font-medium">{(activity.average_speed * 3.6).toFixed(2)} km/h</p>
							</CardHeader>
						</Card>

						{activity.average_heartrate && (
							<Card>
								<CardHeader>
									<p>Avg Heart Rate</p>
									<p className="text-lg font-medium">{Math.round(activity.average_heartrate)} bpm</p>
								</CardHeader>
							</Card>
						)}

						{activity.max_heartrate && (
							<Card>
								<CardHeader>
									<p>Max Heart Rate</p>
									<p className="text-lg font-medium">{Math.round(activity.max_heartrate)} bpm</p>
								</CardHeader>
							</Card>
						)}
					</div>

					{activity.map?.summary_polyline && <ElevationProfile polyline={activity.map.summary_polyline} height={200} />}
				</div>
			</div>

			{activity.description && (
				<div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t">
					<Card>
						<CardHeader>
							<h4 className="text-lg font-medium">Description</h4>
						</CardHeader>
						<CardContent>
							<p>{activity.description}</p>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
