'use client';

import type { MapRef } from 'react-map-gl';

interface UseWaypointPlacementProps {
  mapRef: React.RefObject<MapRef | null> | React.MutableRefObject<MapRef | undefined>;
  setNewWaypointCoords: (coords: [number, number]) => void;
  setShowWaypointDialog: (show: boolean) => void;
  setIsAddingWaypoint: (isAdding: boolean) => void;
}

export const useWaypointPlacement = ({
  mapRef,
  setNewWaypointCoords,
  setShowWaypointDialog,
  setIsAddingWaypoint,
}: UseWaypointPlacementProps) => {
  const handleWaypointPlacementConfirm = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getMap().getCenter();
    setNewWaypointCoords([center.lng, center.lat]);
    setShowWaypointDialog(true);
    setIsAddingWaypoint(false);
  };

  return {
    handleWaypointPlacementConfirm,
  };
}; 