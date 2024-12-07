'use client';
import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { GeolocateControl, NavigationControl, Source, Layer, Popup } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import { categorizeActivity, getActivityColor } from '@/lib/utils';
import type { MapRef, MapMouseEvent } from 'react-map-gl';
import AddMarker from './AddMarker';
import { LngLatBounds } from 'mapbox-gl';
import { LayersControl } from './LayersControl';
import type { StyleSpecification } from 'mapbox-gl';
import DrawControl from './DrawControl';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import type { DrawnRoute } from '@/types/route';
import type { LineString } from 'geojson';

// Add a helper function to handle bounds
const handleBounds = (mapRef: React.RefObject<MapRef>, coordinates: [number, number][]) => {
	if (!mapRef.current) return;

	const bounds = coordinates.reduce(
		(bounds, coord) => bounds.extend(coord),
		new LngLatBounds(coordinates[0], coordinates[0])
	);

	mapRef.current.fitBounds(
		[
			[bounds.getWest(), bounds.getSouth()],
			[bounds.getEast(), bounds.getNorth()],
		],
		{ padding: 100, duration: 1000 }
	);
};

export const MapComponent = ({
	activities,
	setVisibleActivitiesId,
	selectedRouteId,
	setSelectedRouteId,
	onMapLoad,
	onRouteSelect,
	onRouteSave,
	routes,
}: {
	activities: any[];
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	selectedRouteId: number | null;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<number | null>>;
	onMapLoad?: (map: mapboxgl.Map) => void;
	onRouteSelect?: (route: DrawnRoute | null) => void;
	onRouteSave?: (route: DrawnRoute) => void;
	routes?: DrawnRoute[];
}) => {
	const mapRef = useRef<MapRef>();
	const [hoverInfo, setHoverInfo] = useState<any>(null);
	const [activeLayers, setActiveLayers] = useState<string[]>(['default', 'bratthet']);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);
	const [selectedRoute, setSelectedRoute] = useState<DrawnRoute | null>(null);
	const [localRoutes, setLocalRoutes] = useState<DrawnRoute[]>(routes || []);

	const availableLayers = [
		{ id: 'default', name: 'Default Map', isBase: true },
		{ id: 'satellite', name: 'Satellite', isBase: true },
		{ id: 'norge-topo', name: 'Norge Topo', isBase: true },
		{ id: 'bratthet', name: 'Slope Angle', isBase: false },
		{ id: 'snoskred', name: 'Snøskred Utløp', isBase: false },
	];

	const handleLayerToggle = (layerId: string, isVisible: boolean) => {
		if (mapRef.current) {
			setActiveLayers((prev) => {
				const newLayers = isVisible ? [...prev, layerId] : prev.filter((id) => id !== layerId);

				if (isVisible && availableLayers.find((l) => l.id === layerId)?.isBase) {
					return [layerId, ...prev.filter((id) => !availableLayers.find((l) => l.id === id)?.isBase)];
				}
				return newLayers;
			});

			if (layerId === 'bratthet' || layerId === 'snoskred') {
				mapRef.current.getMap().setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
			} else if (['satellite', 'norge-topo', 'default'].includes(layerId)) {
				const overlayStates = {
					bratthet: activeLayers.includes('bratthet'),
					snoskred: activeLayers.includes('snoskred'),
				};

				const norgeTopoStyle: StyleSpecification = {
					version: 8,
					sources: {
						'norge-topo': {
							type: 'raster',
							tiles: ['https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'],
							tileSize: 256,
							attribution: '&copy; <a href="http://www.kartverket.no/">Kartverket</a>',
						},
					},
					layers: [
						{
							id: 'norge-topo-layer',
							type: 'raster',
							source: 'norge-topo',
							paint: { 'raster-opacity': 1 },
						},
					],
				};

				const newStyle =
					layerId === 'satellite'
						? 'mapbox://styles/mapbox/satellite-v9'
						: layerId === 'norge-topo'
							? norgeTopoStyle
							: 'mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm';

				mapRef.current.getMap().setStyle(newStyle as string);

				mapRef.current.getMap().once('style.load', () => {
					mapRef.current?.getMap().addSource('bratthet', {
						type: 'raster',
						tiles: [
							'https://nve.geodataonline.no/arcgis/services/Bratthet/MapServer/WMSServer?service=WMS&request=GetMap&version=1.1.1&layers=Bratthet_snoskred&styles=&format=image/png&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&transparent=true',
						],
					});
					mapRef.current?.getMap().addLayer({
						id: 'bratthet',
						type: 'raster',
						source: 'bratthet',
						paint: { 'raster-opacity': 0.6 },
						layout: { visibility: overlayStates.bratthet ? 'visible' : 'none' },
					});

					mapRef.current?.getMap().addSource('snoskred', {
						type: 'raster',
						tiles: [
							'https://gis3.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox-epsg-3857}&bboxSR=EPSG:3857&imageSR=EPSG:3857&size=256,256&f=image&layers=show:0,1,2,3,4',
						],
					});
					mapRef.current?.getMap().addLayer({
						id: 'snoskred',
						type: 'raster',
						source: 'snoskred',
						paint: { 'raster-opacity': 0.6 },
						layout: { visibility: overlayStates.snoskred ? 'visible' : 'none' },
					});
				});
			}
		}
	};

	const getVisibleActivities = (): any[] => {
		// @ts-ignore
		return mapRef.current?.queryRenderedFeatures(undefined, {
			layers: [
				'foot-sports',
				'cycle-sports',
				'water-sports',
				'winter-sports',
				'other-sports',
				'unknown-sports',
				'saved-routes-layer',
				'saved-routes-border',
				'selected-route',
				'selected-route-border',
			],
		});
	};

	const updateVisibleActivitiesIds = () => {
		setVisibleActivitiesId(getVisibleActivities().map((activity) => activity.id));
	};

	const onHover = useCallback(
		(event: any) => {
			const feature = event.features && event.features[0];

			if (!feature) {
				setHoverInfo(null);
				return;
			}

			// Handle activity hover
			if (typeof feature.id === 'number') {
				const activity = activities.find((activity) => activity.id === feature.id);
				if (activity) {
					setHoverInfo({
						id: activity.id,
						name: activity.name,
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
				}
			}
			// Handle route hover
			else if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
				const route = routes?.find((r) => r.id === feature.properties.id);
				if (route) {
					setHoverInfo({
						id: route.id,
						name: route.name,
						longitude: event.lngLat.lng,
						latitude: event.lngLat.lat,
					});
				}
			}
		},
		[activities, routes]
	);

	const selectedActivityId = (hoverInfo && hoverInfo.id) || '';
	const selectedActivityName = (hoverInfo && hoverInfo.name) || '';

	const onClick = useCallback(
		(event: MapMouseEvent) => {
			//@ts-ignore
			const features = event.features;
			console.log('Clicked features:', features);

			if (features?.length > 0) {
				const feature = features[0];
				console.log('Selected feature:', feature);

				// Handle activity clicks
				if (typeof feature.id === 'number') {
					setSelectedRouteId(feature.id);
					setSelectedRoute(null);
					const selectedActivity = activities.find((activity) => activity.id === feature.id);
					if (selectedActivity) {
						const coordinates = switchCoordinates(selectedActivity);
						handleBounds(mapRef as React.RefObject<MapRef>, coordinates);
					}
				}
				// Handle drawn route clicks - check for layer.id instead of feature.id
				else if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
					console.log('Route properties:', feature.properties);
					const route = routes?.find((r) => r.id === feature.properties.id);
					console.log('Found route:', route);

					if (route) {
						setSelectedRouteId(null);
						setSelectedRoute(route);
						onRouteSelect?.(route);
						if ('coordinates' in route.geometry) {
							handleBounds(mapRef as React.RefObject<MapRef>, route.geometry.coordinates as [number, number][]);
						}
					}
				}
			} else {
				setSelectedRouteId(null);
				setSelectedRoute(null);
				onRouteSelect?.(null);
			}
		},
		[activities, routes, setSelectedRouteId, onRouteSelect]
	);

	useEffect(() => {
		if (mapRef.current) {
			const map = mapRef.current.getMap();
			if (onMapLoad) {
				onMapLoad(map);
			}
		}
	}, [onMapLoad]);

	useEffect(() => {
		if (mapRef.current) {
			const map = mapRef.current.getMap();
			map.on('style.load', () => {
				// Re-add your custom sources and layers here
				// This ensures they persist when switching base maps
			});
		}
	}, []);

	// Add a function to handle terrain changes
	const setTerrainExaggeration = (exaggeration: number) => {
		if (mapRef.current) {
			mapRef.current.getMap().setTerrain({
				source: 'mapbox-dem',
				exaggeration: exaggeration,
			});
		}
	};

	const onDrawCreate = useCallback((evt: { features: any[] }) => {
		console.log('draw.create', evt.features);
	}, []);

	const onDrawUpdate = useCallback((evt: { features: any[]; action: string }) => {
		console.log('draw.update', evt.features);
	}, []);

	const onDrawDelete = useCallback((evt: { features: any[] }) => {
		console.log('draw.delete', evt.features);
	}, []);

	useEffect(() => {
		console.log('Selected route:', selectedRoute);
	}, [selectedRoute]);

	useEffect(() => {
		setLocalRoutes(routes || []);
	}, [routes]);

	return (
		<div className="h-full w-full">
			<Map
				ref={mapRef as React.RefObject<MapRef>}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				initialViewState={{
					longitude: 8.296987,
					latitude: 61.375172,
					zoom: 14,
					pitch: 0,
				}}
				style={{ width: '100%', height: '100%' }}
				mapStyle="mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm"
				onMoveEnd={() => updateVisibleActivitiesIds()}
				onMouseMove={onHover}
				onClick={onClick}
				interactiveLayerIds={[
					'foot-sports',
					'cycle-sports',
					'water-sports',
					'winter-sports',
					'other-sports',
					'unknown-sports',
					'saved-routes-layer',
					'saved-routes-border',
				]}
				renderWorldCopies={false}
				maxTileCacheSize={50}
				trackResize={false}
				dragRotate={true}
				pitchWithRotate={true}
				dragPan={true}
				onPitch={(evt) => {
					// Adjust terrain exaggeration based on pitch
					if (evt.viewState.pitch === 0) {
						setTerrainExaggeration(0); // Flat when viewed from top
					} else {
						setTerrainExaggeration(1.5); // Normal exaggeration otherwise
					}
				}}
				terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
			>
<<<<<<< Updated upstream
=======
				<DrawControl
					position="top-left"
					displayControlsDefault={false}
					controls={{
						line_string: true,
						trash: true,
					}}
					//defaultMode="draw_line_string" // will use the one specified in the DrawControl component
					onCreate={onDrawCreate}
					onUpdate={onDrawUpdate}
					onDelete={onDrawDelete}
					onRouteSave={onRouteSave}
					onRouteAdd={(route) => setLocalRoutes((prev) => [...prev, route])}
				/>
>>>>>>> Stashed changes
				<GeolocateControl position="bottom-right" />
				<NavigationControl position="bottom-right" visualizePitch={true} showZoom={true} showCompass={true} />

				<Source
					id="mapbox-dem"
					type="raster-dem"
					url="mapbox://mapbox.mapbox-terrain-dem-v1"
					tileSize={512}
					maxzoom={14}
				/>

				<Source
					type="raster"
					tiles={[
						'https://nve.geodataonline.no/arcgis/services/Bratthet/MapServer/WMSServer?service=WMS&request=GetMap&version=1.1.1&layers=Bratthet_snoskred&styles=&format=image/png&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&transparent=true',
					]}
				>
					<Layer id={'bratthet'} type="raster" paint={{ 'raster-opacity': 0.6 }} />
				</Source>

				<Source
					type="raster"
					tiles={[
						'https://gis3.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox-epsg-3857}&bboxSR=EPSG:3857&imageSR=EPSG:3857&size=256,256&f=image&layers=show:0,1,2,3,4',
					]}
				>
					<Layer id={'snoskred'} type="raster" paint={{ 'raster-opacity': 0.6 }} layout={{ visibility: 'none' }} />
				</Source>

				<Source
					id={'routes'}
					type="geojson"
					data={{
						type: 'FeatureCollection',
						features: activities.map((activity) => {
							return {
								id: activity.id,
								type: 'Feature',
								properties: { activityType: categorizeActivity(activity.sport_type) },
								geometry: { type: 'LineString', coordinates: switchCoordinates(activity) },
								paint: { 'line-color': getActivityColor(activity.type), 'line-width': 8, 'line-opacity': 0.5 },
							};
						}),
					}}
				>
					<Layer
						id={'foot-sports'}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes('Foot Sports') ? 'visible' : 'none',
						}}
						paint={{
							'line-color': '#D14A00',
							'line-width': 3,
							'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
						}}
						filter={['==', 'Foot Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'cycle-sports'}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes('Cycle Sports') ? 'visible' : 'none',
						}}
						paint={{
							'line-color': '#2BD44A',
							'line-width': 3,
							'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
						}}
						filter={['==', 'Cycle Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'water-sports'}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes('Water Sports') ? 'visible' : 'none',
						}}
						paint={{
							'line-color': '#3357FF',
							'line-width': 3,
							'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
						}}
						filter={['==', 'Water Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'winter-sports'}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes('Winter Sports') ? 'visible' : 'none',
						}}
						paint={{
							'line-color': '#FF33A1',
							'line-width': 3,
							'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
						}}
						filter={['==', 'Winter Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'other-sports'}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes('Other Sports') ? 'visible' : 'none',
						}}
						paint={{
							'line-color': '#FFC300',
							'line-width': 3,
							'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
						}}
						filter={['==', 'Other Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'unknown-sports'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{ 'line-color': '#000000', 'line-width': 5, 'line-opacity': 0.5 }}
						filter={['==', 'Unknown Category', ['get', 'activityType']]}
					/>
					<Layer
						id={'selected-route-border'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{
							'line-color': [
								'match',
								['get', 'activityType'],
								'Foot Sports',
								'#B84400',
								'Cycle Sports',
								'#24B33C',
								'Water Sports',
								'#2440B3',
								'Winter Sports',
								'#B32470',
								'Other Sports',
								'#B38900',
								'#000000',
							],
							'line-width': 9,
							'line-opacity': 1,
						}}
						filter={['==', selectedRouteId, ['id']]}
					/>
					<Layer
						id={'selected-route'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{
							'line-color': [
								'match',
								['get', 'activityType'],
								'Foot Sports',
								'#F85E00',
								'Cycle Sports',
								'#33FF57',
								'Water Sports',
								'#3357FF',
								'Winter Sports',
								'#FF33A1',
								'Other Sports',
								'#FFC300',
								'#000000',
							],
							'line-width': 5,
							'line-opacity': 1,
						}}
						filter={['==', selectedRouteId, ['id']]}
					/>
					<Layer
						id={'symbol-layer'}
						type="symbol"
						source="route"
						layout={{
							'symbol-placement': 'line',
							'text-field': '▶',
							'text-size': 14,
							'symbol-spacing': 50,
							'text-keep-upright': false,
							visibility: selectedCategories.length > 0 ? 'visible' : 'none',
						}}
						paint={{
							'text-color': [
								'match',
								['get', 'activityType'],
								'Foot Sports',
								'#B84400',
								'Cycle Sports',
								'#24B33C',
								'Water Sports',
								'#2440B3',
								'Winter Sports',
								'#B32470',
								'Other Sports',
								'#B38900',
								'#000000',
							],
						}}
						filter={['in', ['get', 'activityType'], ['literal', selectedCategories]]}
					/>
				</Source>

				<Source
					id="saved-routes"
					type="geojson"
					data={{
						type: 'FeatureCollection',
						features:
							localRoutes.map((route) => ({
								type: 'Feature',
								geometry: route.geometry,
								properties: {
									id: route.id,
									name: route.name,
									distance: route.distance,
									type: 'drawn-route',
								},
							})) || [],
					}}
				>
					<Layer
						id="saved-routes-border"
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
						}}
						paint={{
							'line-color': '#7B00D9',
							'line-width': ['case', ['==', ['get', 'id'], selectedRoute?.id || ''], 9, 3],
							'line-opacity': 0.8,
						}}
					/>

					<Layer
						id="saved-routes-layer"
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
						}}
						paint={{
							'line-color': '#A020F0',
							'line-width': ['case', ['==', ['get', 'id'], selectedRoute?.id || ''], 5, 3],
							'line-opacity': 0.8,
						}}
					/>

					<Layer
						id="saved-routes-symbols"
						type="symbol"
						layout={{
							'symbol-placement': 'line',
							'text-field': '▶',
							'text-size': 14,
							'symbol-spacing': 50,
							'text-keep-upright': false,
						}}
						paint={{
							'text-color': '#7B00D9',
							'text-opacity': 0.8,
						}}
					/>
				</Source>

				{activities.length > 0 &&
					activities
						.filter((activity) => selectedCategories.includes(categorizeActivity(activity.sport_type)))
						.map((activity) => <AddMarker key={activity.id} activity={activity} />)}
				{hoverInfo && (
					<Popup
						longitude={hoverInfo.longitude}
						latitude={hoverInfo.latitude}
						offset={[0, -10] as [number, number]}
						closeButton={false}
						className="activity-info"
					>
						Name: {hoverInfo.name}
						<p> </p>
						ID: {hoverInfo.id}
					</Popup>
				)}
			</Map>
			<LayersControl
				layers={availableLayers}
				activeLayers={activeLayers}
				onLayerToggle={handleLayerToggle}
				selectedCategories={selectedCategories}
				onCategoryToggle={setSelectedCategories}
			/>
		</div>
	);
};
