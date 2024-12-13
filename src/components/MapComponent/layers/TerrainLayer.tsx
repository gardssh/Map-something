'use client';

import { Source, Layer } from 'react-map-gl';

interface TerrainLayerProps {
  overlayStates: {[key: string]: boolean};
}

export const TerrainLayer = ({ overlayStates }: TerrainLayerProps) => {
  return (
    <>
      <Source
        id="mapbox-dem"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />

      <Source id="custom-tileset" type="vector" url="mapbox://gardsh.dppfxauy">
        <Layer
          id="custom-tileset-layer"
          type="line"
          source-layer="fixedmore-5dbb12"
          paint={{
            'line-color': '#9333EA',
            'line-width': 2,
            'line-opacity': 0.2,
            'line-blur': 1,
          }}
          layout={{
            visibility: overlayStates['custom-tileset'] ? 'visible' : 'none',
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />
        <Layer
          id="custom-tileset-layer-overlap"
          type="line"
          source-layer="fixedmore-5dbb12"
          paint={{
            'line-color': '#6B21A8',
            'line-width': 2,
            'line-opacity': 0.1,
          }}
          layout={{
            visibility: overlayStates['custom-tileset'] ? 'visible' : 'none',
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />
      </Source>
    </>
  );
}; 