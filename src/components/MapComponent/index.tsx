'use client';
import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Source, Layer, MapLayerTouchEvent, GeolocateControl, NavigationControl, MapRef } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import type { MapLayerMouseEvent } from 'react-map-gl';
import type { StyleSpecification } from 'mapbox-gl';
import type { DrawnRoute } from '@/types/route';
import type { Waypoint } from '@/types/waypoint';
import type { Activity, HoverInfo } from '@/types/activity';
import { useAuth } from '@/contexts/AuthContext';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
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
import Image from 'next/image';
import { DNTCabinLayer } from './layers/DNTCabinLayer';
import { useDNTCabins } from './hooks/useDNTCabins';
import { mapLayers } from './config/mapLayers';
import { SearchBox } from './controls/SearchBox';
import { ActivityCategory } from '@/lib/categories';

declare global {
	interface Window {
		mapInstance: any;
	}
}

interface MapComponentProps {
	activities: Activity[];
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	setVisibleRoutesId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
	setVisibleWaypointsId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
	selectedRouteId: string | number | null;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	onMapLoad: (map: mapboxgl.Map) => void;
	onRouteSelect: (route: DbRoute | null) => void;
	onRouteSave: (route: DbRoute) => void;
	routes: DbRoute[];
	waypoints: DbWaypoint[];
	onWaypointSave: (waypoint: DbWaypoint) => void;
	onActivitySelect: (activity: Activity | null) => void;
	handleWaypointSelect: (waypoint: DbWaypoint | null) => void;
	selectedWaypoint: DbWaypoint | null;
	setActiveItem: (item: string) => void;
	setShowDetailsDrawer: (show: boolean) => void;
	activeItem: string;
	selectedCategories: ActivityCategory[];
	setSelectedCategories: React.Dispatch<React.SetStateAction<ActivityCategory[]>>;
}

