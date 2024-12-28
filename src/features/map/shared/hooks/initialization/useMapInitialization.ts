'use client';

import { useCallback, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';
import type { Map } from 'mapbox-gl';

interface UseMapInitializationProps {
  mapRef: React.MutableRefObject<MapRef | undefined>;
  isMobile: boolean;
  is3DMode: boolean;
  setIs3DMode: (mode: boolean) => void;
  isSidebarOpen: boolean;
  onMapLoad?: (map: Map) => void;
  updateVisibleIds: () => void;
}

interface MapInitializationResult {
  toggleViewMode: () => void;
}

export const useMapInitialization = ({
  mapRef,
  isMobile,
  is3DMode,
  setIs3DMode,
  isSidebarOpen,
  onMapLoad,
  updateVisibleIds,
}: UseMapInitializationProps): MapInitializationResult => {
  // Handle map resize when sidebar changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const resizeHandler = () => {
      map.resize();
    };
    map.on('idle', resizeHandler);

    return () => {
      map.off('idle', resizeHandler);
    };
  }, [isSidebarOpen]);

  // Initialize map controls and 3D mode
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (is3DMode && !isMobile) {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      map.touchZoomRotate.enableRotation();
      map.touchPitch.enable();
    } else {
      map.setTerrain(null);
      map.setPitch(0);
      map.touchZoomRotate.disableRotation();
      map.touchPitch.disable();
    }
  }, [is3DMode, isMobile]);

  // Handle initial map load
  useEffect(() => {
    if (!mapRef.current || !onMapLoad) return;
    const map = mapRef.current.getMap() as unknown as Map;
    onMapLoad(map);

    // Wait for the map to be idle before updating visible activities
    const onIdle = () => {
      updateVisibleIds();
      map.off('idle', onIdle);
    };
    map.on('idle', onIdle);
  }, [onMapLoad, updateVisibleIds]);

  // Handle waypoints layer visibility
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const handleMapLoad = () => {
      // Wait for waypoints layer to be added
      map.on('styledata', () => {
        const waypointsLayer = map.getLayer('waypoints-layer');
        if (waypointsLayer) {
          map.setLayoutProperty('waypoints-layer', 'visibility', 'visible');
          // Ensure the layer is interactive
          if (!map.getLayoutProperty('waypoints-layer', 'visibility')) {
            map.setLayoutProperty('waypoints-layer', 'visibility', 'visible');
          }
        }
      });
    };

    if (map.loaded()) {
      handleMapLoad();
    } else {
      map.on('load', handleMapLoad);
    }

    return () => {
      map.off('load', handleMapLoad);
      map.off('styledata', () => {});
    };
  }, []);

  const toggleViewMode = useCallback(() => {
    if (isMobile) return; // Prevent toggling on mobile
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const newMode = !is3DMode;
    setIs3DMode(newMode);

    if (newMode) {
      // Enable 3D mode
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    } else {
      // Enable 2D mode
      map.setTerrain(null);
      map.setPitch(0);
    }
  }, [is3DMode, isMobile, setIs3DMode]);

  return {
    toggleViewMode,
  };
}; 