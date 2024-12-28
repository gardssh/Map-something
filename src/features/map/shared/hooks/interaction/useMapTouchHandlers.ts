'use client';

import type { MapLayerTouchEvent } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import type { Activity } from '@/features/map/shared/types/activity';
import type { DbRoute } from '@/types/supabase';
import type { Waypoint } from '@/features/map/shared/types/waypoint';

interface UseMapTouchHandlersProps {
  isDrawing: boolean;
  mapRef: React.RefObject<MapRef | null> | React.MutableRefObject<MapRef | undefined>;
  activities: Activity[];
  routes: DbRoute[];
  waypoints: Waypoint[];
  setSelectedRouteId: (id: string | number | null) => void;
  setSelectedRoute: (route: DbRoute | null) => void;
  onRouteSelect?: (route: DbRoute | null) => void;
  onActivitySelect?: (activity: Activity | null) => void;
  handleWaypointSelect?: (waypoint: Waypoint | null) => void;
  isMobile: boolean;
  setActiveItem: (item: string) => void;
  setShowDetailsDrawer: (show: boolean) => void;
}

export const useMapTouchHandlers = ({
  isDrawing,
  mapRef,
  activities,
  routes,
  waypoints,
  setSelectedRouteId,
  setSelectedRoute,
  onRouteSelect,
  onActivitySelect,
  handleWaypointSelect,
  isMobile,
  setActiveItem,
  setShowDetailsDrawer,
}: UseMapTouchHandlersProps) => {
  const handleTouchStart = (e: MapLayerTouchEvent) => {
    // Only handle basic touch events
  };

  const handleTouchEnd = (e: MapLayerTouchEvent) => {
    if (isDrawing) return;

    // Handle normal touch interactions
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const point = e.point;

    const features = map.queryRenderedFeatures(point, {
      layers: [
        'foot-sports',
        'cycle-sports',
        'water-sports',
        'winter-sports',
        'other-sports',
        'waypoints-layer',
        'waypoints-layer-touch',
        'saved-routes-layer',
        'saved-routes-border',
      ],
    });

    // Clear all selections first
    setSelectedRouteId(null);
    setSelectedRoute(null);
    onRouteSelect?.(null);
    onActivitySelect?.(null);
    handleWaypointSelect?.(null);

    if (features.length === 0) return;

    const feature = features[0];
    const properties = feature.properties;

    if (!properties) return;

    // Handle activity touches
    if (properties.isActivity || feature.layer.id.endsWith('-touch')) {
      const activity = activities.find((a) => a.id === properties.id);
      if (activity) {
        setSelectedRouteId(activity.id);
        onActivitySelect?.(activity);
        if (isMobile) {
          setActiveItem('nearby');
          setShowDetailsDrawer(true);
        }
      }
      return;
    }

    // Handle route touches
    if (
      feature.layer.id === 'saved-routes-layer' ||
      feature.layer.id === 'saved-routes-border' ||
      feature.layer.id === 'saved-routes-touch'
    ) {
      const route = routes?.find((r) => r.id === properties.id);
      if (route) {
        setSelectedRouteId(route.id);
        setSelectedRoute(route);
        onRouteSelect?.(route);
        if (isMobile) {
          setActiveItem('nearby');
          setShowDetailsDrawer(true);
        }
      }
      return;
    }

    // Handle waypoint touches
    if (feature.layer.id === 'waypoints-layer' || feature.layer.id === 'waypoints-layer-touch') {
      const waypoint = waypoints?.find((w) => w.id === properties.id);
      if (waypoint) {
        handleWaypointSelect?.(waypoint);
        if (isMobile) {
          setActiveItem('nearby');
          setShowDetailsDrawer(true);
        }
      }
      return;
    }
  };

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}; 