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
	const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
	const [is3DMode, setIs3DMode] = useState(false);

	const { availableLayers, initialMapState, mapStyle, mapSettings, handlePitch } = useMapConfig({ mapRef });

	const { currentBaseLayer, overlayStates, handleLayerToggle } = useMapLayers({ mapRef });

	const getVisibleActivities = useCallback(() => {
		if (!mapRef.current) return [];
		const map = mapRef.current.getMap();

		const features = map.queryRenderedFeatures(undefined, {
			layers: ['foot-sports', 'cycle-sports', 'water-sports', 'winter-sports', 'other-sports'],
		});

		return features;
	}, []);

	const updateVisibleActivitiesIds = useCallback(() => {
		const visibleFeatures = getVisibleActivities();
		const visibleIds = visibleFeatures.map((feature) => feature.properties?.id).filter((id) => id != null);
		setVisibleActivitiesId(visibleIds);
	}, [getVisibleActivities, setVisibleActivitiesId]);

	// Update visible activities when the map moves or loads
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const handleMapUpdate = () => {
			updateVisibleActivitiesIds();
		};

		map.on('moveend', handleMapUpdate);
		map.on('load', handleMapUpdate);

		return () => {
			map.off('moveend', handleMapUpdate);
			map.off('load', handleMapUpdate);
		};
	}, [updateVisibleActivitiesIds]);

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
				updateVisibleActivitiesIds();
				map.off('idle', onIdle);
			};
			map.on('idle', onIdle);
		}
	}, [onMapLoad, updateVisibleActivitiesIds]);

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

	const toggleViewMode = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();
		if (!map.loaded()) return;
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
	}, [is3DMode]);

	useEffect(() => {
		setSelectedWaypoint(parentSelectedWaypoint || null);
	}, [parentSelectedWaypoint]);

	return (
		<div className="absolute inset-0">
			<Map
				ref={mapRef as React.RefObject<MapRef>}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				initialViewState={initialMapState}
				style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
				mapStyle={mapStyle}
				onMoveEnd={() => updateVisibleActivitiesIds()}
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
					if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
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
					if (feature.layer.id === 'waypoints-layer') {
						const waypoint = waypoints?.find((w) => w.id === properties.id);
						if (waypoint) {
							handleWaypointSelect?.(waypoint);
						}
						return;
					}
				}}
				onTouchStart={(e) => {
					// Don't prevent default touch behavior to allow map panning
				}}
				onTouchEnd={(e: MapLayerTouchEvent) => {
					if (isDrawing) return;

					// Get features at touch point
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
							'saved-routes-layer',
							'saved-routes-border',
						],
					});

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

					// Handle activity touches
					if (properties.isActivity) {
						const activity = activities.find((a) => a.id === properties.id);
						if (activity) {
							setSelectedRouteId(activity.id);
							onActivitySelect?.(activity);
						}
						return;
					}

					// Handle route touches
					if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
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

					// Handle waypoint touches
					if (feature.layer.id === 'waypoints-layer') {
						const waypoint = waypoints?.find((w) => w.id === properties.id);
						if (waypoint) {
							handleWaypointSelect?.(waypoint);
						}
						return;
					}
				}}
				onContextMenu={(e) => {
					e.preventDefault();
					if (!isDrawing) {
						setNewWaypointCoords([e.lngLat.lng, e.lngLat.lat]);
						setShowWaypointDialog(true);
					}
				}}
				interactiveLayerIds={[
					'foot-sports',
					'cycle-sports',
					'water-sports',
					'winter-sports',
					'other-sports',
					'waypoints-layer',
					'saved-routes-layer',
					'saved-routes-border',
				]}
				renderWorldCopies={false}
				maxTileCacheSize={50}
				trackResize={false}
				dragRotate={is3DMode}
				pitchWithRotate={is3DMode}
				dragPan={true}
				touchZoomRotate={true}
				touchPitch={is3DMode}
				onLoad={(evt) => {
					const map = evt.target;
					if (onMapLoad) {
						onMapLoad(map);
					}
				}}
				onPitch={(evt) => handlePitch(evt.viewState.pitch)}
				terrain={is3DMode ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
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
				/>

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
			</Map>
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
