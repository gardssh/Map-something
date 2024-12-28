'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Source, Layer, MapLayerTouchEvent, GeolocateControl, NavigationControl } from 'react-map-gl';
import { switchCoordinates } from '@/features/map/shared/utils/coordinates';
import { ActivityDetails } from '@/features/map/shared/components/activities/ActivityDetails';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';
import type { StyleSpecification } from 'mapbox-gl';
import type { DrawnRoute } from '@/types/route';
import type { Waypoint } from '@/types/waypoint';
import type { Activity, HoverInfo } from '@/features/map/shared/types/activity';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import type { DbRoute } from '@/types/supabase';
import { ActivityLayers } from '@/features/map/shared/components/layers/ActivityLayers';
import { RouteLayer } from '@/features/map/shared/components/layers/RouteLayer';
import { TerrainLayer } from '@/features/map/shared/components/layers/TerrainLayer';
import { WaypointLayer } from '@/features/map/shared/components/layers/WaypointLayer';
import MapControls from '@/features/map/shared/components/controls/MapControls';
import { MapUI } from '@/features/map/shared/components/ui/MapUI';
import { useMapEvents } from '@/features/map/shared/hooks/interaction/useMapEvents';
import { useMapConfig } from '@/features/map/shared/hooks/state/useMapConfig';
import { useMapLayers } from '@/features/map/shared/hooks/state/useMapLayers';
import { useSidebar } from '@/features/shared/components/ui/sidebar';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { ViewModeControl } from '@/features/map/shared/components/controls/ViewModeControl';
import { handleBounds } from '@/features/map/shared/utils/mapUtils';
import { ActivityCards } from '@/features/map/mobile/components/cards';
import { useResponsiveLayout } from '@/features/shared/hooks/responsive/useResponsiveLayout';
import { AddWaypointControl } from '@/features/map/shared/components/controls/AddWaypointControl';
import { CrosshairOverlay } from '@/features/map/mobile/components/CrosshairOverlay';
import { useMapTouchHandlers } from '@/features/map/shared/hooks/interaction/useMapTouchHandlers';
import { useMapVisibility } from '@/features/map/shared/hooks/state/useMapVisibility';
import { useFeatureSelection } from '@/features/map/shared/hooks/interaction/useFeatureSelection';
import { useMapInitialization } from '@/features/map/shared/hooks/initialization/useMapInitialization';
import { useMapProps } from '@/features/map/shared/hooks/state/useMapProps';
import { useWaypointPlacement } from '@/features/map/shared/hooks/interaction/useWaypointPlacement';

