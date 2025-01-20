'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MapRef } from 'react-map-gl';

export interface UseDNTCabinsProps {
  mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useDNTCabins = ({ mapRef }: UseDNTCabinsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = useCallback((visible: boolean) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    if (map.getLayer('dnt-cabins-layer')) {
      map.setLayoutProperty(
        'dnt-cabins-layer',
        'visibility',
        visible ? 'visible' : 'none'
      );
    }
    setIsVisible(visible);
  }, [mapRef]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Load cabin icon
    if (!map.hasImage('cabin')) {
      map.loadImage('/cabin-icon.png', (error, image) => {
        if (error) throw error;
        if (image && !map.hasImage('cabin')) {
          map.addImage('cabin', image);
        }
      });
    }
  }, [mapRef]);

  return {
    isVisible,
    isLoading,
    toggleVisibility,
  };
}; 