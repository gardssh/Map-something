'use client';

import { Source, Layer } from 'react-map-gl';
import { switchCoordinates, hasValidPolyline } from '@/features/map/shared/utils/coordinates';
import { categorizeActivity } from '@/lib/utils';
import type { Activity } from '@/features/map/shared/types/activity';

interface ActivityLayersProps {
	activities: Activity[];
	selectedRouteId: string | number | null;
	selectedCategories: string[];
}

export const ActivityLayers = ({ activities, selectedRouteId, selectedCategories }: ActivityLayersProps) => {
	// Filter out activities without valid polylines
	const validActivities = activities.filter(hasValidPolyline);

	// Only use selectedRouteId if it belongs to an activity
	const effectiveSelectedId = validActivities.some((a) => a.id === selectedRouteId) ? selectedRouteId : null;

	return (
		<Source
			id="routes"
			type="geojson"
			data={{
				type: 'FeatureCollection',
				features: validActivities.map((activity) => {
					const routePoints = switchCoordinates(activity);
					return {
						type: 'Feature',
						properties: {
							id: activity.id,
							activityType: categorizeActivity(activity.sport_type),
							name: activity.name,
							type: activity.type,
							sport_type: activity.sport_type,
							distance: activity.distance,
							moving_time: activity.moving_time,
							isActivity: true,
						},
						geometry: {
							type: 'LineString',
							coordinates: routePoints.coordinates,
						},
					};
				}),
			}}
		>
			{['Foot Sports', 'Cycle Sports', 'Water Sports', 'Winter Sports', 'Other Sports']
				.map((category) => [
					<Layer
						key={`${category.toLowerCase().replace(' ', '-')}-touch`}
						id={`${category.toLowerCase().replace(' ', '-')}-touch`}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes(category) ? 'visible' : 'none',
						}}
						paint={{
							'line-color': '#000000',
							'line-width': ['interpolate', ['linear'], ['zoom'], 0, 20, 10, 25, 15, 30, 20, 35],
							'line-opacity': 0,
						}}
						filter={['==', ['get', 'activityType'], category]}
					/>,
					<Layer
						key={category.toLowerCase().replace(' ', '-')}
						id={category.toLowerCase().replace(' ', '-')}
						type="line"
						layout={{
							'line-join': 'round',
							'line-cap': 'round',
							visibility: selectedCategories.includes(category) ? 'visible' : 'none',
						}}
						paint={{
							'line-color':
								category === 'Foot Sports'
									? '#D14A00'
									: category === 'Cycle Sports'
										? '#2BD44A'
										: category === 'Water Sports'
											? '#3357FF'
											: category === 'Winter Sports'
												? '#FF33A1'
												: '#FFC300',
							'line-width': ['case', ['==', ['get', 'id'], effectiveSelectedId], 5, 3],
							'line-opacity': 0.8,
						}}
						filter={['==', ['get', 'activityType'], category]}
					/>,
				])
				.flat()}

			<Layer
				id="selected-route-border"
				type="line"
				layout={{
					'line-join': 'round',
					'line-cap': 'round',
					visibility: effectiveSelectedId ? 'visible' : 'none',
				}}
				paint={{
					'line-color': [
						'match',
						['get', 'activityType'],
						'Foot Sports',
						'#B84400',
						'Cycle Sports',
						'#24B33C',
						'Water Sports',
						'#2440B3',
						'Winter Sports',
						'#B32470',
						'Other Sports',
						'#B38900',
						'#000000',
					],
					'line-width': 9,
					'line-opacity': 1,
				}}
				filter={['==', ['get', 'id'], effectiveSelectedId]}
			/>

			<Layer
				id="selected-route"
				type="line"
				layout={{
					'line-join': 'round',
					'line-cap': 'round',
					visibility: effectiveSelectedId ? 'visible' : 'none',
				}}
				paint={{
					'line-color': [
						'match',
						['get', 'activityType'],
						'Foot Sports',
						'#F85E00',
						'Cycle Sports',
						'#33FF57',
						'Water Sports',
						'#3357FF',
						'Winter Sports',
						'#FF33A1',
						'Other Sports',
						'#FFC300',
						'#000000',
					],
					'line-width': 5,
					'line-opacity': 1,
				}}
				filter={['==', ['get', 'id'], effectiveSelectedId]}
			/>
		</Source>
	);
};