export const MapComponent = ({
	activities,
	setVisibleActivitiesId,
	selectedRouteId,
	setSelectedRouteId,
	onMapLoad,
	onRouteSelect,
	onRouteSave,
	routes = [],
	waypoints = [],
	onWaypointSave,
	onActivitySelect,
	handleWaypointSelect: parentHandleWaypointSelect,
	selectedWaypoint: parentSelectedWaypoint,
	setActiveItem,
	setShowDetailsDrawer,
}: {
	activities: Activity[];
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	selectedRouteId: string | number | null;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	onMapLoad?: (map: mapboxgl.Map) => void;
	onRouteSelect?: (route: DbRoute | null) => void;
	onRouteSave?: (route: DrawnRoute) => void;
	routes?: DbRoute[];
	waypoints?: Waypoint[];
	onWaypointSave?: (waypoint: Waypoint) => void;
	onActivitySelect?: (activity: any | null) => void;
	handleWaypointSelect?: (waypoint: Waypoint | null) => void;
	selectedWaypoint?: Waypoint | null;
	setActiveItem: (item: string) => void;
	setShowDetailsDrawer: (show: boolean) => void;
}) => {
	const mapRef = useRef<MapRef>();
	const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);
	const [selectedRoute, setSelectedRoute] = useState<DbRoute | null>(null);
	const [localRoutes, setLocalRoutes] = useState<DbRoute[]>(routes || []);
	const [newWaypointCoords, setNewWaypointCoords] = useState<[number, number] | null>(null);
	const [newWaypointName, setNewWaypointName] = useState('');
	const [showWaypointDialog, setShowWaypointDialog] = useState(false);
	const [isDrawing, setIsDrawing] = useState(false);
	const { user } = useAuth();
	const { data: session } = useSession();
	const { open: isSidebarOpen } = useSidebar();
	const { isMobile } = useResponsiveLayout();
	const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
	const [is3DMode, setIs3DMode] = useState(!isMobile);
	const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
	const [visibleActivitiesId, setLocalVisibleActivitiesId] = useState<number[]>([]);
	const [visibleRoutesId, setVisibleRoutesId] = useState<(string | number)[]>([]);
	const [visibleWaypointsId, setVisibleWaypointsId] = useState<(string | number)[]>([]);
	const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
	const [mapCenter, setMapCenter] = useState({ lat: 61.375172, lng: 8.296987 });

	const { availableLayers, initialMapState, mapStyle, mapSettings } = useMapConfig({ mapRef });

	const { currentBaseLayer, overlayStates, handleLayerToggle } = useMapLayers({ mapRef });

	const touchHandlers = useMapTouchHandlers({
		isDrawing,
		mapRef,
		activities,
		routes: localRoutes,
		waypoints,
		setSelectedRouteId,
		setSelectedRoute,
		onRouteSelect,
		onActivitySelect,
		handleWaypointSelect: parentHandleWaypointSelect,
		isMobile,
		setActiveItem,
		setShowDetailsDrawer,
	});

	const waypointPlacement = useWaypointPlacement({
		mapRef,
		setNewWaypointCoords,
		setShowWaypointDialog,
		setIsAddingWaypoint,
	});

	const { getVisibleFeatures, updateVisibleIds } = useMapVisibility({
		mapRef,
		setVisibleActivitiesId,
		setLocalVisibleActivitiesId,
		setVisibleRoutesId,
		setVisibleWaypointsId,
	});

	const { onHover, onClick } = useMapEvents({
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
		handleWaypointSelect: parentHandleWaypointSelect,
		onActivitySelect,
	});

	const {
		handleActivityHighlight,
		handleRouteHighlight,
		handleWaypointHighlight,
		handleActivitySelect,
		handleRouteSelect,
		handleWaypointSelect: featureHandleWaypointSelect,
	} = useFeatureSelection({
		mapRef,
		activities,
		routes: localRoutes,
		selectedRouteId,
		setSelectedRouteId,
		setSelectedRoute,
		onRouteSelect,
		onActivitySelect,
		onWaypointSelect: parentHandleWaypointSelect,
		isMobile,
		setActiveItem,
		setShowDetailsDrawer,
		setSelectedActivity,
		setSelectedWaypoint,
	});

	const { toggleViewMode } = useMapInitialization({
		mapRef,
		isMobile,
		is3DMode,
		setIs3DMode,
		isSidebarOpen,
		onMapLoad,
		updateVisibleIds,
	});

	useEffect(() => {
		setLocalRoutes(routes || []);
	}, [routes]);

	const onDrawModeChange = useCallback(({ mode }: { mode: string }) => {
		setIsDrawing(mode === 'draw_line_string');
	}, []);

	const onDrawCreate = useCallback(
		(evt: { features: any[] }) => {
			// DrawControl handles route saving internally
		},
		[onRouteSave]
	);

	const onDrawUpdate = useCallback(
		(evt: { features: any[]; action: string }) => {
			// DrawControl handles route saving internally
		},
		[onRouteSave]
	);

	const onDrawDelete = useCallback((evt: { features: any[] }) => {
		// Handle route deletion if needed
	}, []);

	const handleWaypointSave = useCallback(() => {
		if (newWaypointCoords && newWaypointName && onWaypointSave && user) {
			const waypoint: Waypoint = {
				id: crypto.randomUUID(),
				user_id: user.id,
				name: newWaypointName,
				coordinates: newWaypointCoords,
				geometry: {
					type: 'Point',
					coordinates: newWaypointCoords,
				},
				comments: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			onWaypointSave(waypoint);
			setNewWaypointName('');
			setNewWaypointCoords(null);
			setShowWaypointDialog(false);
		}
	}, [newWaypointCoords, newWaypointName, onWaypointSave, user]);

	useEffect(() => {
		setSelectedWaypoint(parentSelectedWaypoint || null);
	}, [parentSelectedWaypoint]);

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const handleMapLoad = () => {
			// Wait for waypoints layer to be added
			map.on('styledata', () => {
				const waypointsLayer = map.getLayer('waypoints-layer');
				if (waypointsLayer) {
					map.setLayoutProperty('waypoints-layer', 'visibility', 'visible');
					// Ensure the layer is interactive
					if (!map.getLayoutProperty('waypoints-layer', 'visibility')) {
						map.setLayoutProperty('waypoints-layer', 'visibility', 'visible');
					}
				}
			});
		};

		if (map.loaded()) {
			handleMapLoad();
		} else {
			map.on('load', handleMapLoad);
		}

		return () => {
			map.off('load', handleMapLoad);
			map.off('styledata', () => {});
		};
	}, []);

	// Update map center when the map moves
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const handleMapMove = () => {
			const center = map.getCenter();
			setMapCenter({ lat: center.lat, lng: center.lng });
		};

		// Update initial center
		handleMapMove();

		map.on('moveend', handleMapMove);
		return () => {
			map.off('moveend', handleMapMove);
		};
	}, []);

	const mapProps = useMapProps({
		mapRef,
		is3DMode,
		isMobile,
		isDrawing,
		mapStyle,
		initialMapState,
		updateVisibleIds,
		onHover,
		onClick,
		onTouchStart: touchHandlers.handleTouchStart,
		onTouchEnd: touchHandlers.handleTouchEnd,
		setNewWaypointCoords,
		setShowWaypointDialog,
		onMapLoad,
	});

	return (
		<div className="absolute inset-0">
			<Map {...mapProps}>
				<MapControls
					layers={availableLayers}
					currentBaseLayer={currentBaseLayer}
					overlayStates={overlayStates}
					onLayerToggle={handleLayerToggle}
					selectedCategories={selectedCategories}
					onCategoryToggle={setSelectedCategories}
					userId={session?.user?.id || ''}
					onDrawCreate={onDrawCreate}
					onDrawUpdate={onDrawUpdate}
					onDrawDelete={onDrawDelete}
					onRouteSave={onRouteSave}
					onRouteAdd={(route) => setLocalRoutes((prev) => [...prev, route])}
					onModeChange={onDrawModeChange}
					is3DMode={is3DMode}
					onViewModeToggle={toggleViewMode}
				/>

				<AddWaypointControl isActive={isAddingWaypoint} onClick={() => setIsAddingWaypoint(!isAddingWaypoint)} />

				<TerrainLayer overlayStates={overlayStates} />

				<ActivityLayers
					activities={activities}
					selectedRouteId={selectedRouteId}
					selectedCategories={selectedCategories}
				/>

				<RouteLayer routes={localRoutes} selectedRoute={selectedRoute} />

				<WaypointLayer waypoints={waypoints} selectedWaypoint={selectedWaypoint} />

				<MapUI
					activities={activities}
					selectedCategories={selectedCategories}
					hoverInfo={hoverInfo}
					isDrawing={isDrawing}
					waypoints={waypoints}
					showWaypointDialog={showWaypointDialog}
					setShowWaypointDialog={setShowWaypointDialog}
					newWaypointName={newWaypointName}
					setNewWaypointName={setNewWaypointName}
					handleWaypointSave={handleWaypointSave}
				/>

				{isAddingWaypoint && (
					<CrosshairOverlay
						onConfirm={waypointPlacement.handleWaypointPlacementConfirm}
						onCancel={() => setIsAddingWaypoint(false)}
					/>
				)}
			</Map>

			{isMobile && !isAddingWaypoint && (
				<ActivityCards
					activities={activities}
					routes={routes}
					waypoints={waypoints}
					selectedActivity={selectedActivity}
					selectedRoute={selectedRoute}
					selectedWaypoint={selectedWaypoint}
					onActivitySelect={handleActivitySelect}
					onRouteSelect={handleRouteSelect}
					onWaypointSelect={featureHandleWaypointSelect}
					onActivityHighlight={handleActivityHighlight}
					onRouteHighlight={handleRouteHighlight}
					onWaypointHighlight={handleWaypointHighlight}
					visibleActivitiesId={visibleActivitiesId}
					visibleRoutesId={visibleRoutesId}
					visibleWaypointsId={visibleWaypointsId}
					mapCenter={mapCenter}
				/>
			)}
		</div>
	);
};
