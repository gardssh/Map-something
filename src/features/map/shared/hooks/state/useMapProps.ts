'use client';

import { useMemo } from 'react';
import type { MapRef, MapLayerMouseEvent, MapLayerTouchEvent, MapboxEvent } from 'react-map-gl';
import type { ViewState } from 'react-map-gl';
import type { Map } from 'mapbox-gl';
import { useContextMenu } from '../interaction/useContextMenu';

interface UseMapPropsConfig {
  mapRef: React.MutableRefObject<MapRef | undefined>;
  is3DMode: boolean;
  isMobile: boolean;
  isDrawing: boolean;
  mapStyle: string;
  initialMapState: Partial<ViewState>;
  updateVisibleIds: () => void;
  onHover: (e: MapLayerMouseEvent) => void;
  onClick: (e: MapLayerMouseEvent) => void;
  onTouchStart: (e: MapLayerTouchEvent) => void;
  onTouchEnd: (e: MapLayerTouchEvent) => void;
  setNewWaypointCoords: (coords: [number, number]) => void;
  setShowWaypointDialog: (show: boolean) => void;
  onMapLoad?: (map: Map) => void;
}

export const useMapProps = ({
  mapRef,
  is3DMode,
  isMobile,
  isDrawing,
  mapStyle,
  initialMapState,
  updateVisibleIds,
  onHover,
  onClick,
  onTouchStart,
  onTouchEnd,
  setNewWaypointCoords,
  setShowWaypointDialog,
  onMapLoad,
}: UseMapPropsConfig) => {
  const { handleContextMenu } = useContextMenu({
    isDrawing,
    isMobile,
    setNewWaypointCoords,
    setShowWaypointDialog,
  });

  const interactiveLayerIds = useMemo(
    () => [
      'foot-sports',
      'foot-sports-touch',
      'cycle-sports',
      'cycle-sports-touch',
      'water-sports',
      'water-sports-touch',
      'winter-sports',
      'winter-sports-touch',
      'other-sports',
      'other-sports-touch',
      'waypoints-layer',
      'waypoints-layer-touch',
      'saved-routes-layer',
      'saved-routes-border',
      'saved-routes-touch',
    ],
    []
  );

  const mapProps = useMemo(
    () => ({
      ref: mapRef as React.RefObject<MapRef>,
      mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN,
      initialViewState: initialMapState,
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } as const,
      mapStyle,
      onMoveEnd: () => updateVisibleIds(),
      onMouseMove: onHover,
      onClick: (e: MapLayerMouseEvent) => {
        if (isDrawing) return;
        onClick(e);
      },
      onContextMenu: handleContextMenu,
      onTouchStart,
      onTouchEnd,
      interactiveLayerIds,
      renderWorldCopies: false,
      maxTileCacheSize: 50,
      trackResize: false,
      dragRotate: is3DMode,
      pitchWithRotate: is3DMode,
      dragPan: true,
      touchZoomRotate: true,
      touchPitch: false,
      maxPitch: isMobile ? 0 : 85,
      minPitch: 0,
      keyboard: true,
      onLoad: (evt: MapboxEvent<undefined>) => {
        const map = (evt.target as unknown) as Map;
        if (onMapLoad) {
          onMapLoad(map);
        }
        // Only enable touch controls if 3D mode is on
        if (is3DMode && !isMobile) {
          map.touchZoomRotate.enableRotation();
          map.touchPitch.enable();
        } else {
          map.touchZoomRotate.disableRotation();
          map.touchPitch.disable();
        }
      },
      terrain: is3DMode && !isMobile ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined,
    }),
    [
      mapRef,
      initialMapState,
      mapStyle,
      updateVisibleIds,
      onHover,
      onClick,
      handleContextMenu,
      isDrawing,
      isMobile,
      onTouchStart,
      onTouchEnd,
      interactiveLayerIds,
      is3DMode,
      onMapLoad,
    ]
  );

  return mapProps;
}; 