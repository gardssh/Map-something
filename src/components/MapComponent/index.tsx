'use client';
import { useRef, useCallback, useState } from 'react';
import Map, { GeolocateControl, NavigationControl, Source, Layer, Marker, Popup } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import { categorizeActivity, getActivityColor } from '@/lib/utils';
import type { MapRef } from 'react-map-gl';
import AddMarker from './AddMarker';

export const MapComponent = ({
	activities,
	setVisibleActivities,
}: {
	activities: any[];
	setVisibleActivities: React.Dispatch<React.SetStateAction<number[]>>;
}) => {
	const mapRef = useRef<MapRef>();

	const getVisibleActivities = (): any[] => {
		// @ts-ignore
		return mapRef.current?.queryRenderedFeatures(undefined, {
			layers: ['foot-sports', 'cycle-sports', 'water-sports', 'other-sports', 'unknown-sports'],
		});
	};

	const updateVisibleActivities = () => {
		setVisibleActivities(getVisibleActivities().map((activity) => activity.id));
	};
	const [hoverInfo, setHoverInfo] = useState<any>(null);
	const onHover = useCallback((event: any) => {
		const activityLayer = event.features && event.features[0];
		console.log(activities);

		const activity = activityLayer ? activities.find((activity) => activity.id === activityLayer.id) : undefined;

		setHoverInfo({
			id: activity && activity.id,
			name: activity && activity.name,
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
		});
	}, []);

	const selectedActivityId = (hoverInfo && hoverInfo.id) || '';
	const selectedActivityName = (hoverInfo && hoverInfo.name) || '';

	return (
		<div className="h-full w-full">
			<Map
				// @ts-ignore
				ref={mapRef}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				//mapLib={import('mapbox-gl')}
				initialViewState={{
					longitude: 8.296987,
					latitude: 61.375172,
					zoom: 14,
				}}
				style={{ width: '100%', height: '100%' }}
				mapStyle="mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm"
				onMoveEnd={() => updateVisibleActivities()}
				onLoad={() => updateVisibleActivities()}
				onMouseMove={onHover}
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
						paint={{ 'line-color': '#FF5733', 'line-width': 8, 'line-opacity': 0.5 }}
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
