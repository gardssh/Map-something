'use client';

import { useCallback } from 'react';
import type { MapRef } from 'react-map-gl';

export interface MapConfigOptions {
  mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapConfig = ({ mapRef }: MapConfigOptions) => {
  const setTerrainExaggeration = useCallback((exaggeration: number) => {
    if (mapRef.current) {
      mapRef.current.getMap().setTerrain({
        source: 'mapbox-dem',
        exaggeration: exaggeration,
      });
    }
  }, [mapRef]);

  const availableLayers = [
    { id: 'default', name: 'Default Map', isBase: true },
    { id: 'satellite', name: 'Satellite', isBase: true },
    { id: 'norge-topo', name: 'Norge Topo', isBase: true },
    { id: 'bratthet', name: 'Slope Angle', isBase: false },
    { id: 'snoskred', name: 'Snøskred Utløp', isBase: false },
    { id: 'custom-tileset', name: 'Heatmap 2000m Norge', isBase: false },
  ];

  const initialMapState = {
    longitude: 8.296987,
    latitude: 61.375172,
    zoom: 14,
    pitch: 0,
  };

  const mapStyle = "mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm";

  const mapSettings = (isDrawing: boolean) => ({
    renderWorldCopies: false,
    maxTileCacheSize: 50,
    trackResize: false,
    dragRotate: true,
    pitchWithRotate: true,
    dragPan: true,
    touchZoomRotate: true,
    touchPitch: true,
    interactiveLayerIds: isDrawing ? [] : [
      'foot-sports',
      'cycle-sports',
      'water-sports',
      'winter-sports',
      'other-sports',
      'unknown-sports',
      'saved-routes-layer',
      'saved-routes-border',
    ],
  });

  const handlePitch = useCallback((pitch: number) => {
    // Adjust terrain exaggeration based on pitch
    if (pitch === 0) {
      setTerrainExaggeration(0); // Flat when viewed from top
    } else {
      setTerrainExaggeration(1.5); // Normal exaggeration otherwise
    }
  }, [setTerrainExaggeration]);

  return {
    setTerrainExaggeration,
    availableLayers,
    initialMapState,
    mapStyle,
    mapSettings,
    handlePitch,
  };
}; 