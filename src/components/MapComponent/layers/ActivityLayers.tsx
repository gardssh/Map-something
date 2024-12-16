'use client';

import { Source, Layer } from 'react-map-gl';
import { switchCoordinates } from '../../activities/switchCor';
import { categorizeActivity, getActivityColor } from '@/lib/utils';

interface ActivityLayersProps {
  activities: any[];
  selectedRouteId: string | number | null;
  selectedCategories: string[];
}

export const ActivityLayers = ({ activities, selectedRouteId, selectedCategories }: ActivityLayersProps) => {
  return (
    <Source
      id={'routes'}
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: activities.map((activity) => {
          const routePoints = switchCoordinates(activity);
          return {
            id: activity.id,
            type: 'Feature',
            properties: { activityType: categorizeActivity(activity.sport_type) },
            geometry: { type: 'LineString', coordinates: routePoints.coordinates },
            paint: { 'line-color': getActivityColor(activity.type), 'line-width': 8, 'line-opacity': 0.5 },
          };
        }),
      }}
    >
      <Layer
        id={'foot-sports'}
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
          visibility: selectedCategories.includes('Foot Sports') ? 'visible' : 'none',
        }}
        paint={{
          'line-color': '#D14A00',
          'line-width': 3,
          'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
        }}
        filter={['==', 'Foot Sports', ['get', 'activityType']]}
      />

      <Layer
        id={'cycle-sports'}
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
          visibility: selectedCategories.includes('Cycle Sports') ? 'visible' : 'none',
        }}
        paint={{
          'line-color': '#2BD44A',
          'line-width': 3,
          'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
        }}
        filter={['==', 'Cycle Sports', ['get', 'activityType']]}
      />

      <Layer
        id={'water-sports'}
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
          visibility: selectedCategories.includes('Water Sports') ? 'visible' : 'none',
        }}
        paint={{
          'line-color': '#3357FF',
          'line-width': 3,
          'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
        }}
        filter={['==', 'Water Sports', ['get', 'activityType']]}
      />

      <Layer
        id={'winter-sports'}
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
          visibility: selectedCategories.includes('Winter Sports') ? 'visible' : 'none',
        }}
        paint={{
          'line-color': '#FF33A1',
          'line-width': 3,
          'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
        }}
        filter={['==', 'Winter Sports', ['get', 'activityType']]}
      />

      <Layer
        id={'other-sports'}
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
          visibility: selectedCategories.includes('Other Sports') ? 'visible' : 'none',
        }}
        paint={{
          'line-color': '#FFC300',
          'line-width': 3,
          'line-opacity': ['case', ['==', ['id'], selectedRouteId], 1, 0.8],
        }}
        filter={['==', 'Other Sports', ['get', 'activityType']]}
      />

      <Layer
        id={'unknown-sports'}
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{ 'line-color': '#000000', 'line-width': 5, 'line-opacity': 0.5 }}
        filter={['==', 'Unknown Category', ['get', 'activityType']]}
      />

      <Layer
        id={'selected-route-border'}
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{
          'line-color': [
            'match',
            ['get', 'activityType'],
            'Foot Sports', '#B84400',
            'Cycle Sports', '#24B33C',
            'Water Sports', '#2440B3',
            'Winter Sports', '#B32470',
            'Other Sports', '#B38900',
            '#000000'
          ],
          'line-width': 9,
          'line-opacity': 1,
        }}
        filter={['==', selectedRouteId, ['id']]}
      />

      <Layer
        id={'selected-route'}
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{
          'line-color': [
            'match',
            ['get', 'activityType'],
            'Foot Sports', '#F85E00',
            'Cycle Sports', '#33FF57',
            'Water Sports', '#3357FF',
            'Winter Sports', '#FF33A1',
            'Other Sports', '#FFC300',
            '#000000'
          ],
          'line-width': 5,
          'line-opacity': 1,
        }}
        filter={['==', selectedRouteId, ['id']]}
      />

      <Layer
        id={'symbol-layer'}
        type="symbol"
        source="route"
        layout={{
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': 14,
          'symbol-spacing': 50,
          'text-keep-upright': false,
          visibility: selectedCategories.length > 0 ? 'visible' : 'none',
        }}
        paint={{
          'text-color': [
            'match',
            ['get', 'activityType'],
            'Foot Sports', '#B84400',
            'Cycle Sports', '#24B33C',
            'Water Sports', '#2440B3',
            'Winter Sports', '#B32470',
            'Other Sports', '#B38900',
            '#000000'
          ],
        }}
        filter={['in', ['get', 'activityType'], ['literal', selectedCategories]]}
      />
    </Source>
  );
}; 