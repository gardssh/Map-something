'use client';

import { useCallback } from 'react';
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'react-map-gl';
import type { Activity } from '@/types/activity';
import type { DbRoute } from '@/types/supabase';
import type { Waypoint } from '@/types/waypoint';

interface UseMapEventsProps {
	isMobile: boolean;
	onActivitySelect?: (activity: Activity) => void;
	onRouteSelect?: (route: DbRoute) => void;
	onWaypointSelect?: (waypoint: Waypoint) => void;
	setSelectedRouteId?: (id: string | number | null) => void;
	setHoverInfo?: (info: any) => void;
	isDrawing?: boolean;
	isAddingWaypoint?: boolean;
	setNewWaypointCoords?: (coords: [number, number] | null) => void;
	setShowWaypointDialog?: (show: boolean) => void;
}

export const useMapEvents = ({
	isMobile,
	onActivitySelect,
	onRouteSelect,
	onWaypointSelect,
	setSelectedRouteId,
	setHoverInfo,
	isDrawing,
	isAddingWaypoint,
	setNewWaypointCoords,
	setShowWaypointDialog,
}: UseMapEventsProps) => {
	const handleClick = useCallback(
		(event: MapLayerMouseEvent | MapLayerTouchEvent) => {
			if (isDrawing) return;

			if (isAddingWaypoint) {
				const [lng, lat] = event.lngLat.toArray();
				setNewWaypointCoords?.([lng, lat]);
				setShowWaypointDialog?.(true);
				return;
			}

			const features = event.features;
			if (!features?.length) {
				setSelectedRouteId?.(null);
				return;
			}

			const feature = features[0];
			const properties = feature.properties;
			const layerId = feature.layer?.id;

			if (!properties || !layerId) return;

			switch (layerId) {
				case 'foot-sports':
				case 'cycle-sports':
				case 'water-sports':
				case 'winter-sports':
				case 'other-sports':
				case 'unknown-sports':
					onActivitySelect?.(properties as Activity);
					break;
				case 'saved-routes-layer':
				case 'saved-routes-border':
				case 'saved-routes-touch':
					onRouteSelect?.(properties as DbRoute);
					break;
				case 'waypoints-layer':
				case 'waypoints-layer-touch':
					onWaypointSelect?.(properties as Waypoint);
					break;
				default:
					break;
			}
		},
		[
			isDrawing,
			isAddingWaypoint,
			setNewWaypointCoords,
			setShowWaypointDialog,
			setSelectedRouteId,
			onActivitySelect,
			onRouteSelect,
			onWaypointSelect,
		]
	);

	const onHover = useCallback(
		(event: MapLayerMouseEvent) => {
			if (isDrawing || isAddingWaypoint || isMobile) return;

			const features = event.features;
			if (!features?.length) {
				setHoverInfo?.(null);
				return;
			}

			const feature = features[0];
			const properties = feature.properties;
			const layerId = feature.layer?.id;

			if (!properties || !layerId) return;

			setHoverInfo?.({
				x: event.point.x,
				y: event.point.y,
				feature: properties,
				type: layerId,
			});
		},
		[isDrawing, isAddingWaypoint, isMobile, setHoverInfo]
	);

	return {
		handleClick,
		onHover,
	};
}; 