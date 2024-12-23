import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl';
import type { ControlPosition } from 'react-map-gl';
import type { DrawnRoute } from '@/types/route';
import * as turf from '@turf/turf';
import { useEffect, useState, useRef } from 'react';

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
		const coords = coordinates.map((coord) => coord.join(',')).join(';');
		const radiusStr = Array(coordinates.length).fill('25').join(';');

		const url = `https://api.mapbox.com/matching/v5/mapbox/walking/${coords}?geometries=geojson&steps=true&radiuses=${radiusStr}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;

		const query = await fetch(url);
		if (!query.ok) {
			console.error('[DrawControl] Matching API HTTP Error:', query.status);
			return null;
		}

		const response = await query.json();

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
	const isProcessingRef = useRef(false);

	const draw = useControl<any>(
		() => {
			const drawInstance = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					line_string: true,
					trash: false,
					...props.controls,
				},
				defaultMode: 'simple_select',
				styles: drawStyles,
				...props,
			});
			return drawInstance;
		},

		({ map }) => {
			const mapInst = map.getMap();

			const processRoute = async (coords: [number, number][], featureId: string) => {
				if (isProcessingRef.current) return; // Prevent duplicate processing
				isProcessingRef.current = true;

				let finalRoute: [number, number][] = [];

				try {
					for (let i = 0; i < coords.length - 1; i++) {
						const segmentCoords = [coords[i], coords[i + 1]];

						const matchedGeometry = await getMatch(segmentCoords);

						if (matchedGeometry) {
							if (finalRoute.length === 0) {
								finalRoute.push(...matchedGeometry);
							} else {
								finalRoute.push(...matchedGeometry.slice(1));
							}
						} else {
							if (finalRoute.length === 0) {
								finalRoute.push(segmentCoords[0]);
							}
							finalRoute.push(segmentCoords[1]);
						}
					}

					finalRoute = finalRoute.filter(
						(point, index, self) => index === 0 || !turf.booleanEqual(turf.point(point), turf.point(self[index - 1]))
					);

					setCurrentRoute(finalRoute);

					const newRoute: DrawnRoute = {
						id: `draw-${Date.now()}`,
						name: `Route ${new Date().toLocaleDateString()}`,
						user_id: props.userId,
						geometry: {
							type: 'LineString',
							coordinates: finalRoute,
						},
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						comments: null,
						distance: turf.length(turf.lineString(finalRoute), { units: 'kilometers' }),
						source: 'draw',
					};

					console.log('[DrawControl] Saving drawn route:', newRoute);
					await props.onRouteSave?.(newRoute);

					draw.delete(featureId);
				} catch (error) {
					console.error('[DrawControl] Error processing route:', error);
				} finally {
					isProcessingRef.current = false;
				}
			};

			const handleCreate = (e: any) => {
				const feature = e.features[0];
				if (feature) {
					const coords = feature.geometry.coordinates as [number, number][];
					processRoute(coords, feature.id);
				} else {
					console.error('[DrawControl] No feature in draw.create event');
				}
			};

			const handleModeChange = (e: any) => {
				props.onModeChange?.({ mode: e.mode });
			};

			// Add event listeners
			mapInst.on('draw.create', handleCreate);
			mapInst.on('draw.modechange', handleModeChange);
			mapInst.on('draw.delete', props.onDelete || (() => {}));

			// Return cleanup function
			return () => {
				mapInst.off('draw.create', handleCreate);
				mapInst.off('draw.modechange', handleModeChange);
				mapInst.off('draw.delete', props.onDelete || (() => {}));
			};
		},
		() => {},
		{
			position: props.position || 'top-right',
		}
	);

	return null;
}

DrawControl.defaultProps = {
	onCreate: () => {},
	onUpdate: () => {},
	onDelete: () => {},
};
