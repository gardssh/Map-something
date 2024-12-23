'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Map, { MapRef, Source, Layer } from 'react-map-gl';
import type { DbRoute } from '../../types/supabase';
import type { Activity } from '../../types/activity';
import type { Waypoint } from '../../types/waypoint';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { useMapEvents } from './hooks/useMapEvents';
import { useMapLayers } from './hooks/useMapLayers';
import { useMapConfig } from './hooks/useMapConfig';
import { MobileDrawer } from '../../components/MobileDrawer';
import { ActivityDetails } from '../../components/activities/ActivityDetails';
import { RouteDetails } from '../../components/routes/RouteDetails';
import { WaypointDetails } from '../../components/waypoints/WaypointDetails';
import { createClient } from '@supabase/supabase-js';

const INTERACTIVE_LAYER_IDS = ['activities-layer', 'saved-routes-layer', 'saved-routes-border', 'waypoints-layer'];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export const MapComponent = () => {
	const mapRef = useRef<MapRef | null>(null);
	const [selectedRouteId, setSelectedRouteId] = useState<string | number | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<DbRoute | null>(null);
	const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
	const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
	const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
	const [hoverInfo, setHoverInfo] = useState<any>(null);
	const [viewport, setViewport] = useState({
		longitude: 8.296987,
		latitude: 61.375172,
		zoom: 14,
		pitch: 0,
	});

	// Add state for map data
	const [activities, setActivities] = useState<Activity[]>([]);
	const [routes, setRoutes] = useState<DbRoute[]>([]);
	const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

	// Fetch data when component mounts
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch routes
				const { data: routesData, error: routesError } = await supabase.from('routes').select('*');
				if (routesError) throw routesError;
				if (routesData) {
					console.log('Fetched routes:', routesData);
					setRoutes(routesData);
				}

				// Fetch waypoints
				const { data: waypointsData, error: waypointsError } = await supabase.from('waypoints').select('*');
				if (waypointsError) throw waypointsError;
				if (waypointsData) {
					console.log('Fetched waypoints:', waypointsData);
					setWaypoints(waypointsData);
				}

				// Fetch activities
				const { data: activitiesData, error: activitiesError } = await supabase.from('strava_activities').select('*');
				if (activitiesError) throw activitiesError;
				if (activitiesData) {
					console.log('Fetched activities:', activitiesData);
					setActivities(activitiesData);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		fetchData();
	}, []);

	const onMove = useCallback((evt: any) => {
		setViewport(evt.viewState);
	}, []);

	const { mapStyle, mapSettings } = useMapConfig({ mapRef });
	const { layers } = useMapLayers({ mapRef });

	const { onHover, onClick } = useMapEvents({
		activities,
		routes,
		waypoints,
		setSelectedRouteId,
		setSelectedRoute,
		onRouteSelect: (route) => {
			setSelectedRoute(route);
			setShowDetailsDrawer(!!route);
		},
		setHoverInfo,
		isDrawing: false,
		mapRef,
		switchCoordinates: (activity) => ({ type: 'LineString', coordinates: [] }),
		handleWaypointSelect: (waypoint) => {
			setSelectedWaypoint(waypoint);
			setShowDetailsDrawer(!!waypoint);
		},
		onActivitySelect: (activity) => {
			setSelectedActivity(activity);
			setShowDetailsDrawer(!!activity);
		},
	});

	const handleMapClick = useCallback(
		(event: any) => {
			console.log('Raw click event detected!');
			console.log('Click coordinates:', event.lngLat);
			console.log('Full event:', event);

			// Get the clicked features
			const features = event.features || [];
			console.log('Number of features found:', features.length);

			if (features.length === 0) {
				console.log('No features found at click location');
				return;
			}

			const feature = features[0];
			console.log('Clicked feature:', feature);

			// Check if we clicked on a layer
			if (!feature.layer) {
				console.log('No layer information in feature');
				return;
			}

			switch (feature.layer.id) {
				case 'activities-layer':
					const activity = activities.find((a) => a.id === feature.properties.id);
					if (activity) {
						console.log('Found activity:', activity);
						setSelectedActivity(activity);
						setShowDetailsDrawer(true);
					}
					break;
				case 'saved-routes-layer':
					const route = routes.find((r) => r.id === feature.properties.id);
					if (route) {
						console.log('Found route:', route);
						setSelectedRoute(route);
						setShowDetailsDrawer(true);
					}
					break;
				case 'waypoints-layer':
					const waypoint = waypoints.find((w) => w.id === feature.properties.id);
					if (waypoint) {
						console.log('Found waypoint:', waypoint);
						setSelectedWaypoint(waypoint);
						setShowDetailsDrawer(true);
					}
					break;
				default:
					console.log('Clicked on unhandled layer:', feature.layer.id);
			}
		},
		[activities, routes, waypoints]
	);

	// Convert data to GeoJSON
	const activitiesGeoJSON: FeatureCollection = {
		type: 'FeatureCollection',
		features: activities.map((activity) => {
			const defaultGeometry: LineString = {
				type: 'LineString',
				coordinates: [],
			};
			const feature: Feature = {
				type: 'Feature',
				geometry: activity.map?.geometry || defaultGeometry,
				properties: {
					id: activity.id,
					name: activity.name,
					sport_type: activity.sport_type,
				},
			};
			return feature;
		}),
	};

	const routesGeoJSON: FeatureCollection = {
		type: 'FeatureCollection',
		features: routes.map((route) => {
			const feature: Feature = {
				type: 'Feature',
				geometry: route.geometry,
				properties: {
					id: route.id,
					name: route.name,
				},
			};
			return feature;
		}),
	};

	const waypointsGeoJSON: FeatureCollection = {
		type: 'FeatureCollection',
		features: waypoints.map((waypoint) => {
			const feature: Feature = {
				type: 'Feature',
				geometry: waypoint.geometry,
				properties: {
					id: waypoint.id,
					name: waypoint.name,
				},
			};
			return feature;
		}),
	};

	return (
		<div className="relative w-full h-full" onClick={() => console.log('Container div clicked!')}>
			<Map
				{...viewport}
				onMove={onMove}
				mapStyle={mapStyle}
				ref={mapRef}
				cursor="pointer"
				interactiveLayerIds={INTERACTIVE_LAYER_IDS}
				onClick={handleMapClick}
			>
				<Source id="activities" type="geojson" data={activitiesGeoJSON}>
					<Layer id="activities-layer" type="line" paint={{ 'line-color': '#ff4400', 'line-width': 2 }} />
				</Source>

				<Source id="saved-routes" type="geojson" data={routesGeoJSON}>
					<Layer id="saved-routes-layer" type="line" paint={{ 'line-color': '#0088ff', 'line-width': 2 }} />
				</Source>

				<Source id="waypoints" type="geojson" data={waypointsGeoJSON}>
					<Layer
						id="waypoints-layer"
						type="circle"
						paint={{
							'circle-radius': 6,
							'circle-color': '#00ff88',
							'circle-stroke-width': 2,
							'circle-stroke-color': '#ffffff',
						}}
					/>
				</Source>
			</Map>

			<MobileDrawer
				isOpen={showDetailsDrawer && (!!selectedActivity || !!selectedRoute || !!selectedWaypoint)}
				onClose={() => {
					setShowDetailsDrawer(false);
					setSelectedActivity(null);
					setSelectedRoute(null);
					setSelectedWaypoint(null);
				}}
				title={
					selectedActivity
						? 'Activity Details'
						: selectedRoute
							? 'Route Details'
							: selectedWaypoint
								? 'Waypoint Details'
								: ''
				}
			>
				{selectedActivity && <ActivityDetails activity={selectedActivity} />}
				{selectedRoute && <RouteDetails route={selectedRoute} />}
				{selectedWaypoint && <WaypointDetails waypoint={selectedWaypoint} />}
			</MobileDrawer>
		</div>
	);
};
