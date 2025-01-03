import { Source, Layer, LayerProps, useMap } from 'react-map-gl';
import type { Waypoint } from '@/types/waypoint';
import { useEffect, useMemo } from 'react';

interface WaypointLayerProps {
	waypoints?: Waypoint[];
	selectedWaypoint?: Waypoint | null;
	visible?: boolean;
}

const circlePaint: LayerProps['paint'] = {
	'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 14, ['get', 'selected'], 12, 8],
	'circle-color': [
		'case',
		['boolean', ['feature-state', 'hover'], false],
		'#a855f7',
		['get', 'selected'],
		'#a855f7',
		'#9333ea',
	],
	'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, ['get', 'selected'], 3, 2],
	'circle-stroke-color': '#ffffff',
	'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 1],
	'circle-stroke-opacity': 1,
};

export const WaypointLayer = ({ waypoints, selectedWaypoint, visible = true }: WaypointLayerProps) => {
	const { current: map } = useMap();

	// Create features only when waypoints or selection changes
	const features = useMemo(() => {
		if (!waypoints?.length) return [];

		return waypoints.map((waypoint) => ({
			type: 'Feature' as const,
			id: waypoint.id,
			geometry: {
				type: 'Point' as const,
				coordinates: waypoint.coordinates,
			},

			properties: {
				id: waypoint.id,
				name: waypoint.name,
				selected: selectedWaypoint?.id === waypoint.id,
				type: 'waypoint',
			},
		}));
	}, [waypoints, selectedWaypoint]);

	// Initialize layer only once when map is ready
	useEffect(() => {
		if (!map || !features.length) return;

		const initializeLayer = () => {
			try {
				// Initialize each layer independently
				const mainLayer = map.getMap().getLayer('waypoints-layer');
				if (mainLayer) {
					map.getMap().setLayoutProperty('waypoints-layer', 'visibility', visible ? 'visible' : 'none');
				}

				const touchLayer = map.getMap().getLayer('waypoints-layer-touch');
				if (touchLayer) {
					map.getMap().setLayoutProperty('waypoints-layer-touch', 'visibility', visible ? 'visible' : 'none');
				}

				// If either layer is missing, try again
				if (!mainLayer || !touchLayer) {
					setTimeout(initializeLayer, 50);
				}
			} catch (error) {
				setTimeout(initializeLayer, 50);
			}
		};

		// Initial setup
		initializeLayer();

		// Handle style changes
		const handleStyleData = () => {
			initializeLayer();
		};
		map.getMap().on('styledata', handleStyleData);

		return () => {
			map.getMap().off('styledata', handleStyleData);
		};
	}, [map, features, visible]);

	if (!features.length) return null;

	return (
		<Source
			id="waypoints"
			type="geojson"
			data={{
				type: 'FeatureCollection',
				features,
			}}
		>
			<Layer
				id="waypoints-layer"
				type="circle"
				source="waypoints"
				paint={circlePaint}
				filter={['==', ['get', 'type'], 'waypoint']}
				layout={{
					visibility: visible ? 'visible' : 'none',
				}}
				minzoom={0}
				maxzoom={24}
			/>
			<Layer
				id="waypoints-layer-touch"
				type="circle"
				source="waypoints"
				paint={{
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 10, 20, 15, 25, 20, 30],
					'circle-opacity': 0,
					'circle-stroke-width': 0,
					'circle-stroke-opacity': 0,
				}}
				filter={['==', ['get', 'type'], 'waypoint']}
				layout={{
					visibility: visible ? 'visible' : 'none',
				}}
				minzoom={0}
				maxzoom={24}
				beforeId="waypoints-layer"
			/>
		</Source>
	);
};
