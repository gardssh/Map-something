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

async function getMatch(coordinates: [number, number][]) {
	try {
		// Set radius for each coordinate (in meters)
		const radiuses = coordinates.map(() => 50);
		const coords = coordinates.map((coord) => coord.join(',')).join(';');
		const radiusStr = radiuses.join(';');

		const url = `https://api.mapbox.com/matching/v5/mapbox/walking/${coords}?geometries=geojson&steps=true&radiuses=${radiusStr}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;

		console.log('Matching API URL:', url.replace(process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN!, 'HIDDEN'));

		const query = await fetch(url);
		const response = await query.json();

		console.log('Matching API Response:', response);

		if (response.code !== 'Ok') {
			console.error('Matching API Error:', response);
			return null;
		}

		return response.matchings[0].geometry.coordinates;
	} catch (error) {
		console.error('Error in getMatch:', error);
		return null;
	}
}

export default function DrawControl(props: DrawControlProps) {
	const [currentRoute, setCurrentRoute] = useState<[number, number][]>([]);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

	useEffect(() => {
		console.log('[DrawControl] Component mounted');
		return () => console.log('[DrawControl] Component unmounted');
	}, []);

	const draw = useControl(
		() => {
			console.log('[DrawControl] Initializing draw control');
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
			}) as any;

			// Log when draw buttons are clicked
			const originalChangeMode = drawInstance.changeMode;
			drawInstance.changeMode = function(mode: string, ...args: any[]) {
				console.log('[DrawControl] Mode change requested:', mode);
				return originalChangeMode.apply(this, [mode, ...args]);
			};

			return drawInstance;
		},
		({ map }) => {
			const mapInst = (map as any).getMap();
			console.log('[DrawControl] Map instance obtained:', !!mapInst);
			setMapInstance(mapInst);

			const controlContainer = map.getContainer().querySelector('.mapboxgl-ctrl-top-right');
			if (controlContainer && props.className) {
				controlContainer.classList.add(props.className);
			}

			// Add debug logging for drawing events
			mapInst.on('draw.modechange', (e: any) => {
				console.log('[DrawControl] Draw mode changed:', {
					mode: e.mode,
					timestamp: new Date().toISOString()
				});
			});

			// Log when points are added during drawing
			mapInst.on('draw.selectionchange', (e: any) => {
				console.log('[DrawControl] Selection changed:', {
					features: e?.features,
					timestamp: new Date().toISOString()
				});
			});

			mapInst.on('draw.create', (e: any) => {
				console.log('[DrawControl] Draw create event:', {
					featureCount: e?.features?.length,
					coordinates: e?.features?.[0]?.geometry?.coordinates,
					timestamp: new Date().toISOString()
				});

				if (!e?.features?.[0]) {
					console.error('[DrawControl] No feature created');
					return;
				}

				const feature = e.features[0];
				const coords = feature.geometry.coordinates as [number, number][];
				processRoute(coords, feature.id);
			});

			const processRoute = async (coords: [number, number][], featureId: string) => {
				console.log('[DrawControl] Processing route with coordinates:', coords);
				let finalRoute: [number, number][] = [];

				for (let i = 0; i < coords.length - 1; i++) {
					const start = coords[i];
					const end = coords[i + 1];
					console.log(`[DrawControl] Processing segment ${i + 1}/${coords.length - 1}`);
					
					try {
						const matchedGeometry = await getMatch([start, end]);
						if (matchedGeometry) {
							console.log(`[DrawControl] Segment ${i + 1} matched successfully`);
							finalRoute.push(...matchedGeometry);
						} else {
							console.log(`[DrawControl] Segment ${i + 1} matching failed, using original coordinates`);
							finalRoute.push(start, end);
						}
					} catch (error) {
						console.error(`[DrawControl] Error matching segment ${i + 1}:`, error);
						finalRoute.push(start, end);
					}
				}

				console.log('[DrawControl] Removing duplicate points');
				finalRoute = finalRoute.filter(
					(point, index, self) => index === 0 || !turf.booleanEqual(turf.point(point), turf.point(self[index - 1]))
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
				try {
					await props.onRouteSave?.(newRoute);
					console.log('[DrawControl] Route saved successfully');
				} catch (error) {
					console.error('[DrawControl] Error saving route:', error);
				}

				try {
					props.onRouteAdd?.(newRoute);
					console.log('[DrawControl] Route added to display');
				} catch (error) {
					console.error('[DrawControl] Error adding route to display:', error);
				}

				console.log('[DrawControl] Deleting original feature');
				draw.delete(featureId);
			};

			
			mapInst.on('draw.delete', props.onDelete || (() => {}));

			// Verify event listeners are attached
			setTimeout(() => {
				console.log('[DrawControl] Verifying event listeners attached');
				const events = ['draw.create', 'draw.delete', 'draw.update', 'draw.selectionchange', 'draw.modechange'];
				events.forEach(event => {
					// Add a temporary listener to verify we can attach listeners
					const tempListener = () => {};
					mapInst.on(event, tempListener);
					mapInst.off(event, tempListener);
					console.log(`[DrawControl] Successfully verified listener for ${event}`);
				});
			}, 1000);
		},
		{
			position: 'top-right'
		}
	);

	useEffect(() => {
		if (draw && mapInstance && props.onModeChange) {
			const handler = (e: any) => props.onModeChange?.({ mode: e.mode });
			mapInstance.on('draw.modechange', handler);
			return () => {
				mapInstance.off('draw.modechange', handler);
			};
		}
	}, [draw, mapInstance, props.onModeChange]);

	return null;
}

DrawControl.defaultProps = {
	onCreate: () => {},
	onUpdate: () => {},
	onDelete: () => {},
};
