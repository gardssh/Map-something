'use client';

import { useCallback } from 'react';
import type { MapLayerMouseEvent } from 'react-map-gl';

interface UseContextMenuProps {
  isDrawing: boolean;
  isMobile: boolean;
  setNewWaypointCoords: (coords: [number, number]) => void;
  setShowWaypointDialog: (show: boolean) => void;
}

export const useContextMenu = ({
  isDrawing,
  isMobile,
  setNewWaypointCoords,
  setShowWaypointDialog,
}: UseContextMenuProps) => {
  const handleContextMenu = useCallback(
    (e: MapLayerMouseEvent) => {
      if (isDrawing) return;
      
      // Only handle right-click on desktop
      if (!isMobile) {
        e.preventDefault();
        const coords = e.lngLat;
        setNewWaypointCoords([coords.lng, coords.lat]);
        setShowWaypointDialog(true);
      }
    },
    [isDrawing, isMobile, setNewWaypointCoords, setShowWaypointDialog]
  );

  return {
    handleContextMenu,
  };
}; 