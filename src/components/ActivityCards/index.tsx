import { Activity } from '@/types/activity';
import { formatDistance, formatDuration } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import type { Waypoint } from '@/types/waypoint';
import type { DbRoute } from '@/types/supabase';

interface ActivityCardsProps {
	activities: Activity[];
	routes?: DbRoute[];
	waypoints?: Waypoint[];
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
	date?: string;
	distance?: number;
	duration?: number;
	item: Activity | DbRoute | Waypoint;
};

export function ActivityCards({
	activities,
	routes = [],
	waypoints = [],
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
}: ActivityCardsProps) {
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
	];

	// Reset scroll when selection changes
	useEffect(() => {
		const selectedId = selectedActivity?.id || selectedRoute?.id || selectedWaypoint?.id;
		const selectedType = selectedActivity ? 'activity' : selectedRoute ? 'route' : selectedWaypoint ? 'waypoint' : null;
		if (!selectedId || !selectedType) return;

		const container = scrollContainerRef.current;
		if (!container) return;

		const selectedIndex = items.findIndex((item) => item.id === selectedId && item.type === selectedType);
		if (selectedIndex === -1) return;

		const cardWidth = 280 + 16; // card width + gap
		container.scrollTo({
			left: selectedIndex * cardWidth,
			behavior: 'smooth',
		});
	}, [selectedActivity, selectedRoute, selectedWaypoint, items]);

	// Handle scroll to highlight card in view
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			isScrollingRef.current = true;
			clearTimeout(scrollTimeoutRef.current);

			scrollTimeoutRef.current = setTimeout(() => {
				const scrollLeft = container.scrollLeft;
				const cardIndex = Math.round(scrollLeft / (280 + 16)); // card width + gap
				const item = items[cardIndex];
				if (item) {
					// Clear other selections first
					if (item.type !== 'activity') onActivityHighlight({} as Activity);
					if (item.type !== 'route') onRouteHighlight({} as DbRoute);
					if (item.type !== 'waypoint') onWaypointHighlight({} as Waypoint);

					// Then highlight the current item
					switch (item.type) {
						case 'activity':
							onActivityHighlight(item.item as Activity);
							break;
						case 'route':
							onRouteHighlight(item.item as DbRoute);
							break;
						case 'waypoint':
							onWaypointHighlight(item.item as Waypoint);
							break;
					}
				}
				isScrollingRef.current = false;
			}, 150); // Wait for scroll to finish
		};

		container.addEventListener('scroll', handleScroll);
		return () => {
			container.removeEventListener('scroll', handleScroll);
			clearTimeout(scrollTimeoutRef.current);
		};
	}, [items, onActivityHighlight, onRouteHighlight, onWaypointHighlight]);

	const handleItemClick = (item: CardItem) => {
		// Clear other selections first
		if (item.type !== 'activity') onActivityHighlight({} as Activity);
		if (item.type !== 'route') onRouteHighlight({} as DbRoute);
		if (item.type !== 'waypoint') onWaypointHighlight({} as Waypoint);

		// Then select the clicked item
		switch (item.type) {
			case 'activity':
				onActivitySelect(item.item as Activity);
				onActivityHighlight(item.item as Activity);
				break;
			case 'route':
				onRouteSelect(item.item as DbRoute);
				onRouteHighlight(item.item as DbRoute);
				break;
			case 'waypoint':
				onWaypointSelect(item.item as Waypoint);
				onWaypointHighlight(item.item as Waypoint);
				break;
		}
	};

	const isSelected = (item: CardItem) => {
		switch (item.type) {
			case 'activity':
				return selectedActivity?.id === item.id;
			case 'route':
				return selectedRoute?.id === item.id;
			case 'waypoint':
				return selectedWaypoint?.id === item.id;
			default:
				return false;
		}
	};

	const getItemIcon = (type: CardItem['type']) => {
		switch (type) {
			case 'activity':
				return '🏃‍♂️';
			case 'route':
				return '🗺️';
			case 'waypoint':
				return '📍';
		}
	};

	return (
		<div className="fixed bottom-16 left-0 right-0 px-4 pb-4 z-[20]">
			<div
				ref={scrollContainerRef}
				className="overflow-x-auto flex gap-4 snap-x snap-mandatory scrollbar-hide"
				style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
			>
				{items.map((item) => (
					<div
						key={`${item.type}-${item.id}`}
						className={`flex-shrink-0 w-[280px] snap-center cursor-pointer rounded-lg bg-background p-4 shadow-lg transition-all ${
							isSelected(item) ? 'ring-2 ring-primary' : ''
						}`}
						onClick={() => handleItemClick(item)}
					>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span>{getItemIcon(item.type)}</span>
								<h3 className="font-semibold truncate">{item.name}</h3>
							</div>
							<div className="text-sm text-muted-foreground space-y-1">
								{(item.distance !== undefined || item.duration !== undefined) && (
									<p>
										{item.distance !== undefined && formatDistance(item.distance)}
										{item.distance !== undefined && item.duration !== undefined && ' • '}
										{item.duration !== undefined && formatDuration(item.duration)}
									</p>
								)}
								<p>{item.date ? new Date(item.date).toLocaleDateString() : 'Date not available'}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
