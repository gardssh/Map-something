'use client';

import { useCallback, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';
import type { Activity } from '@/features/map/shared/types/activity';
import type { DbRoute } from '@/types/supabase';
import type { Waypoint } from '@/features/map/shared/types/waypoint';
import { handleBounds } from '../../utils/mapUtils';

interface UseFeatureSelectionProps {
  mapRef: React.MutableRefObject<MapRef | undefined>;
  activities: Activity[];
  routes: DbRoute[];
  selectedRouteId: string | number | null;
  setSelectedRouteId: (id: string | number | null) => void;
  setSelectedRoute: (route: DbRoute | null) => void;
  onRouteSelect?: (route: DbRoute | null) => void;
  onActivitySelect?: (activity: Activity | null) => void;
  onWaypointSelect?: (waypoint: Waypoint | null) => void;
  isMobile: boolean;
  setActiveItem: (item: string) => void;
  setShowDetailsDrawer: (show: boolean) => void;
  setSelectedActivity: (activity: Activity | null) => void;
  setSelectedWaypoint: (waypoint: Waypoint | null) => void;
}

interface FeatureSelectionHandlers {
  handleActivityHighlight: (activity: Activity) => void;
  handleRouteHighlight: (route: DbRoute) => void;
  handleWaypointHighlight: (waypoint: Waypoint) => void;
  handleActivitySelect: (activity: Activity) => void;
  handleRouteSelect: (route: DbRoute) => void;
  handleWaypointSelect: (waypoint: Waypoint) => void;
}

export const useFeatureSelection = ({
  mapRef,
  activities,
  routes,
  selectedRouteId,
  setSelectedRouteId,
  setSelectedRoute,
  onRouteSelect,
  onActivitySelect,
  onWaypointSelect,
  isMobile,
  setActiveItem,
  setShowDetailsDrawer,
  setSelectedActivity,
  setSelectedWaypoint,
}: UseFeatureSelectionProps): FeatureSelectionHandlers => {
  const handleActivityHighlight = useCallback(
    (activity: Activity) => {
      setSelectedActivity(activity);
      setSelectedRouteId(activity.id);
    },
    [setSelectedActivity, setSelectedRouteId]
  );

  const handleRouteHighlight = useCallback(
    (route: DbRoute) => {
      setSelectedRoute(route);
      setSelectedRouteId(route.id);
    },
    [setSelectedRoute, setSelectedRouteId]
  );

  const handleWaypointHighlight = useCallback(
    (waypoint: Waypoint) => {
      setSelectedWaypoint(waypoint);
    },
    [setSelectedWaypoint]
  );

  const handleActivitySelect = useCallback(
    (activity: Activity) => {
      handleActivityHighlight(activity);
      onActivitySelect?.(activity);
    },
    [handleActivityHighlight, onActivitySelect]
  );

  // Effect to sync selectedRouteId with selectedRoute
  useEffect(() => {
    if (selectedRouteId === null) {
      setSelectedRoute(null);
    } else {
      const route = routes?.find((r) => r.id === selectedRouteId);
      if (route) {
        setSelectedRoute(route);
      }
    }
  }, [selectedRouteId, routes, setSelectedRoute]);

  const handleRouteSelect = useCallback(
    (route: DbRoute) => {
      setSelectedRouteId(route.id);
      setSelectedRoute(route);
      onRouteSelect?.(route);
      if ('coordinates' in route.geometry) {
        handleBounds(mapRef as React.RefObject<MapRef>, route.geometry.coordinates as [number, number][]);
      }
      if (isMobile) {
        setActiveItem('nearby');
        setShowDetailsDrawer(true);
      }
    },
    [setSelectedRouteId, setSelectedRoute, onRouteSelect, mapRef, isMobile, setActiveItem, setShowDetailsDrawer]
  );

  const handleWaypointSelect = useCallback(
    (waypoint: Waypoint) => {
      setSelectedWaypoint(waypoint);
      onWaypointSelect?.(waypoint);
      if (mapRef.current && waypoint.coordinates) {
        mapRef.current.getMap().flyTo({
          center: waypoint.coordinates as [number, number],
          zoom: 14,
        });
      }
      if (isMobile) {
        setActiveItem('nearby');
        setShowDetailsDrawer(true);
      }
    },
    [mapRef, isMobile, setActiveItem, setShowDetailsDrawer, setSelectedWaypoint, onWaypointSelect]
  );

  return {
    handleActivityHighlight,
    handleRouteHighlight,
    handleWaypointHighlight,
    handleActivitySelect,
    handleRouteSelect,
    handleWaypointSelect,
  };
}; 