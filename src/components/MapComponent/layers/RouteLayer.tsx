'use client';

import { Source, Layer } from 'react-map-gl';
import type { DbRoute } from '@/types/supabase';
import * as turf from '@turf/turf';

interface RouteLayerProps {
	routes: DbRoute[];
	selectedRoute: DbRoute | null;
	visible?: boolean;
}

export const RouteLayer = ({ routes, selectedRoute, visible = true }: RouteLayerProps) => {
	return (
		<Source
			id="saved-routes"
			type="geojson"
			data={{
				type: 'FeatureCollection',
				features:
					routes.map((route) => ({
						type: 'Feature',
						geometry: route.geometry,
						properties: {
							id: route.id.startsWith('route-') ? route.id : `route-${route.id}`,
							name: route.name,
							distance: turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' }),
							type: 'drawn-route',
						},
					})) || [],
			}}
		>
			{/* Touch layer with dim color for debugging */}
			<Layer
				id="saved-routes-touch"
				type="line"
				layout={{
					'line-join': 'round',
					'line-cap': 'round',
					visibility: visible ? 'visible' : 'none',
				}}
				paint={{
					'line-color': '#000000', // Back to black
					'line-width': [
						'interpolate',
						['linear'],
						['zoom'],
						0,
						30, // At zoom level 0, width is 30px
						10,
						40, // At zoom level 10, width is 40px
						15,
						50, // At zoom level 15, width is 50px
						20,
						60, // At zoom level 20, width is 60px
					],
					'line-opacity': 0, // Invisible again
				}}
			/>

			<Layer
				id="saved-routes-border"
				type="line"
				layout={{
					'line-join': 'round',
					'line-cap': 'round',
					visibility: visible ? 'visible' : 'none',
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
					visibility: visible ? 'visible' : 'none',
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
					visibility: visible ? 'visible' : 'none',
				}}
				paint={{
					'text-color': '#7B00D9',
					'text-opacity': 0.8,
				}}
			/>
		</Source>
	);
};
