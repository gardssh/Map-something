'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/timeFormat';
import { ActivityWithMap } from '@/types/activity';
import { DbRoute } from '@/types/supabase';
import { Waypoint } from '@/types/waypoint';
import { MapPin, Route, Activity } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import * as turf from '@turf/turf';

interface NearbyListProps {
	activities: ActivityWithMap[];
	routes: DbRoute[];
	waypoints: Waypoint[];
	visibleActivitiesId: number[];
	visibleRoutesId: (string | number)[];
	visibleWaypointsId: (string | number)[];
	selectedRouteId: string | number | null;
	onActivitySelect?: (activity: ActivityWithMap | null) => void;
	onRouteSelect?: (route: DbRoute) => void;
	onWaypointSelect?: (waypoint: Waypoint) => void;
	setSelectedRouteId?: (id: string | number | null) => void;
	showTypes: {
		activities: boolean;
		routes: boolean;
		waypoints: boolean;
	};
	setShowTypes: (types: { activities: boolean; routes: boolean; waypoints: boolean }) => void;
}

type NearbyItem = {
	id: string | number;
	type: 'activity' | 'route' | 'waypoint';
	name: string;
	date?: string;
	item: ActivityWithMap | DbRoute | Waypoint;
};

export function NearbyList({
	activities,
	routes,
	waypoints,
	visibleActivitiesId,
	visibleRoutesId,
	visibleWaypointsId,
	selectedRouteId,
	onActivitySelect,
	onRouteSelect,
	onWaypointSelect,
	setSelectedRouteId,
	showTypes,
	setShowTypes,
}: NearbyListProps) {
	const visibleCounts = {
		activities: activities.filter((a) => visibleActivitiesId.includes(Number(a.id))).length,
		routes: routes.filter((r) => visibleRoutesId.includes(r.id)).length,
		waypoints: waypoints.filter((w) => visibleWaypointsId.includes(w.id)).length,
	};

	const visibilityArrays = {
		activities: activities.filter((a) => visibleActivitiesId.includes(Number(a.id))),
		routes: routes.filter((r) => visibleRoutesId.includes(r.id)),
		waypoints: waypoints.filter((w) => visibleWaypointsId.includes(w.id)),
	};

	const items = [
		...activities
			.filter((activity) => visibleActivitiesId.includes(Number(activity.id)))
			.map((activity) => ({
				id: activity.id,
				type: 'activity' as const,
				name: activity.name,
				date: activity.start_date,
				distance: activity.distance,
				duration: activity.moving_time,
				item: activity,
			})),
		...routes
			.filter((route) => visibleRoutesId.includes(route.id))
			.map((route) => ({
				id: route.id,
				type: 'route' as const,
				name: route.name || 'Unnamed Route',
				date: route.created_at,
				distance: route.distance,
				item: route,
			})),
		...waypoints
			.filter((waypoint) => visibleWaypointsId.includes(waypoint.id))
			.map((waypoint) => ({
				id: waypoint.id,
				type: 'waypoint' as const,
				name: waypoint.name,
				date: waypoint.created_at,
				item: waypoint,
			})),
	].filter((item) => {
		const typeMap = {
			activity: 'activities',
			route: 'routes',
			waypoint: 'waypoints',
		} as const;
		return showTypes[typeMap[item.type]];
	});

	// Sort items by date, most recent first
	const sortedItems = items.sort((a, b) => {
		const dateA = a.date ? new Date(a.date).getTime() : 0;
		const dateB = b.date ? new Date(b.date).getTime() : 0;
		return dateB - dateA;
	});

	const handleItemClick = (item: NearbyItem) => {
		switch (item.type) {
			case 'activity':
				onActivitySelect?.(item.item as ActivityWithMap);
				break;
			case 'route':
				onRouteSelect?.(item.item as DbRoute);
				setSelectedRouteId?.(item.id);
				break;
			case 'waypoint':
				onWaypointSelect?.(item.item as Waypoint);
				break;
		}
	};

	const getItemIcon = (type: NearbyItem['type']) => {
		switch (type) {
			case 'activity':
				return <Activity className="h-4 w-4" />;
			case 'route':
				return <Route className="h-4 w-4" />;
			case 'waypoint':
				return <MapPin className="h-4 w-4" />;
		}
	};

	const getItemDetails = (item: NearbyItem) => {
		switch (item.type) {
			case 'activity': {
				const activity = item.item as ActivityWithMap;
				return (
					<>
						<p className="text-sm text-muted-foreground">Type: {activity.sport_type}</p>
						<p className="text-sm text-muted-foreground">Time: {formatTime(activity.moving_time)}</p>
					</>
				);
			}
			case 'route': {
				const route = item.item as DbRoute;
				const distance =
					route.distance ||
					(route.geometry && 'coordinates' in route.geometry
						? turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' })
						: 0);

				return (
					<>
						{distance > 0 && <p className="text-sm text-muted-foreground">Distance: {distance.toFixed(1)} km</p>}
						{route.comments && <p className="text-sm text-muted-foreground">{route.comments}</p>}
					</>
				);
			}
			case 'waypoint': {
				const waypoint = item.item as Waypoint;
				return (
					<>
						{waypoint.comments && <p className="text-sm text-muted-foreground">{waypoint.comments}</p>}
						<p className="text-sm text-muted-foreground">
							{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
						</p>
					</>
				);
			}
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<div className="flex flex-wrap gap-2">
					<Badge
						variant="outline"
						className={cn(
							'cursor-pointer hover:bg-primary/20 transition-colors',
							showTypes.activities ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'
						)}
						onClick={() => setShowTypes({ ...showTypes, activities: !showTypes.activities })}
					>
						<Activity className="h-3.5 w-3.5 mr-1.5" />
						Activities
					</Badge>
					<Badge
						variant="outline"
						className={cn(
							'cursor-pointer hover:bg-primary/20 transition-colors',
							showTypes.routes ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'
						)}
						onClick={() => setShowTypes({ ...showTypes, routes: !showTypes.routes })}
					>
						<Route className="h-3.5 w-3.5 mr-1.5" />
						Routes
					</Badge>
					<Badge
						variant="outline"
						className={cn(
							'cursor-pointer hover:bg-primary/20 transition-colors',
							showTypes.waypoints ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'
						)}
						onClick={() => setShowTypes({ ...showTypes, waypoints: !showTypes.waypoints })}
					>
						<MapPin className="h-3.5 w-3.5 mr-1.5" />
						Waypoints
					</Badge>
				</div>
			</div>
			{sortedItems.map((item) => (
				<Card
					key={`${item.type}-${item.id}`}
					className={cn('hover:bg-accent cursor-pointer transition-colors', {
						'bg-accent': item.id === selectedRouteId,
					})}
					onClick={() => handleItemClick(item)}
				>
					<CardHeader className="flex flex-row items-start space-y-0 pb-2">
						<div className="flex-1">
							<div className="flex items-center gap-2">
								{getItemIcon(item.type)}
								<CardTitle className="text-base">{item.name}</CardTitle>
							</div>
							<CardDescription>{item.date ? new Date(item.date).toLocaleDateString() : 'No date'}</CardDescription>
						</div>
						<Badge variant="outline" className="ml-2">
							{item.type}
						</Badge>
					</CardHeader>
					<CardContent>{getItemDetails(item)}</CardContent>
				</Card>
			))}
			{sortedItems.length === 0 && (
				<p className="text-muted-foreground text-center py-4">No items visible in the current view</p>
			)}
		</div>
	);
}
