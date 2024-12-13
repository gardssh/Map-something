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
	className?: string;
	onCreate?: (evt: { features: any[] }) => void;
	onUpdate?: (evt: { features: any[]; action: string }) => void;
	onDelete?: (evt: { features: any[] }) => void;
	onRouteSave?: (route: DrawnRoute) => void;
	onRouteAdd?: (route: DrawnRoute) => void;
	onModeChange?: (evt: { mode: string }) => void;
	userId: string;
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

function distanceInMeters(coord1: [number, number], coord2: [number, number]) {
	const lon1 = (coord1[0] * Math.PI) / 180;
	const lat1 = (coord1[1] * Math.PI) / 180;
	const lon2 = (coord2[0] * Math.PI) / 180;
	const lat2 = (coord2[1] * Math.PI) / 180;
	const R = 6371e3; // Earth's radius in meters
	const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
	const y = lat2 - lat1;
	return Math.sqrt(x * x + y * y) * R;
}

function createHybridRoute(original: [number, number][], matched: [number, number][]) {
	const thresholdMeters = 50; // Adjust this value (in meters) based on your needs
	let hybridRoute = [];
	let matchedIndex = 0;

	for (let i = 0; i < original.length; i++) {
		if (matchedIndex < matched.length && distanceInMeters(original[i], matched[matchedIndex]) < thresholdMeters) {
			hybridRoute.push(matched[matchedIndex]);
			matchedIndex++;
		} else {
			hybridRoute.push(original[i]);
		}
	}

	return hybridRoute;
}

async function getMatch(coordinates: [number, number][]): Promise<[number, number][] | null> {
	try {
		const coords = coordinates.map(coord => coord.join(',')).join(';');
		const radiusStr = Array(coordinates.length).fill('25').join(';');

		const url = `https://api.mapbox.com/matching/v5/mapbox/walking/${coords}?geometries=geojson&steps=true&radiuses=${radiusStr}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;

		console.log('[DrawControl] Matching API URL:', url.replace(process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN!, 'HIDDEN'));

		const query = await fetch(url);
		if (!query.ok) {
			console.error('[DrawControl] Matching API HTTP Error:', query.status);
			return null;
		}

		const response = await query.json();
		console.log('[DrawControl] Matching API Response:', response);

		if (response.code !== 'Ok' || !response.matchings?.[0]?.geometry?.coordinates) {
			console.error('[DrawControl] Matching API Error:', response);
			return null;
		}

		return response.matchings[0].geometry.coordinates;
	} catch (error) {
		console.error('[DrawControl] Error in getMatch:', error);
		return null;
	}
}

export default function DrawControl(props: DrawControlProps) {
	const [currentRoute, setCurrentRoute] = useState<[number, number][]>([]);
	
	useEffect(() => {
		console.log('[DrawControl] Component mounted with props:', props);
		return () => console.log('[DrawControl] Component unmounted');
	}, [props]);

	const draw = useControl<any>(
		() => {
			console.log('[DrawControl] Initializing MapboxDraw instance');
			const drawInstance = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					line_string: true,
					trash: true,
					...props.controls,
				},
				defaultMode: 'simple_select',
				styles: drawStyles,
				...props,
			});
			console.log('[DrawControl] MapboxDraw instance created:', !!drawInstance);
			return drawInstance;
		},
		({ map }) => {
			console.log('[DrawControl] Draw control added to map');
			const mapInst = map.getMap();
			console.log('[DrawControl] Map instance obtained:', !!mapInst);

			const processRoute = async (coords: [number, number][], featureId: string) => {
				console.log('[DrawControl] Processing route with coordinates:', coords);
				let finalRoute: [number, number][] = [];

				try {
					for (let i = 0; i < coords.length - 1; i++) {
						const segmentCoords = [coords[i], coords[i + 1]];
						console.log(`[DrawControl] Processing segment ${i}:`, segmentCoords);
						
						const matchedGeometry = await getMatch(segmentCoords);

						if (matchedGeometry) {
							console.log(`[DrawControl] Segment ${i} matched successfully`);
							if (finalRoute.length === 0) {
								finalRoute.push(...matchedGeometry);
							} else {
								finalRoute.push(...matchedGeometry.slice(1));
							}
						} else {
							console.log(`[DrawControl] Segment ${i} not matched, using original coordinates`);
							if (finalRoute.length === 0) {
								finalRoute.push(segmentCoords[0]);
							}
							finalRoute.push(segmentCoords[1]);
						}
					}

					console.log('[DrawControl] Removing duplicate points');
					finalRoute = finalRoute.filter(
						(point, index, self) => 
							index === 0 || 
							!turf.booleanEqual(turf.point(point), turf.point(self[index - 1]))
					);

					console.log('[DrawControl] Setting current route');
					setCurrentRoute(finalRoute);

					const newRoute: DrawnRoute = {
						id: `route-${Date.now()}`,
						name: `Route ${new Date().toLocaleDateString()}`,
						user_id: props.userId,
						geometry: {
							type: 'LineString',
							coordinates: finalRoute,
						},
						created_at: new Date().toISOString(),
						distance: turf.length(turf.lineString(finalRoute), { units: 'kilometers' }),
					};

					console.log('[DrawControl] Saving route');
					await props.onRouteSave?.(newRoute);
					console.log('[DrawControl] Route saved successfully');

					props.onRouteAdd?.(newRoute);
					console.log('[DrawControl] Route added to display');

					console.log('[DrawControl] Deleting original feature');
					draw.delete(featureId);
				} catch (error) {
					console.error('[DrawControl] Error processing route:', error);
				}
			};

			mapInst.on('draw.create', (e: any) => {
				console.log('[DrawControl] draw.create event triggered:', e);
				const feature = e.features[0];
				if (feature) {
					console.log('[DrawControl] Feature created:', feature);
					const coords = feature.geometry.coordinates as [number, number][];
					console.log('[DrawControl] Processing coordinates:', coords);
					processRoute(coords, feature.id);
				} else {
					console.error('[DrawControl] No feature in draw.create event');
				}
			});

			mapInst.on('draw.modechange', (e: any) => {
				console.log('[DrawControl] Mode changed:', e.mode);
				props.onModeChange?.({ mode: e.mode });
			});

			mapInst.on('draw.actionable', (e: any) => {
				console.log('[DrawControl] Draw actionable:', e);
			});

			mapInst.on('draw.delete', props.onDelete || (() => {}));
		},
		() => {
			console.log('[DrawControl] Draw control removed');
		},
		{
			position: props.position || 'top-right'
		}
	);

	return null;
}

DrawControl.defaultProps = {
	onCreate: () => {},
	onUpdate: () => {},
	onDelete: () => {},
};
