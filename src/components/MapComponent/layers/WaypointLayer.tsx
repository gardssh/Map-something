import { Source, Layer } from 'react-map-gl';
import type { Waypoint } from '@/types/waypoint';

interface WaypointLayerProps {
	waypoints?: Waypoint[];
	selectedWaypoint?: Waypoint | null;
}

export const WaypointLayer = ({ waypoints, selectedWaypoint }: WaypointLayerProps) => {
	if (!waypoints?.length) return null;

	const features = waypoints.map((waypoint) => ({
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
		},
	}));

	return (
		<Source
			id="waypoints"
			type="geojson"
			data={{
				type: 'FeatureCollection',
				features,
			}}
			generateId={false}
		>
			<Layer
				id="waypoints-layer"
				type="circle"
				source="waypoints"
				paint={{
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
				}}
			/>
		</Source>
	);
};
