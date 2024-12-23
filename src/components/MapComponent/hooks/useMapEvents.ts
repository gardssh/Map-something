'use client';

import { useCallback } from 'react';
import type { MapLayerMouseEvent } from 'react-map-gl';
import type { DbRoute } from '@/types/supabase';
import type { Activity, HoverInfo } from '@/types/activity';
import type { RoutePoints } from '@/components/activities/switchCor';
import { handleBounds } from '../utils/mapUtils';
import type { MapRef } from 'react-map-gl';
import { formatTime } from '@/lib/timeFormat';
import type { Waypoint } from '@/types/waypoint';

interface UseMapEventsProps {
	activities: Activity[];
	routes?: DbRoute[];
	waypoints?: Waypoint[];
	setSelectedRouteId: (id: string | number | null) => void;
	setSelectedRoute: (route: DbRoute | null) => void;
	onRouteSelect?: (route: DbRoute | null) => void;
	setHoverInfo: (info: HoverInfo | null) => void;
	isDrawing: boolean;
	mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
	switchCoordinates: (activity: Activity) => RoutePoints;
	handleWaypointSelect?: (waypoint: Waypoint | null) => void;
	onActivitySelect?: (activity: Activity | null) => void;
}

export const useMapEvents = ({
	activities,
	routes,
	waypoints,
	setSelectedRouteId,
	setSelectedRoute,
	onRouteSelect,
	setHoverInfo,
	isDrawing,
	mapRef,
	switchCoordinates,
	handleWaypointSelect,
	onActivitySelect,
}: UseMapEventsProps) => {
	const onHover = useCallback(
		(event: MapLayerMouseEvent) => {
			const map = mapRef.current?.getMap();
			if (!map) return;

			// Don't show hover info when drawing
			if (isDrawing) {
				setHoverInfo(null);
				map.getCanvas().style.cursor = '';
				return;
			}

			const features = event.features || [];
			if (features.length === 0) {
				setHoverInfo(null);
				map.getCanvas().style.cursor = '';
				return;
			}

			const feature = features[0];
			const properties = feature?.properties;
			if (!feature || !properties) {
				setHoverInfo(null);
				map.getCanvas().style.cursor = '';
				return;
			}

			// Set pointer cursor for interactive features
			map.getCanvas().style.cursor = 'pointer';

			// Handle activity hover
			if (properties.isActivity) {
				const activity = activities.find(a => a.id === properties.id);
				if (activity) {
					setHoverInfo({
						id: activity.id,
						name: activity.name,
						type: activity.sport_type,
						time: activity.moving_time ? formatTime(activity.moving_time) : '0:00',
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
					return;
				}
			}

			// Handle route hover
			if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
				const route = routes?.find(r => r.id === properties.id);
				if (route) {
					setHoverInfo({
						id: route.id,
						name: route.name,
						type: 'Route',
						time: new Date(route.created_at).toLocaleDateString(),
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
					return;
				}
			}

			// Handle waypoint hover
			if (feature.layer.id === 'waypoints-layer') {
				const waypoint = waypoints?.find(w => w.id === properties.id);
				if (waypoint) {
					setHoverInfo({
						id: waypoint.id,
						name: waypoint.name,
						type: 'Waypoint',
						time: new Date(waypoint.created_at).toLocaleDateString(),
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
					return;
				}
			}

			setHoverInfo(null);
			map.getCanvas().style.cursor = '';
		},
		[activities, routes, waypoints, isDrawing, setHoverInfo, mapRef]
	);

	const onClick = useCallback(
		(event: MapLayerMouseEvent) => {
			console.log('Click event:', event);
			const features = event.features || [];
			console.log('Number of features:', features.length);

			if (features.length === 0) {
				setSelectedRouteId(null);
				setSelectedRoute(null);
				onRouteSelect?.(null);
				onActivitySelect?.(null);
				handleWaypointSelect?.(null);
				return;
			}

			const feature = features[0];
			const properties = feature?.properties;
			console.log('Selected feature:', feature);
			console.log('Feature properties:', properties);

			if (!feature || !properties) return;

			// Handle activity clicks
			if (properties.isActivity) {
				console.log('Clicked on activity with ID:', properties.id);
				const activity = activities.find(a => a.id === properties.id);
				console.log('Found activity:', activity);
				if (activity) {
					setSelectedRouteId(activity.id);
					setSelectedRoute(null);
					onActivitySelect?.(activity);
					const routePoints = switchCoordinates(activity);
					handleBounds(mapRef as React.RefObject<MapRef>, routePoints.coordinates);
				}
				return;
			}

			// Handle route clicks
			if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
				console.log('Clicked on route with ID:', properties.id);
				const route = routes?.find(r => r.id === properties.id);
				console.log('Found route:', route);
				if (route) {
					setSelectedRouteId(route.id);
					setSelectedRoute(route);
					onRouteSelect?.(route);
					if ('coordinates' in route.geometry) {
						handleBounds(mapRef as React.RefObject<MapRef>, route.geometry.coordinates as [number, number][]);
					}
				}
				return;
			}

			// Handle waypoint clicks
			if (feature.layer.id === 'waypoints-layer') {
				console.log('Clicked on waypoint with ID:', properties.id);
				const waypoint = waypoints?.find(w => w.id === properties.id);
				console.log('Found waypoint:', waypoint);
				if (waypoint) {
					handleWaypointSelect?.(waypoint);
				}
				return;
			}
		},
		[
			activities,
			routes,
			waypoints,
			setSelectedRouteId,
			setSelectedRoute,
			onRouteSelect,
			onActivitySelect,
			mapRef,
			switchCoordinates,
			handleWaypointSelect,
		]
	);

	return {
		onHover,
		onClick,
	};
}; 