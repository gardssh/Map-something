import { Activity } from '@/types/activity';
import { formatDistance, formatDuration } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import type { Waypoint } from '@/types/waypoint';
import type { DbRoute } from '@/types/supabase';
import { ViewCardsButton } from './ViewCardsButton';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

// Haversine formula to calculate distance between two points
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371; // Radius of the earth in km
	const dLat = deg2rad(lat2 - lat1);
	const dLon = deg2rad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in km
}

function deg2rad(deg: number) {
	return deg * (Math.PI / 180);
}

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
	mapCenter: { lat: number; lng: number };
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
	mapCenter,
}: ActivityCardsProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isScrollingRef = useRef(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout>();
	const [showCards, setShowCards] = useState(false);
	const [lastMapCenter, setLastMapCenter] = useState(mapCenter);
	const [lastVisibleIds, setLastVisibleIds] = useState({
		activities: visibleActivitiesId,
		routes: visibleRoutesId,
		waypoints: visibleWaypointsId,
	});

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

	// Reset scroll only when selection changes and we're not actively scrolling
	useEffect(() => {
		const selectedId = selectedActivity?.id || selectedRoute?.id || selectedWaypoint?.id;
		const selectedType = selectedActivity ? 'activity' : selectedRoute ? 'route' : selectedWaypoint ? 'waypoint' : null;
		if (!selectedId || !selectedType || isScrollingRef.current) return;

		const container = scrollContainerRef.current;
		if (!container) return;

		const selectedIndex = items.findIndex((item) => item.id === selectedId && item.type === selectedType);
		if (selectedIndex === -1) return;

		// Only scroll if the selection was triggered by a map click, not by card scroll
		if (!isScrollingRef.current) {
			const cardWidth = 280 + 16; // card width + gap
			container.scrollTo({
				left: selectedIndex * cardWidth,
				behavior: 'smooth',
			});
		}
	}, [selectedActivity, selectedRoute, selectedWaypoint, items]);

	// Handle scroll end to highlight the card in view
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const highlightVisibleCard = () => {
			const containerWidth = container.clientWidth;
			const scrollLeft = container.scrollLeft;
			const cardWidth = 280 + 16; // card width + gap

			// Find the card that takes up most of the container width
			// If we're at the start (scrollLeft is 0), always select the first card
			const visibleCardIndex = scrollLeft === 0 ? 0 : Math.round((scrollLeft + containerWidth / 2) / cardWidth);
			const item = items[visibleCardIndex];

			if (item) {
				const currentHighlightId = selectedActivity?.id || selectedRoute?.id || selectedWaypoint?.id;

				// Only update if the highlighted item has changed
				if (currentHighlightId !== item.id) {
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
			}
		};

		const handleScroll = () => {
			isScrollingRef.current = true;
			clearTimeout(scrollTimeoutRef.current);

			scrollTimeoutRef.current = setTimeout(() => {
				highlightVisibleCard();
				isScrollingRef.current = false;
			}, 100); // Reduced timeout for more responsive highlighting
		};

		// Initial highlight when cards are shown
		if (items.length > 0) {
			highlightVisibleCard();
		}

		container.addEventListener('scroll', handleScroll);
		return () => {
			container.removeEventListener('scroll', handleScroll);
			clearTimeout(scrollTimeoutRef.current);
		};
	}, [
		items,
		onActivityHighlight,
		onRouteHighlight,
		onWaypointHighlight,
		selectedActivity,
		selectedRoute,
		selectedWaypoint,
	]);

	const handleItemClick = (item: CardItem) => {
		// Clear other highlights first
		if (item.type !== 'activity') onActivityHighlight({} as Activity);
		if (item.type !== 'route') onRouteHighlight({} as DbRoute);
		if (item.type !== 'waypoint') onWaypointHighlight({} as Waypoint);

		// Then highlight and select the clicked item
		switch (item.type) {
			case 'activity':
				onActivityHighlight(item.item as Activity);
				onActivitySelect(item.item as Activity);
				break;
			case 'route':
				onRouteHighlight(item.item as DbRoute);
				onRouteSelect(item.item as DbRoute);
				break;
			case 'waypoint':
				onWaypointHighlight(item.item as Waypoint);
				onWaypointSelect(item.item as Waypoint);
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

	// Check if we should close the cards based on map movement or visible items change
	useEffect(() => {
		if (!showCards) return;

		// Calculate distance between current and last map center
		const distance = getDistanceFromLatLonInKm(mapCenter.lat, mapCenter.lng, lastMapCenter.lat, lastMapCenter.lng);

		// Calculate change in visible items
		const currentVisibleCount = visibleActivitiesId.length + visibleRoutesId.length + visibleWaypointsId.length;
		const lastVisibleCount =
			lastVisibleIds.activities.length + lastVisibleIds.routes.length + lastVisibleIds.waypoints.length;
		const visibleItemsChange = Math.abs(currentVisibleCount - lastVisibleCount);

		// Close cards if moved more than 2km or if visible items changed by more than 30%
		const significantMove = distance > 2;
		const significantVisibleChange = visibleItemsChange > Math.max(lastVisibleCount * 0.3, 3);

		if (significantMove || significantVisibleChange) {
			// Clear all highlights before closing
			onActivityHighlight({} as Activity);
			onRouteHighlight({} as DbRoute);
			onWaypointHighlight({} as Waypoint);
			setShowCards(false);
		} else {
			// Update last known state
			setLastMapCenter(mapCenter);
			setLastVisibleIds({
				activities: visibleActivitiesId,
				routes: visibleRoutesId,
				waypoints: visibleWaypointsId,
			});
		}
	}, [mapCenter, visibleActivitiesId, visibleRoutesId, visibleWaypointsId]);

	if (!showCards) {
		return (
			<ViewCardsButton
				itemCount={items.length}
				onClick={() => {
					setShowCards(true);
					// Set initial values for map center and visible IDs when opening cards
					setLastMapCenter(mapCenter);
					setLastVisibleIds({
						activities: visibleActivitiesId,
						routes: visibleRoutesId,
						waypoints: visibleWaypointsId,
					});

					if (items.length > 0) {
						const firstItem = items[0];
						// Clear other highlights first
						if (firstItem.type !== 'activity') onActivityHighlight({} as Activity);
						if (firstItem.type !== 'route') onRouteHighlight({} as DbRoute);
						if (firstItem.type !== 'waypoint') onWaypointHighlight({} as Waypoint);

						// Then highlight the first item
						switch (firstItem.type) {
							case 'activity':
								onActivityHighlight(firstItem.item as Activity);
								break;
							case 'route':
								onRouteHighlight(firstItem.item as DbRoute);
								break;
							case 'waypoint':
								onWaypointHighlight(firstItem.item as Waypoint);
								break;
						}

						// Ensure we scroll to the first card after the component renders
						setTimeout(() => {
							const container = scrollContainerRef.current;
							if (container) {
								container.scrollTo({
									left: 0,
									behavior: 'smooth',
								});
							}
						}, 0);
					}
				}}
			/>
		);
	}

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50">
			<div className="relative">
				{showCards && (
					<div
						ref={scrollContainerRef}
						className="flex gap-4 overflow-x-auto p-4 pb-8 bg-white/95 backdrop-blur-sm shadow-lg"
					>
						{items.map((item) => (
							<div
								key={`${item.type}-${item.id}`}
								className={`flex-none w-[280px] p-4 rounded-lg border ${
									isSelected(item) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
								} shadow-sm cursor-pointer transition-all hover:shadow-md`}
								onClick={() => handleItemClick(item)}
							>
								<div className="flex items-start justify-between mb-2">
									<div className="flex items-center gap-2">
										<span className="text-xl">{getItemIcon(item.type)}</span>
										<h3 className="font-medium text-gray-900 line-clamp-1">{item.name}</h3>
									</div>
								</div>
								{item.date && <p className="text-sm text-gray-500 mb-2">{new Date(item.date).toLocaleDateString()}</p>}
								{item.distance && <p className="text-sm text-gray-600">Distance: {formatDistance(item.distance)}</p>}
								{item.duration && <p className="text-sm text-gray-600">Duration: {formatDuration(item.duration)}</p>}
								{item.type === 'activity' && (item.item as Activity).strava_id && (
									<a
										href={`https://www.strava.com/activities/${(item.item as Activity).strava_id}`}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 mt-2 text-sm text-orange-600 hover:text-orange-700"
										onClick={(e) => e.stopPropagation()}
									>
										View in Strava
										<ExternalLink className="h-3 w-3" />
									</a>
								)}
							</div>
						))}
					</div>
				)}
				<ViewCardsButton itemCount={items.length} onClick={() => setShowCards(!showCards)} />
			</div>
		</div>
	);
}
