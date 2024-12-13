'use client';

import { Source, Layer } from 'react-map-gl';
import type { DbRoute } from '@/types/supabase';
import * as turf from '@turf/turf';

interface RouteLayerProps {
  routes: DbRoute[];
  selectedRoute: DbRoute | null;
}

export const RouteLayer = ({ routes, selectedRoute }: RouteLayerProps) => {
  return (
    <Source
      id="saved-routes"
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: routes.map((route) => ({
          type: 'Feature',
          geometry: route.geometry,
          properties: {
            id: route.id,
            name: route.name,
            distance: turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' }),
            type: 'drawn-route',
          },
        })) || [],
      }}
    >
      <Layer
        id="saved-routes-border"
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
        paint={{
          'line-color': '#7B00D9',
          'line-width': ['case', ['==', ['get', 'id'], selectedRoute?.id || ''], 9, 3],
          'line-opacity': 0.8,
        }}
      />

      <Layer
        id="saved-routes-layer"
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
        paint={{
          'line-color': '#A020F0',
          'line-width': ['case', ['==', ['get', 'id'], selectedRoute?.id || ''], 5, 3],
          'line-opacity': 0.8,
        }}
      />

      <Layer
        id="saved-routes-symbols"
        type="symbol"
        layout={{
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': 14,
          'symbol-spacing': 50,
          'text-keep-upright': false,
        }}
        paint={{
          'text-color': '#7B00D9',
          'text-opacity': 0.8,
        }}
      />
    </Source>
  );
}; 