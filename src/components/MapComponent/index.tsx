'use client';
import { useRef, useCallback, useState, useEffect } from 'react';
import Map, { GeolocateControl, NavigationControl, Source, Layer, Popup } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import { categorizeActivity, getActivityColor } from '@/lib/utils';
import type { MapRef, MapMouseEvent } from 'react-map-gl';
import AddMarker from './AddMarker';

export const MapComponent = ({
	activities,
	setVisibleActivitiesId,
	selectedRouteId,
	setSelectedRouteId,
	onMapLoad,
}: {
	activities: any[];
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	selectedRouteId: number | null;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<number | null>>;
	onMapLoad?: (map: mapboxgl.Map) => void;
}) => {
	const mapRef = useRef<MapRef>();
	const [hoverInfo, setHoverInfo] = useState<any>(null);

	const getVisibleActivities = (): any[] => {
		// @ts-ignore
		return mapRef.current?.queryRenderedFeatures(undefined, {
			layers: ['foot-sports', 'cycle-sports', 'water-sports', 'winter-sports', 'other-sports', 'unknown-sports'],
		});
	};

	const updateVisibleActivitiesIds = () => {
		setVisibleActivitiesId(getVisibleActivities().map((activity) => activity.id));
	};

	const onHover = useCallback(
		(event: any) => {
			const activityLayer = event.features && event.features[0];
			const activity = activityLayer ? activities.find((activity) => activity.id === activityLayer.id) : undefined;

			setHoverInfo({
				id: activity && activity.id,
				name: activity && activity.name,
				longitude: event.lngLat.lng,
				latitude: event.lngLat.lat,
			});
		},
		[activities]
	);

	const selectedActivityId = (hoverInfo && hoverInfo.id) || '';
	const selectedActivityName = (hoverInfo && hoverInfo.name) || '';

	const onClick = useCallback(
		(event: MapMouseEvent) => {
			//@ts-ignore
			if (event.features.length > 0) setSelectedRouteId(event.features[0].id);
			else {
				setSelectedRouteId(null);
			}
		},
		[setSelectedRouteId]
	);

	useEffect(() => {
		if (mapRef.current) {
			const map = mapRef.current.getMap();
			if (onMapLoad) {
				onMapLoad(map);
			}
		}
	}, [onMapLoad]);

	return (
		<div className="h-full w-full">
			<Map
				ref={mapRef as React.RefObject<MapRef>}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				initialViewState={{
					longitude: 8.296987,
					latitude: 61.375172,
					zoom: 14,
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
				]}
			>
				<GeolocateControl position="bottom-right" />
				<NavigationControl position="bottom-right" />

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
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{
							'line-color': '#F85E00',
							'line-width': 8,
							'line-opacity': 0.8,
						}}
						filter={['==', 'Foot Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'cycle-sports'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{ 'line-color': '#33FF57', 'line-width': 8, 'line-opacity': 0.5 }}
						filter={['==', 'Cycle Sports', ['get', 'activityType']]}
					/>

					<Layer
						id={'water-sports'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{ 'line-color': '#3357FF', 'line-width': 8, 'line-opacity': 0.5 }}
						filter={['==', 'Water Sports', ['get', 'activityType']]}
					/>
					<Layer
						id={'winter-sports'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{ 'line-color': '#FF33A1', 'line-width': 8, 'line-opacity': 0.5 }}
						filter={['==', 'Winter Sports', ['get', 'activityType']]}
					/>
					<Layer
						id={'other-sports'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{ 'line-color': '#FFC300', 'line-width': 8, 'line-opacity': 0.5 }}
						filter={['==', 'Other Sports', ['get', 'activityType']]}
					/>
					<Layer
						id={'unknown-sports'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{ 'line-color': '#000000', 'line-width': 8, 'line-opacity': 0.5 }}
						filter={['==', 'Unknown Category', ['get', 'activityType']]}
					/>
					<Layer
						id={'selected-route'}
						type="line"
						layout={{ 'line-join': 'round', 'line-cap': 'round' }}
						paint={{
							'line-color': '#020122',
							'line-gap-width': 8,
							'line-width': 2,
							'line-opacity': 1,
						}}
						//@ts-ignore
						filter={['==', selectedRouteId, ['id']]}
					/>
					<Layer
						id={'symbol-layer'}
						type="symbol"
						source="route"
						layout={{
							'symbol-placement': 'line',
							'text-field': '▶',
							'text-size': 20,
							'symbol-spacing': 50,
							'text-keep-upright': false,
						}}
						paint={{
							'text-color': '#000000',
						}}
					/>
				</Source>

				{activities.length > 0 && activities.map((activity) => <AddMarker key={activity.id} activity={activity} />)}
				{selectedActivityId && (
					<Popup
						longitude={hoverInfo.longitude}
						latitude={hoverInfo.latitude}
						offset={[0, -10]}
						closeButton={false}
						className="activity-info"
					>
						Name: {selectedActivityName}
						<p> </p>
						ID: {selectedActivityId}
					</Popup>
				)}
			</Map>
		</div>
	);
};
