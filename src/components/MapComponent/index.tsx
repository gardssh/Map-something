'use client';
import Map, { GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl';
import { switchCoordinates } from '../activities/switchCor';
import { getActivityColor } from '@/lib/utils';

export const MapComponent = ({ activities }: { activities: any[] }) => {
	return (
		<div className="h-full w-full">
			<Map
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
				//mapLib={import('mapbox-gl')}
				initialViewState={{
					longitude: 8.296987,
					latitude: 61.375172,
					zoom: 14,
				}}
				style={{ width: '100%', height: '100%' }}
				mapStyle="mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm"
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
			</Map>
		</div>
	);
};
