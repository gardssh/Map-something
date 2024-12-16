'use client';

import { useCallback } from 'react';
import type { MapLayerMouseEvent } from 'react-map-gl';
import type { DbRoute } from '@/types/supabase';
import type { Activity, HoverInfo } from '@/types/activity';
import type { RoutePoints } from '@/components/activities/switchCor';
import { handleBounds } from '../utils/mapUtils';
import type { MapRef } from 'react-map-gl';

interface UseMapEventsProps {
  activities: Activity[];
  routes?: DbRoute[];
  setSelectedRouteId: (id: string | number | null) => void;
  setSelectedRoute: (route: DbRoute | null) => void;
  onRouteSelect?: (route: DbRoute | null) => void;
  setHoverInfo: (info: HoverInfo | null) => void;
  isDrawing: boolean;
  mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
  switchCoordinates: (activity: Activity) => RoutePoints;
}

export const useMapEvents = ({
  activities,
  routes,
  setSelectedRouteId,
  setSelectedRoute,
  onRouteSelect,
  setHoverInfo,
  isDrawing,
  mapRef,
  switchCoordinates,
}: UseMapEventsProps) => {
  const onHover = useCallback(
    (event: any) => {
      // Don't show hover info when drawing or on touch devices
      if (isDrawing || 'ontouchstart' in window) {
        setHoverInfo(null);
        return;
      }

      const feature = event.features && event.features[0];

      if (!feature) {
        setHoverInfo(null);
        return;
      }

      // Handle activity hover
      if (typeof feature.id === 'number') {
        const activity = activities.find((activity) => activity.id === feature.id);
        if (activity) {
          setHoverInfo({
            id: activity.id,
            name: activity.name,
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        }
      }
      // Handle route hover
      else if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
        const route = routes?.find((r) => r.id === feature.properties.id);
        if (route) {
          setHoverInfo({
            id: route.id,
            name: route.name,
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        }
      }
    },
    [activities, routes, isDrawing, setHoverInfo]
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const features = event.features || [];
      console.log('Clicked features:', features);

      if (features.length > 0) {
        const feature = features[0];
        const properties = feature?.properties;
        if (!feature || !properties) return;

        // Handle activity clicks
        if (typeof feature.id === 'number') {
          setSelectedRouteId(feature.id);
          setSelectedRoute(null);
          const selectedActivity = activities.find((activity) => activity.id === feature.id);
          if (selectedActivity) {
            const routePoints = switchCoordinates(selectedActivity);
            handleBounds(mapRef as React.RefObject<MapRef>, routePoints.coordinates);
          }
        }
        // Handle drawn route clicks
        else if (feature.layer.id === 'saved-routes-layer' || feature.layer.id === 'saved-routes-border') {
          console.log('Route properties:', feature.properties);
          const route = routes?.find((r) => r.id === properties.id);
          console.log('Found route:', route);

          if (route) {
            setSelectedRouteId(route.id);
            setSelectedRoute(route);
            onRouteSelect?.(route);
            if ('coordinates' in route.geometry) {
              handleBounds(mapRef as React.RefObject<MapRef>, route.geometry.coordinates as [number, number][]);
            }
          }
        }
      } else {
        setSelectedRouteId(null);
        setSelectedRoute(null);
        onRouteSelect?.(null);
      }
    },
    [activities, routes, setSelectedRouteId, setSelectedRoute, onRouteSelect, mapRef, switchCoordinates]
  );

  return {
    onHover,
    onClick,
  };
}; 