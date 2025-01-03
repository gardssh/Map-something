'use client';
import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Source, Layer, MapLayerTouchEvent, GeolocateControl, NavigationControl } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';
import type { StyleSpecification } from 'mapbox-gl';
import type { DrawnRoute } from '@/types/route';
import type { Waypoint } from '@/types/waypoint';
import type { Activity, HoverInfo } from '@/types/activity';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import type { DbRoute } from '@/types/supabase';
import { ActivityLayers } from './layers/ActivityLayers';
import { RouteLayer } from './layers/RouteLayer';
import { TerrainLayer } from './layers/TerrainLayer';
import { WaypointLayer } from './layers/WaypointLayer';
import MapControls from './controls/MapControls';
import { MapUI } from './ui/MapUI';
import { useMapEvents } from './hooks/useMapEvents';
import { useMapConfig } from './hooks/useMapConfig';
import { useMapLayers } from './hooks/useMapLayers';
import { useSidebar } from '@/components/ui/sidebar';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { ViewModeControl } from './controls/ViewModeControl';
import { handleBounds } from './utils/mapUtils';
import { ActivityCards } from '@/components/ActivityCards';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { AddWaypointControl } from './controls/AddWaypointControl';
import { CrosshairOverlay } from './controls/CrosshairOverlay';

