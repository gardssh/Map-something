import { useRef, useEffect } from 'react';
import type { Activity } from '@/types/activity';
import type { Waypoint } from '@/types/waypoint';
import type { DbRoute } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { getSportEmoji } from '@/lib/utils';
import { formatTime } from '@/lib/timeFormat';

interface ActivityCardsProps {
	activities: Activity[];
	routes: DbRoute[];
	waypoints: Waypoint[];
	selectedActivity: Activity | null;
	selectedRoute: DbRoute | null;
	selectedWaypoint: Waypoint | null;
	onActivitySelect: (activity: Activity) => void;
	onRouteSelect: (route: DbRoute) => void;
	onWaypointSelect: (waypoint: Waypoint) => void;
	onActivityHighlight: (activity: Activity) => void;
	onRouteHighlight: (route: DbRoute) => void;
	onWaypointHighlight: (waypoint: Waypoint) => void;
	visibleActivitiesId: number[];
	visibleRoutesId: (string | number)[];
	visibleWaypointsId: (string | number)[];
}

type CardItem = {
	id: string | number;
	type: 'activity' | 'route' | 'waypoint';
	name: string;
	date: string;
	distance?: number;
	duration?: number;
	item: Activity | DbRoute | Waypoint;
};

export const ActivityCards = ({
	activities,
	routes,
	waypoints,
	selectedActivity,
	selectedRoute,
	selectedWaypoint,
	onActivitySelect,
	onRouteSelect,
	onWaypointSelect,
	onActivityHighlight,
	onRouteHighlight,
	onWaypointHighlight,
	visibleActivitiesId,
	visibleRoutesId,
	visibleWaypointsId,
}: ActivityCardsProps) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isScrollingRef = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout>();

	// Combine all items into a single array with unified format
	const items: CardItem[] = [
		...activities
			.filter((activity) => visibleActivitiesId.includes(Number(activity.id)))
			.map((activity) => ({
				id: activity.id,
				type: 'activity' as const,
				name: activity.name,
				date: activity.start_date || new Date().toISOString(),
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
				date: route.created_at || new Date().toISOString(),
				distance: route.distance,
				item: route,
			})),
		...waypoints
			.filter((waypoint) => visibleWaypointsId.includes(waypoint.id))
			.map((waypoint) => ({
				id: waypoint.id,
				type: 'waypoint' as const,
				name: waypoint.name || 'Unnamed Waypoint',
				date: waypoint.created_at || new Date().toISOString(),
				item: waypoint,
			})),
	];

	console.log('Filtered items:', {
		activities: activities.filter((activity) => visibleActivitiesId.includes(Number(activity.id))).length,
		routes: routes.filter((route) => visibleRoutesId.includes(route.id)).length,
		waypoints: waypoints.filter((waypoint) => visibleWaypointsId.includes(waypoint.id)).length,
	});

	// Reset scroll position when selection changes
	useEffect(() => {
		if (scrollContainerRef.current && !isScrollingRef.current) {
			scrollContainerRef.current.scrollLeft = 0;
		}
	}, [selectedActivity, selectedRoute, selectedWaypoint]);

	const handleScroll = () => {
		isScrollingRef.current = true;
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}
		scrollTimeoutRef.current = setTimeout(() => {
			isScrollingRef.current = false;
		}, 150);
	};

	return (
		<div
			ref={scrollContainerRef}
			className="absolute bottom-0 left-0 right-0 flex gap-4 p-4 overflow-x-auto z-[20] pb-safe"
			onScroll={handleScroll}
		>
			{items.map((item) => (
				<div
					key={`${item.type}-${item.id}`}
					className={cn(
						'flex-none w-48 p-4 rounded-lg shadow-lg cursor-pointer transition-all',
						'bg-background border border-border hover:border-primary',
						(item.type === 'activity' && selectedActivity?.id === item.id) ||
							(item.type === 'route' && selectedRoute?.id === item.id) ||
							(item.type === 'waypoint' && selectedWaypoint?.id === item.id)
							? 'border-primary'
							: ''
					)}
					onClick={() => {
						if (item.type === 'activity') {
							onActivitySelect(item.item as Activity);
						} else if (item.type === 'route') {
							onRouteSelect(item.item as DbRoute);
						} else if (item.type === 'waypoint') {
							onWaypointSelect(item.item as Waypoint);
						}
					}}
					onMouseEnter={() => {
						if (item.type === 'activity') {
							onActivityHighlight(item.item as Activity);
						} else if (item.type === 'route') {
							onRouteHighlight(item.item as DbRoute);
						} else if (item.type === 'waypoint') {
							onWaypointHighlight(item.item as Waypoint);
						}
					}}
				>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="text-xl">
								{item.type === 'activity'
									? getSportEmoji((item.item as Activity).sport_type)
									: item.type === 'route'
										? '🗺️'
										: '📍'}
							</span>
							<h3 className="font-medium truncate">{item.name}</h3>
						</div>
						<div className="text-sm text-muted-foreground">
							{item.distance && <p>{(item.distance / 1000).toFixed(2)} km</p>}
							{item.duration && <p>{formatTime(item.duration)}</p>}
							<p>{new Date(item.date).toLocaleDateString()}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
