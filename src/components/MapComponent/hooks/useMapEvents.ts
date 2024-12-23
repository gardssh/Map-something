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
}: UseMapEventsProps) => {
	const onHover = useCallback(
		(event: MapLayerMouseEvent) => {
			const map = mapRef.current?.getMap();
			if (!map) return;

			// Don't show hover info when drawing or on touch devices
			if (isDrawing || 'ontouchstart' in window) {
				setHoverInfo(null);
				
				map.getCanvas().style.cursor = '';
				return;
			}

			const feature = event.features && event.features[0];
			if (!feature) {
				setHoverInfo(null);
				map.getCanvas().style.cursor = '';
				return;
			}

			// Set pointer cursor for interactive features
			map.getCanvas().style.cursor = 'pointer';

			// Handle activity hover
			if (typeof feature.id === 'number') {
				const activity = activities.find((activity) => activity.id === feature.id);
				if (activity) {
					setHoverInfo({
						id: activity.id,
						name: activity.name,
						type: activity.sport_type,
						time: formatTime(activity.moving_time),
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
				}
			}
			// Handle route hover
			else if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
				const route = routes?.find((r) => r.id === feature.properties?.id);
				if (route) {
					setHoverInfo({
						id: route.id,
						name: route.name,
						type: 'Route',
						time: new Date(route.created_at).toLocaleDateString(),
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
				}
			}
			// Handle waypoint hover
			else if (feature.layer.id === 'waypoints-layer') {
				const waypoint = waypoints?.find((w) => w.id === (feature.id || feature.properties?.id));
				if (waypoint) {
					setHoverInfo({
						id: waypoint.id,
						name: waypoint.name,
						type: 'Waypoint',
						time: new Date(waypoint.created_at).toLocaleDateString(),
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
					
					// Set hover state
					map.setFeatureState(
						{ source: 'waypoints', id: waypoint.id },
						{ hover: true }
					);
				}
			} else {
				// Not an interactive feature
				map.getCanvas().style.cursor = '';
				setHoverInfo(null);
			}

			// Clear hover states for non-hovered waypoints
			if (feature.layer.id !== 'waypoints-layer') {
				waypoints?.forEach(w => {
					map.setFeatureState(
						{ source: 'waypoints', id: w.id },
						{ hover: false }
					);
				});
			}
		},
		[activities, routes, waypoints, isDrawing, setHoverInfo, mapRef]
	);

	const onClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const features = event.features || [];

			if (features.length > 0) {
				const feature = features[0];
				const properties = feature?.properties;
				if (!feature || !properties) return;

				// Handle activity clicks
				if (typeof feature.id === 'number') {
					setSelectedRouteId(feature.id);
					setSelectedRoute(null);
					const selectedActivity = activities.find((activity) => activity.id === feature.id);
					if (selectedActivity) {
						const routePoints = switchCoordinates(selectedActivity);
						handleBounds(mapRef as React.RefObject<MapRef>, routePoints.coordinates);
					}
				}
				// Handle drawn route clicks
				else if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
					const route = routes?.find((r) => r.id === properties.id);

					if (route) {
						setSelectedRouteId(route.id);
						setSelectedRoute(route);
						onRouteSelect?.(route);
						if ('coordinates' in route.geometry) {
							handleBounds(mapRef as React.RefObject<MapRef>, route.geometry.coordinates as [number, number][]);
						}
					}
				}
				// Handle waypoint clicks
				else if (feature.layer.id === 'waypoints-layer') {
					const waypoint = waypoints?.find((w) => w.id === (feature.id || properties.id));
					if (waypoint) {
						handleWaypointSelect?.(waypoint);
					}
				}
			} else {
				setSelectedRouteId(null);
				setSelectedRoute(null);
				onRouteSelect?.(null);
				handleWaypointSelect?.(null);
			}
		},
		[activities, routes, waypoints, setSelectedRouteId, setSelectedRoute, onRouteSelect, mapRef, switchCoordinates, handleWaypointSelect]
	);

	return {
		onHover,
		onClick,
	};
}; 