export const MapComponent = ({
	activities,
	setVisibleActivitiesId,
	setVisibleRoutesId,
	setVisibleWaypointsId,
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
	selectedCategories,
	setSelectedCategories,
}: MapComponentProps) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapRef>();
	const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<DbRoute | null>(null);
	const [localRoutes, setLocalRoutes] = useState<DbRoute[]>(routes || []);
	const [newWaypointCoords, setNewWaypointCoords] = useState<[number, number] | null>(null);
	const [newWaypointName, setNewWaypointName] = useState('');
	const [showWaypointDialog, setShowWaypointDialog] = useState(false);
	const [isDrawing, setIsDrawing] = useState(false);
	const { user } = useAuth();
	const { open: isSidebarOpen } = useSidebar();
	const { isMobile } = useResponsiveLayout();
	const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
	const [is3DMode, setIs3DMode] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
	const [localVisibleActivitiesId, setLocalVisibleActivitiesId] = useState<number[]>([]);
	const [localVisibleRoutesId, setLocalVisibleRoutesId] = useState<(string | number)[]>([]);
	const [localVisibleWaypointsId, setLocalVisibleWaypointsId] = useState<(string | number)[]>([]);
	const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [mapCenter, setMapCenter] = useState({ lat: 61.375172, lng: 8.296987 });
	const [waypointsVisible, setWaypointsVisible] = useState(true);
	const [routesVisible, setRoutesVisible] = useState(true);
	const [touchStartPoint, setTouchStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [touchStartTime, setTouchStartTime] = useState<number | null>(null);

	const { availableLayers, initialMapState, mapStyle, mapSettings } = useMapConfig({ mapRef });
	const { currentBaseLayer, overlayStates, handleLayerToggle } = useMapLayers({ mapRef });
	const { isVisible: dntCabinsVisible, toggleVisibility: toggleDNTCabins } = useDNTCabins({ mapRef });

	const getVisibleFeatures = useCallback(() => {
		if (!mapRef.current) return { activities: [], routes: [], waypoints: [] };
		const map = mapRef.current.getMap();

		// Get the current bounds with a small buffer
		const bounds = map.getBounds();
		if (!bounds) return { activities: [], routes: [], waypoints: [] };

		const sw = bounds.getSouthWest();
		const ne = bounds.getNorthEast();

		// Add a 10% buffer to the bounds
		const buffer = {
			lng: Math.abs(ne.lng - sw.lng) * 0.1,
			lat: Math.abs(ne.lat - sw.lat) * 0.1,
		};

		// Convert geographic coordinates to screen coordinates
		const swPoint = map.project([sw.lng - buffer.lng, sw.lat - buffer.lat]);
		const nePoint = map.project([ne.lng + buffer.lng, ne.lat + buffer.lat]);

		const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
			[swPoint.x, swPoint.y],
			[nePoint.x, nePoint.y],
		];

		const activityLayers = ['foot-sports', 'cycle-sports', 'water-sports', 'winter-sports', 'other-sports'];
		const routeLayers = ['saved-routes-layer', 'saved-routes-border'];
		const waypointLayers = ['waypoints-layer'];

		// Only query layers that exist
		const activityFeatures = activityLayers.some((layer) => map.getLayer(layer))
			? map.queryRenderedFeatures(bbox, { layers: activityLayers })
			: [];

		const routeFeatures = routeLayers.some((layer) => map.getLayer(layer))
			? map.queryRenderedFeatures(bbox, { layers: routeLayers })
			: [];

		const waypointFeatures = waypointLayers.some((layer) => map.getLayer(layer))
			? map.queryRenderedFeatures(bbox, { layers: waypointLayers })
			: [];

		return {
			activities: activityFeatures,
			routes: routeFeatures,
			waypoints: waypointFeatures,
		};
	}, []);

	const updateVisibleIds = useCallback(() => {
		const { activities, routes, waypoints } = getVisibleFeatures();

		const visibleActivityIds = activities
			.map((feature) => feature.properties?.id)
			.filter((id) => id != null)
			.map(Number);

		const visibleRouteIds = routes.map((feature) => feature.properties?.id).filter((id) => id != null);

		const visibleWaypointIds = waypoints.map((feature) => feature.properties?.id).filter((id) => id != null);

		setLocalVisibleActivitiesId(visibleActivityIds);
		setVisibleActivitiesId(visibleActivityIds);
		setLocalVisibleRoutesId(visibleRouteIds);
		setVisibleRoutesId(visibleRouteIds);
		setLocalVisibleWaypointsId(visibleWaypointIds);
		setVisibleWaypointsId(visibleWaypointIds);
	}, [getVisibleFeatures, setVisibleActivitiesId, setVisibleRoutesId, setVisibleWaypointsId]);

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
		handleWaypointSelect,
		onActivitySelect,
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

	const updateMapControls = useCallback(
		(map: mapboxgl.Map) => {
			if (is3DMode) {
				// Enable 3D mode
				map.dragRotate.enable();
				map.touchZoomRotate.enableRotation();
				map.touchPitch.enable();
				map.setMaxPitch(85);
				map.easeTo({ pitch: 30, duration: 1000 });
			} else {
				// Disable 3D mode but keep rotation enabled
				map.dragRotate.enable();
				map.touchZoomRotate.enableRotation();
				map.touchPitch.disable();
				map.setMaxPitch(0);
				map.easeTo({ pitch: 0, duration: 1000 });
			}
		},
		[is3DMode]
	);

	// Update controls when mode changes
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();
		updateMapControls(map);
	}, [is3DMode, updateMapControls]);

	const toggleViewMode = useCallback(() => {
		if (!mapRef.current) return;

		// Just toggle the mode - useEffect will handle the rest
		setIs3DMode(!is3DMode);
	}, [is3DMode]);

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
		setTouchStartPoint({ x: e.point.x, y: e.point.y });
		setTouchStartTime(Date.now());
	}, []);

	const handleTouchEnd = useCallback(
		(e: MapLayerTouchEvent) => {
			if (isDrawing) return;

			// Check if this was a drag or a tap
			if (touchStartPoint && touchStartTime) {
				const dx = e.point.x - touchStartPoint.x;
				const dy = e.point.y - touchStartPoint.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const duration = Date.now() - touchStartTime;

				// Reset touch tracking
				setTouchStartPoint(null);
				setTouchStartTime(null);

				// If moved more than 10 pixels or took longer than 300ms, treat as drag and ignore
				if (distance > 10 || duration > 300) {
					return;
				}

				// Add a small delay to ensure map has finished moving
				setTimeout(() => {
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
							'foot-sports-touch',
							'cycle-sports-touch',
							'water-sports-touch',
							'winter-sports-touch',
							'other-sports-touch',
							'waypoints-layer',
							'waypoints-layer-touch',
							'saved-routes-layer',
							'saved-routes-border',
							'saved-routes-touch',
						],
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
					if ((properties.isActivity && feature.layer) || feature.layer?.id.endsWith('-sports')) {
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
					if (
						feature.layer &&
						(feature.layer.id === 'waypoints-layer' || feature.layer.id === 'waypoints-layer-touch')
					) {
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
				}, 50);
			}
		},
		[
			isDrawing,
			touchStartPoint,
			touchStartTime,
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
			mapRef,
		]
	);

	const handleWaypointPlacementConfirm = useCallback(() => {
		if (!mapRef.current) return;
		const center = mapRef.current.getMap().getCenter();
		setNewWaypointCoords([center.lng, center.lat]);
		setShowWaypointDialog(true);
		setIsAddingWaypoint(false);
		window.dispatchEvent(new CustomEvent('waypoint-dialog-open'));
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

	// Cursor management
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();
		const canvas = map.getCanvas();

		// Disable default map interactions when in waypoint mode
		if (isAddingWaypoint && !isMobile) {
			map.dragPan.disable();
			map.dragRotate.disable();
			map.doubleClickZoom.disable();
			canvas.style.cursor = 'crosshair';
			map.getCanvas().classList.add('crosshair-cursor');
		} else {
			map.dragPan.enable();
			map.dragRotate.enable();
			map.doubleClickZoom.enable();
			canvas.style.cursor = '';
			map.getCanvas().classList.remove('crosshair-cursor');
		}

		return () => {
			map.dragPan.enable();
			map.dragRotate.enable();
			map.doubleClickZoom.enable();
			canvas.style.cursor = '';
			map.getCanvas().classList.remove('crosshair-cursor');
		};
	}, [isAddingWaypoint, isMobile]);

	return (
		<div
			ref={mapContainerRef}
			className="fixed inset-0 w-full h-[100dvh] overflow-hidden md:relative"
			style={{
				touchAction: 'none',
			}}
		>
			<div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-lg shadow-sm hidden md:block">
				<Image
					src="/api_logo_cptblWith_strava_horiz_light.svg"
					alt="Strava API"
					width={100}
					height={15}
					priority
					className="w-auto h-auto"
				/>
			</div>
			<SearchBox mapRef={mapRef as React.RefObject<MapRef>} />
			<Map
				ref={mapRef as React.RefObject<MapRef>}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				initialViewState={initialMapState}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
				}}
				mapStyle={mapStyle}
				onMoveEnd={() => updateVisibleIds()}
				onMouseMove={onHover}
				onClick={onClick}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				{...mapSettings(isDrawing, is3DMode)}
				onLoad={(evt) => {
					const map = evt.target;
					window.mapInstance = map;

					if (onMapLoad) {
						onMapLoad(map);
					}

					// Initialize cursor behavior
					const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
						const canvas = map.getCanvas();
						if (isAddingWaypoint && !isMobile) {
							canvas.style.cursor = 'crosshair';
							return;
						}

						const features = map.queryRenderedFeatures(e.point, {
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
								'saved-routes-touch',
								'dnt-cabins',
								'dnt-cabins-touch',
							],
						});

						canvas.style.cursor = features.length > 0 ? 'pointer' : '';
					};

					map.on('mousemove', handleMouseMove);

					// Initialize controls after map is loaded
					requestAnimationFrame(() => {
						updateMapControls(map);
					});
				}}
			>
				<MapControls
					layers={availableLayers}
					currentBaseLayer={currentBaseLayer}
					overlayStates={overlayStates}
					onLayerToggle={handleLayerToggle}
					selectedCategories={selectedCategories}
					onCategoryToggle={(newCategories) => setSelectedCategories(newCategories as ActivityCategory[])}
					userId={user?.id || ''}
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
					dntCabinsVisible={dntCabinsVisible}
					onDNTCabinsToggle={toggleDNTCabins}
					activeItem={activeItem}
					onDrawToggle={setIsDrawing}
					isDrawing={isDrawing}
				/>

				<AddWaypointControl isActive={isAddingWaypoint} onClick={() => setIsAddingWaypoint(!isAddingWaypoint)} />

				<TerrainLayer is3DMode={is3DMode} />

				<ActivityLayers
					activities={activities}
					selectedRouteId={selectedRouteId}
					selectedCategories={selectedCategories}
				/>

				<RouteLayer routes={localRoutes} selectedRoute={selectedRoute} visible={routesVisible} />

				<WaypointLayer waypoints={waypoints} selectedWaypoint={selectedWaypoint} visible={waypointsVisible} />

				<DNTCabinLayer visible={dntCabinsVisible} />

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

				{isAddingWaypoint && isMobile && (
					<CrosshairOverlay onConfirm={handleWaypointPlacementConfirm} onCancel={() => setIsAddingWaypoint(false)} />
				)}
			</Map>

			{isMobile && !isAddingWaypoint && (
				<div className="fixed bottom-0 left-0 right-0 mb-[calc(4rem+env(safe-area-inset-bottom,0px))] z-[9]">
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
						visibleActivitiesId={localVisibleActivitiesId}
						visibleRoutesId={localVisibleRoutesId}
						visibleWaypointsId={localVisibleWaypointsId}
						mapCenter={mapCenter}
					/>
				</div>
			)}
		</div>
	);
};
