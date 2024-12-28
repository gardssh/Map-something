'use client';

import { useCallback, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';

interface UseMapVisibilityProps {
  mapRef: React.MutableRefObject<MapRef | undefined>;
  setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
  setLocalVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
  setVisibleRoutesId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  setVisibleWaypointsId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
}

export const useMapVisibility = ({
  mapRef,
  setVisibleActivitiesId,
  setLocalVisibleActivitiesId,
  setVisibleRoutesId,
  setVisibleWaypointsId,
}: UseMapVisibilityProps) => {
  const getVisibleFeatures = useCallback(() => {
    if (!mapRef.current) return { activities: [], routes: [], waypoints: [] };
    const map = mapRef.current.getMap();

    const activityFeatures = map.queryRenderedFeatures(undefined, {
      layers: ['foot-sports', 'cycle-sports', 'water-sports', 'winter-sports', 'other-sports'],
    });

    const routeFeatures = map.queryRenderedFeatures(undefined, {
      layers: ['saved-routes-layer', 'saved-routes-border'],
    });

    const waypointFeatures = map.queryRenderedFeatures(undefined, {
      layers: ['waypoints-layer'],
    });

    return {
      activities: activityFeatures,
      routes: routeFeatures,
      waypoints: waypointFeatures,
    };
  }, []);

  const updateVisibleIds = useCallback(() => {
    const { activities, routes, waypoints } = getVisibleFeatures();

    const visibleActivityIds = activities
      .map((feature) => feature.properties?.id)
      .filter((id) => id != null);

    const visibleRouteIds = routes
      .map((feature) => feature.properties?.id)
      .filter((id) => id != null);

    const visibleWaypointIds = waypoints
      .map((feature) => feature.properties?.id)
      .filter((id) => id != null);

    setLocalVisibleActivitiesId(visibleActivityIds);
    setVisibleActivitiesId(visibleActivityIds);
    setVisibleRoutesId(visibleRouteIds);
    setVisibleWaypointsId(visibleWaypointIds);
  }, [getVisibleFeatures, setVisibleActivitiesId, setLocalVisibleActivitiesId, setVisibleRoutesId, setVisibleWaypointsId]);

  // Update visible features when the map moves or loads
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const handleMapUpdate = () => {
      updateVisibleIds();
    };

    map.on('moveend', handleMapUpdate);
    map.on('load', handleMapUpdate);

    return () => {
      map.off('moveend', handleMapUpdate);
      map.off('load', handleMapUpdate);
    };
  }, [updateVisibleIds]);

  return {
    getVisibleFeatures,
    updateVisibleIds,
  };
}; 