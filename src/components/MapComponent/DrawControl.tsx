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
			const mapInst = (map as any).getMap();
			setMapInstance(mapInst);
			console.log('DrawControl initialized');

			const controlContainer = map.getContainer().querySelector('.mapboxgl-ctrl-top-right');
			if (controlContainer && props.className) {
				controlContainer.classList.add(props.className);
			}

			// Add listeners for all draw events
			mapInst.on('draw.modechange', (e: any) => {
				console.log('Draw mode changed:', e.mode);
				if (e.mode === 'draw_line_string') {
					console.log('Started drawing line');
				} else if (e.mode === 'simple_select') {
					console.log('Finished drawing, switched to select mode');
				}
			});

			mapInst.on('draw.selectionchange', (e: any) => {
				console.log('Selection changed:', e);
			});

			mapInst.on('draw.actionable', (e: any) => {
				console.log('Draw actionable state changed:', e);
			});

			mapInst.on('draw.render', (e: any) => {
				console.log('Draw render event:', e);
			});

			// Log when points are added during drawing
			mapInst.on('draw.add', (e: any) => {
				console.log('Point added during drawing:', e);
			});

			const processRoute = async (coords: [number, number][], featureId: string) => {
				console.log('3. Starting to process route with', coords.length, 'points');
				let finalRoute: [number, number][] = [];
				let hasMatchingError = false;

				for (let i = 0; i < coords.length - 1; i++) {
					const start = coords[i];
					const end = coords[i + 1];
					console.log(`4. Processing segment ${i + 1}/${coords.length - 1}: ${start} to ${end}`);
					
					try {
						const matchedGeometry = await getMatch([start, end]);
						if (matchedGeometry) {
							console.log(`5. Successfully matched segment ${i + 1}:`, matchedGeometry);
							finalRoute.push(...matchedGeometry);
						} else {
							console.warn(`5. Failed to match segment ${i + 1}, using original coordinates`);
							hasMatchingError = true;
							finalRoute.push(start);
							if (i === coords.length - 2) {
								finalRoute.push(end);
							}
						}
					} catch (error) {
						console.error(`5. Error processing segment ${i + 1}:`, error);
						hasMatchingError = true;
						finalRoute.push(start);
						if (i === coords.length - 2) {
							finalRoute.push(end);
						}
					}
				}

				console.log('6. Removing duplicate points from route');
				finalRoute = finalRoute.filter(
					(point, index, self) => index === 0 || !turf.booleanEqual(turf.point(point), turf.point(self[index - 1]))
				);

				if (hasMatchingError) {
					console.warn('7. Some segments had matching errors. Final route uses some original coordinates.');
				} else {
					console.log('7. All segments successfully matched to roads');
				}

				console.log('8. Setting current route with', finalRoute.length, 'points');
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

				console.log('9. Created new route object:', newRoute);

				try {
					console.log('10. Attempting to save route');
					await props.onRouteSave?.(newRoute);
					console.log('11. Route saved successfully');
				} catch (error) {
					console.error('11. Error saving route:', error);
				}

				try {
					console.log('12. Attempting to add route to display');
					props.onRouteAdd?.(newRoute);
					console.log('13. Route added to display successfully');
				} catch (error) {
					console.error('13. Error adding route to display:', error);
				}

				console.log('14. Deleting original drawn feature:', featureId);
				draw.delete(featureId);
				console.log('15. Route processing complete');
			};

			mapInst.on('draw.create', (e: any) => {
				console.log('1. Route drawing completed. Raw feature:', e.features[0]);
				const feature = e.features[0];
				const coords = feature.geometry.coordinates as [number, number][];
				console.log('2. Extracted coordinates:', coords);
				processRoute(coords, feature.id);
			});

			mapInst.on('draw.delete', props.onDelete || (() => {}));
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