declare global {
	interface Window {
		mapInstance: any;
	}
}

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
	handleWaypointSelect,
	selectedWaypoint: parentSelectedWaypoint,
	setActiveItem,
	setShowDetailsDrawer,
	activeItem,
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
	activeItem: string;
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
	const [waypointsVisible, setWaypointsVisible] = useState(true);
	const [routesVisible, setRoutesVisible] = useState(true);

	const { availableLayers, initialMapState, mapStyle, mapSettings } = useMapConfig({ mapRef });

	const { currentBaseLayer, overlayStates, handleLayerToggle } = useMapLayers({ mapRef });

	const getVisibleFeatures = useCallback(() => {
		if (!mapRef.current) return { activities: [], routes: [], waypoints: [] };
		const map = mapRef.current.getMap();

		const activityFeatures = map.queryRenderedFeatures(
			[
				[0, 0],
				[map.getCanvas().width, map.getCanvas().height],
			],
			{
				layers: ['foot-sports', 'cycle-sports', 'water-sports', 'winter-sports', 'other-sports'],
			}
		);

		const routeFeatures = map.queryRenderedFeatures(
			[
				[0, 0],
				[map.getCanvas().width, map.getCanvas().height],
			],
			{
				layers: ['saved-routes-layer', 'saved-routes-border'],
			}
		);

		const waypointFeatures = map.queryRenderedFeatures(
			[
				[0, 0],
				[map.getCanvas().width, map.getCanvas().height],
			],
			{
				layers: ['waypoints-layer'],
			}
		);

		return {
			activities: activityFeatures,
			routes: routeFeatures,
			waypoints: waypointFeatures,
		};
	}, []);

	const updateVisibleIds = useCallback(() => {
		const { activities, routes, waypoints } = getVisibleFeatures();

		const visibleActivityIds = activities.map((feature) => feature.properties?.id).filter((id) => id != null);

		const visibleRouteIds = routes.map((feature) => feature.properties?.id).filter((id) => id != null);

		const visibleWaypointIds = waypoints.map((feature) => feature.properties?.id).filter((id) => id != null);

		setLocalVisibleActivitiesId(visibleActivityIds);
		setVisibleActivitiesId(visibleActivityIds);
		setVisibleRoutesId(visibleRouteIds);
		setVisibleWaypointsId(visibleWaypointIds);
	}, [getVisibleFeatures, setVisibleActivitiesId]);

	// Update visible features when the map moves or loads
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const handleMapUpdate = () => {
			updateVisibleIds();
		};

		map.on('moveend', handleMapUpdate);
		map.on('load', handleMapUpdate);

		return () => {
			map.off('moveend', handleMapUpdate);
			map.off('load', handleMapUpdate);
		};
	}, [updateVisibleIds]);

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
	});

	useEffect(() => {
		if (mapRef.current && onMapLoad) {
			const map = mapRef.current.getMap();
			onMapLoad(map);

			// Wait for the map to be idle before updating visible activities
			const onIdle = () => {
				updateVisibleIds();
				map.off('idle', onIdle);
			};
			map.on('idle', onIdle);
		}
	}, [onMapLoad, updateVisibleIds]);

	useEffect(() => {
		if (selectedRouteId === null) {
			setSelectedRoute(null);
		} else {
			const route = routes?.find((r) => r.id === selectedRouteId);
			if (route) {
				setSelectedRoute(route);
			}
		}
	}, [selectedRouteId, routes]);

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
		if (mapRef.current) {
			const map = mapRef.current.getMap();
			const resizeHandler = () => {
				map.resize();
			};
			map.on('idle', resizeHandler);

			// Cleanup
			return () => {
				map.off('idle', resizeHandler);
			};
		}
	}, [isSidebarOpen]);

	// Initialize map controls
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		if (is3DMode && !isMobile) {
			map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
			map.touchZoomRotate.enableRotation();
			map.touchPitch.enable();
		} else {
			map.setTerrain(null);
			map.setPitch(0);
			map.touchZoomRotate.disableRotation();
			map.touchPitch.disable();
		}
	}, [is3DMode, isMobile]);

	const toggleViewMode = useCallback(() => {
		if (isMobile) return; // Prevent toggling on mobile
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();
		const newMode = !is3DMode;
		setIs3DMode(newMode);

		if (newMode) {
			// Enable 3D mode
			map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
		} else {
			// Enable 2D mode
			map.setTerrain(null);
			map.setPitch(0);
		}
	}, [is3DMode, isMobile]);

	useEffect(() => {
		setSelectedWaypoint(parentSelectedWaypoint || null);
	}, [parentSelectedWaypoint]);

	const handleActivityHighlight = useCallback(
		(activity: Activity) => {
			setSelectedActivity(activity);
			setSelectedRouteId(activity.id);
		},
		[setSelectedRouteId]
	);

	const handleRouteHighlight = useCallback(
		(route: DbRoute) => {
			setSelectedRoute(route);
			setSelectedRouteId(route.id);
		},
		[setSelectedRouteId]
	);

	const handleWaypointHighlight = useCallback((waypoint: Waypoint) => {
		setSelectedWaypoint(waypoint);
	}, []);

	const handleActivitySelect = useCallback(
		(activity: Activity) => {
			handleActivityHighlight(activity);
			onActivitySelect?.(activity);
		},
		[handleActivityHighlight, onActivitySelect]
	);

	const handleTouchStart = useCallback((e: MapLayerTouchEvent) => {
		// Only handle basic touch events
	}, []);

	const handleTouchEnd = useCallback(
		(e: MapLayerTouchEvent) => {
			if (isDrawing) return;

			// Handle normal touch interactions (your existing touch end code)
			if (!mapRef.current) return;
			const map = mapRef.current.getMap();
			const point = e.point;

			const features = map.queryRenderedFeatures(point, {
				layers: [
					'foot-sports',
					'cycle-sports',
					'water-sports',
					'winter-sports',
					'other-sports',
					'waypoints-layer',
					'waypoints-layer-touch',
					'saved-routes-layer',
					'saved-routes-border',
				],
			});

			console.log('Debug waypoints:', {
				waypoints,
				waypointFeatures: map.queryRenderedFeatures(
					[
						[0, 0],
						[map.getCanvas().width, map.getCanvas().height],
					],
					{
						layers: ['waypoints-layer', 'waypoints-layer-touch'],
					}
				),
				clickPoint: point,
				allFeatures: features,
				waypointSource: map.getSource('waypoints'),
			});

			// Clear all selections first
			setSelectedRouteId(null);
			setSelectedRoute(null);
			onRouteSelect?.(null);
			onActivitySelect?.(null);
			handleWaypointSelect?.(null);

			if (features.length === 0) return;

			const feature = features[0];
			const properties = feature.properties;

			if (!properties) return;

			// Handle activity touches
			if (properties.isActivity || (feature.layer && feature.layer.id.endsWith('-touch'))) {
				const activity = activities.find((a) => a.id === properties.id);
				if (activity) {
					setSelectedRouteId(activity.id);
					onActivitySelect?.(activity);
					if (isMobile) {
						setActiveItem('nearby');
						setShowDetailsDrawer(true);
					}
				}
				return;
			}

			// Handle route touches
			if (
				feature.layer &&
				(feature.layer.id === 'saved-routes-layer' ||
					feature.layer.id === 'saved-routes-border' ||
					feature.layer.id === 'saved-routes-touch')
			) {
				const route = routes?.find((r) => r.id === properties.id);
				if (route) {
					setSelectedRouteId(route.id);
					setSelectedRoute(route);
					onRouteSelect?.(route);
					if (isMobile) {
						setActiveItem('nearby');
						setShowDetailsDrawer(true);
					}
				}
				return;
			}

			// Handle waypoint touches
			if (feature.layer && (feature.layer.id === 'waypoints-layer' || feature.layer.id === 'waypoints-layer-touch')) {
				const waypoint = waypoints?.find((w) => w.id === properties.id);
				if (waypoint) {
					handleWaypointSelect?.(waypoint);
					if (isMobile) {
						setActiveItem('nearby');
						setShowDetailsDrawer(true);
					}
				}
				return;
			}
		},
		[
			isDrawing,
			activities,
			routes,
			waypoints,
			setSelectedRouteId,
			onRouteSelect,
			onActivitySelect,
			handleWaypointSelect,
			isMobile,
			setActiveItem,
			setShowDetailsDrawer,
		]
	);

	const handleWaypointPlacementConfirm = useCallback(() => {
		if (!mapRef.current) return;
		const center = mapRef.current.getMap().getCenter();
		setNewWaypointCoords([center.lng, center.lat]);
		setShowWaypointDialog(true);
		setIsAddingWaypoint(false);
	}, []);

	// Update map center when the map moves
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const handleMapMove = () => {
			const center = map.getCenter();
			console.log('Map moved to:', { lat: center.lat, lng: center.lng });
			setMapCenter({ lat: center.lat, lng: center.lng });
		};

		// Update initial center
		handleMapMove();

		map.on('moveend', handleMapMove);
		return () => {
			map.off('moveend', handleMapMove);
		};
	}, []);

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

	return (
		<div className="absolute inset-0">
			<Map
				ref={mapRef as React.RefObject<MapRef>}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				initialViewState={initialMapState}
				style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
				mapStyle={mapStyle}
				onMoveEnd={() => updateVisibleIds()}
				onMouseMove={onHover}
				onClick={(e) => {
					if (isDrawing) return;

					const features = e.features || [];

					// Clear all selections first
					setSelectedRouteId(null);
					setSelectedRoute(null);
					onRouteSelect?.(null);
					onActivitySelect?.(null);
					handleWaypointSelect?.(null);

					if (features.length === 0) {
						return;
					}

					const feature = features[0]; // Only handle the topmost feature
					const properties = feature.properties;

					if (!properties) return;

					// Handle activity clicks
					if (properties.isActivity) {
						const activity = activities.find((a) => a.id === properties.id);
						if (activity) {
							setSelectedRouteId(activity.id);
							onActivitySelect?.(activity);
						}
						return;
					}

					// Handle route clicks
					if (
						feature.layer &&
						(feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border')
					) {
						const route = routes?.find((r) => r.id === properties.id);
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
					if (
						feature.layer &&
						(feature.layer.id === 'waypoints-layer' || feature.layer.id === 'waypoints-layer-touch')
					) {
						const waypoint = waypoints?.find((w) => w.id === properties.id);
						if (waypoint) {
							handleWaypointSelect?.(waypoint);
						}
						return;
					}
				}}
				onContextMenu={(e) => {
					if (isDrawing) return;
					if (!isMobile) {
						// Only handle right-click on desktop
						e.preventDefault();
						const coords = e.lngLat;
						setNewWaypointCoords([coords.lng, coords.lat]);
						setShowWaypointDialog(true);
					}
				}}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				interactiveLayerIds={[
					'foot-sports',
					'foot-sports-touch',
					'cycle-sports',
					'cycle-sports-touch',
					'water-sports',
					'water-sports-touch',
					'winter-sports',
					'winter-sports-touch',
					'other-sports',
					'other-sports-touch',
					'waypoints-layer',
					'waypoints-layer-touch',
					'saved-routes-layer',
					'saved-routes-border',
					'saved-routes-touch',
				]}
				renderWorldCopies={false}
				maxTileCacheSize={50}
				trackResize={false}
				dragRotate={is3DMode}
				pitchWithRotate={is3DMode}
				dragPan={true}
				touchZoomRotate={true}
				touchPitch={false}
				maxPitch={isMobile ? 0 : 85}
				minPitch={0}
				keyboard={true}
				onLoad={(evt) => {
					const map = evt.target;
					// Store map instance globally
					window.mapInstance = map;

					if (onMapLoad) {
						onMapLoad(map);
					}
					// Only enable touch controls if 3D mode is on
					if (is3DMode && !isMobile) {
						map.touchZoomRotate.enableRotation();
						map.touchPitch.enable();
					} else {
						map.touchZoomRotate.disableRotation();
						map.touchPitch.disable();
					}
				}}
				terrain={is3DMode && !isMobile ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
			>
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
					waypointsVisible={waypointsVisible}
					routesVisible={routesVisible}
					onWaypointsToggle={setWaypointsVisible}
					onRoutesToggle={setRoutesVisible}
					activeItem={activeItem}
				/>

				<AddWaypointControl isActive={isAddingWaypoint} onClick={() => setIsAddingWaypoint(!isAddingWaypoint)} />

				<TerrainLayer overlayStates={overlayStates} />

				<ActivityLayers
					activities={activities}
					selectedRouteId={selectedRouteId}
					selectedCategories={selectedCategories}
				/>

				<RouteLayer routes={localRoutes} selectedRoute={selectedRoute} visible={routesVisible} />

				<WaypointLayer waypoints={waypoints} selectedWaypoint={selectedWaypoint} visible={waypointsVisible} />

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
					<CrosshairOverlay onConfirm={handleWaypointPlacementConfirm} onCancel={() => setIsAddingWaypoint(false)} />
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
					onRouteSelect={(route) => {
						setSelectedRouteId(route.id);
						setSelectedRoute(route);
						onRouteSelect?.(route);
						if ('coordinates' in route.geometry) {
							handleBounds(mapRef as React.RefObject<MapRef>, route.geometry.coordinates as [number, number][]);
						}
					}}
					onWaypointSelect={(waypoint) => {
						handleWaypointSelect?.(waypoint);
						if (mapRef.current && waypoint.coordinates) {
							mapRef.current.getMap().flyTo({
								center: waypoint.coordinates as [number, number],
								zoom: 14,
							});
						}
					}}
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

const mapSettings = (isDrawing: boolean) => ({
	renderWorldCopies: false,
	maxTileCacheSize: 50,
	trackResize: false,
	dragRotate: true,
	pitchWithRotate: true,
	dragPan: true,
	touchZoomRotate: true,
	touchPitch: true,
	interactiveLayerIds: isDrawing
		? []
		: [
				'waypoints-layer',
				'foot-sports',
				'cycle-sports',
				'water-sports',
				'winter-sports',
				'other-sports',
				'unknown-sports',
				'saved-routes-layer',
				'saved-routes-border',
			],
});
