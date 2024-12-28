'use client';

import type { MapRef } from 'react-map-gl';

export interface MapConfigOptions {
  mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapConfig = ({ mapRef }: MapConfigOptions) => {
  const mapStyle = 'mapbox://styles/mapbox/outdoors-v12';
  const availableLayers = [
    { id: 'default', name: 'Default', isBase: true },
    { id: 'satellite', name: 'Satellite', isBase: true },
    { id: 'norge-topo', name: 'Norge Topo', isBase: true },
    { id: 'bratthet', name: 'Bratthet', isBase: false },
    { id: 'snoskred', name: 'Snøskred', isBase: false },
    { id: 'custom-tileset', name: 'Heatmap 2000m Norge', isBase: false },
  ];
  const initialMapState = {
    longitude: 8.296987,
    latitude: 61.375172,
    zoom: 14,
    pitch: 0,
  };

  const mapSettings = (isDrawing: boolean) => ({
    renderWorldCopies: false,
    maxTileCacheSize: 50,
    trackResize: false,
    dragRotate: true,
    pitchWithRotate: true,
    dragPan: true,
    touchZoomRotate: true,
    touchPitch: true,
    interactiveLayerIds: isDrawing ? [] : ['waypoints-layer', 'activities-layer', 'saved-routes-layer'],
  });

  return { mapStyle, mapSettings, availableLayers, initialMapState };
}; 