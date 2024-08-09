'use client';
import { useEffect } from 'react';
import Map, { GeolocateControl, NavigationControl } from 'react-map-gl';

export const MapComponent = () => {

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
			</Map>
		</div>
	);
};
