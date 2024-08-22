'use client';
import Map, { GeolocateControl, NavigationControl, Source, Layer, Marker } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import { getActivityColor } from '@/lib/utils';
import { useRef } from 'react';
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
			layers: activities.map((activity) => {
				return 'route-' + activity.id;
			}),
		});
	};

	const updateVisibleActivities = () => {
		setVisibleActivities(getVisibleActivities().map((activity) => parseInt(activity.layer.id.replace('route-', ''))));
	};

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
			>
				<GeolocateControl position="bottom-right" />
				<NavigationControl position="bottom-right" />
				 {activities.length > 0 &&
					activities.map((activity) => (
						<Source
							key={activity.id}
							id={'route-' + activity.id}
							type="geojson"
							data={{
								type: 'Feature',
								properties: {},
								geometry: { type: 'LineString', coordinates: switchCoordinates(activity) },
							}}
						>
							<Layer
								id={'route-' + activity.id}
								type="line"
								layout={{ 'line-join': 'round', 'line-cap': 'round' }}
								paint={{ 'line-color': getActivityColor(activity.type), 'line-width': 8, 'line-opacity': 0.5 }}
							/>
						</Source>
					))} 
				{activities.length > 0 && activities.map((activity) => 
				<AddMarker key={activity.id} activity={activity}/>
				)}
			</Map>
		</div>
	);
};
