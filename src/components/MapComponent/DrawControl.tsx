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

		console.log('[DrawControl] Matching API URL:', url.replace(process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN!, 'HIDDEN'));

		const query = await fetch(url);
		if (!query.ok) {
			console.error('[DrawControl] Matching API HTTP Error:', query.status);
			return coordinates; // Fall back to original coordinates on HTTP error
		}

		const response = await query.json();
		console.log('[DrawControl] Matching API Response:', response);

		if (response.code !== 'Ok' || !response.matchings?.[0]?.geometry?.coordinates) {
			console.error('[DrawControl] Matching API Error:', response);
			return coordinates; // Fall back to original coordinates on API error
		}

		return response.matchings[0].geometry.coordinates;
	} catch (error) {
		console.error('[DrawControl] Error in getMatch:', error);
		return coordinates; // Fall back to original coordinates on any error
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
				defaultMode: 'draw_line_string', // Start in drawing mode
				styles: drawStyles,
				...props,
			}) as any;

			// Log when draw buttons are clicked
			const originalChangeMode = drawInstance.changeMode;
			drawInstance.changeMode = function(mode: string, ...args: any[]) {
				console.log('[DrawControl] Mode change requested:', mode);
				try {
					return originalChangeMode.apply(this, [mode, ...args]);
				} catch (error) {
					console.error('[DrawControl] Error changing mode:', error);
					// Try to recover by forcing simple_select mode
					return originalChangeMode.apply(this, ['simple_select']);
				}
			};

			return drawInstance;
		},
		({ map }) => {
			const mapInst = (map as any).getMap();
			console.log('[DrawControl] Map instance obtained:', !!mapInst);
			setMapInstance(mapInst);

			// Add debug logging for drawing events
			const safeAddListener = (event: string, handler: (e: any) => void) => {
				try {
					console.log(`[DrawControl] Adding listener for ${event}`);
					mapInst.on(event, handler);
					console.log(`[DrawControl] Successfully added listener for ${event}`);
				} catch (error) {
					console.error(`[DrawControl] Error adding listener for ${event}:`, error);
				}
			};

			safeAddListener('draw.modechange', (e: any) => {
				console.log('[DrawControl] Draw mode changed:', {
					mode: e.mode,
					timestamp: new Date().toISOString()
				});
				props.onModeChange?.({ mode: e.mode });
			});

			safeAddListener('draw.selectionchange', (e: any) => {
				console.log('[DrawControl] Selection changed:', {
					features: e?.features,
					timestamp: new Date().toISOString()
				});
			});

			safeAddListener('draw.create', (e: any) => {
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
				if (!coords || coords.length < 2) {
					console.error('[DrawControl] Invalid coordinates:', coords);
					return;
				}

				let finalRoute: [number, number][] = [];

				try {
					// Process the entire route at once instead of segment by segment
					const matchedGeometry = await getMatch(coords);
					if (matchedGeometry) {
						console.log('[DrawControl] Route matched successfully');
						finalRoute = matchedGeometry;
					} else {
						console.log('[DrawControl] Route matching failed, using original coordinates');
						finalRoute = coords;
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
					await props.onRouteSave?.(newRoute);
					console.log('[DrawControl] Route saved successfully');

					props.onRouteAdd?.(newRoute);
					console.log('[DrawControl] Route added to display');

					console.log('[DrawControl] Deleting original feature');
					draw.delete(featureId);
				} catch (error) {
					console.error('[DrawControl] Error processing route:', error);
					// Even if there's an error, try to save the original route
					try {
						const fallbackRoute: DrawnRoute = {
							id: `route-${Date.now()}`,
							name: `Route ${new Date().toLocaleDateString()}`,
							user_id: props.userId,
							geometry: {
								type: 'LineString',
								coordinates: coords,
							},
							created_at: new Date().toISOString(),
							distance: turf.length(turf.lineString(coords), { units: 'kilometers' }),
						};
						await props.onRouteSave?.(fallbackRoute);
						props.onRouteAdd?.(fallbackRoute);
						draw.delete(featureId);
					} catch (fallbackError) {
						console.error('[DrawControl] Error saving fallback route:', fallbackError);
					}
				}
			};

			safeAddListener('draw.delete', props.onDelete || (() => {}));
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
