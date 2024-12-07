import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl';
import type { ControlPosition } from 'react-map-gl';
import type { DrawnRoute } from '@/types/route';
import * as turf from '@turf/turf';
import { useEffect, useState } from 'react';

type DrawControlProps = {
	position?: ControlPosition;
	displayControlsDefault?: boolean;
	controls?: {
		line_string?: boolean;
		trash?: boolean;
	};
	defaultMode?: string;
	onCreate?: (evt: { features: any[] }) => void;
	onUpdate?: (evt: { features: any[]; action: string }) => void;
	onDelete?: (evt: { features: any[] }) => void;
	onRouteSave?: (route: DrawnRoute) => void;
	onRouteAdd?: (route: DrawnRoute) => void;
};

const drawStyles = [
	{
		id: 'gl-draw-line',
		type: 'line',
		filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': '#ff0000',
			'line-width': 4,
		},
	},
	{
		id: 'gl-draw-point',
		type: 'circle',
		filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
		paint: {
			'circle-radius': 6,
			'circle-color': '#ff0000',
		},
	},
];

async function getMatch(start: [number, number], end: [number, number]) {
	const coordinates = `${start.join(',')};${end.join(',')}`;
	const query = await fetch(
		`https://api.mapbox.com/matching/v5/mapbox/walking/${coordinates}?geometries=geojson&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`,
		{ method: 'GET' }
	);
	const response = await query.json();

	if (response.code !== 'Ok') {
		console.error(`${response.code} - ${response.message}`);
		return null;
	}

	return response.matchings[0].geometry;
}

export default function DrawControl(props: DrawControlProps) {
	const [currentRoute, setCurrentRoute] = useState<[number, number][]>([]);

	const draw = useControl(
		() =>
			new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					line_string: true,
					trash: true,
					...props.controls,
				},
				defaultMode: 'simple_select',
				styles: drawStyles,
				...props,
			}) as any,
		({ map }) => {
			const mapInstance = (map as any).getMap();

			const processRoute = async (coords: [number, number][], featureId: string) => {
				let finalRoute: [number, number][] = [];

				for (let i = 0; i < coords.length - 1; i++) {
					const start = coords[i];
					const end = coords[i + 1];
					const matchedGeometry = await getMatch(start, end);

					if (matchedGeometry) {
						finalRoute.push(...matchedGeometry.coordinates);
					} else {
						finalRoute.push(start, end);
					}
				}

				// Remove duplicate points
				finalRoute = finalRoute.filter(
					(point, index, self) => index === 0 || !turf.booleanEqual(turf.point(point), turf.point(self[index - 1]))
				);

				setCurrentRoute(finalRoute);

				const newRoute: DrawnRoute = {
					id: `route-${Date.now()}`,
					name: `Route ${new Date().toLocaleDateString()}`,
					geometry: {
						type: 'LineString',
						coordinates: finalRoute,
					},
					createdAt: new Date().toISOString(),
					distance: turf.length(turf.lineString(finalRoute), { units: 'kilometers' }),
				};

				props.onRouteSave?.(newRoute);
				props.onRouteAdd?.(newRoute);

				// Delete the original drawn feature
				draw.delete(featureId);
			};

			mapInstance.on('draw.create', (e: any) => {
				const feature = e.features[0];
				const coords = feature.geometry.coordinates as [number, number][];
				processRoute(coords, feature.id);
			});

			mapInstance.on('draw.delete', props.onDelete || (() => {}));
		}
	);

	return null;
}

DrawControl.defaultProps = {
	onCreate: () => {},
	onUpdate: () => {},
	onDelete: () => {},
};
