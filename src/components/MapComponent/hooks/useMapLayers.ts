'use client';

import { useCallback, useState, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';
import type { StyleSpecification } from 'mapbox-gl';

export interface UseMapLayersProps {
  mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapLayers = ({ mapRef }: UseMapLayersProps) => {
  const [currentBaseLayer, setCurrentBaseLayer] = useState<string>('default');
  const [overlayStates, setOverlayStates] = useState<{[key: string]: boolean}>({
    bratthet: false,
    snoskred: false,
    'custom-tileset': false
  });
  const [isAddingLayers, setIsAddingLayers] = useState(false);

  const addOverlayLayers = useCallback(() => {
    if (!mapRef.current || isAddingLayers) return;
    const map = mapRef.current.getMap();

    setIsAddingLayers(true);

    const checkStyleAndAddLayers = () => {
      if (!map.isStyleLoaded()) {
        setTimeout(checkStyleAndAddLayers, 100);
        return;
      }

      if (!map.areTilesLoaded()) {
        setTimeout(checkStyleAndAddLayers, 100);
        return;
      }

      try {
        ['bratthet', 'snoskred'].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(layerId)) {
            map.removeSource(layerId);
          }
        });

        // Add bratthet layer
        if (!map.getSource('bratthet')) {
          map.addSource('bratthet', {
            type: 'raster',
            tiles: [
              'https://nve.geodataonline.no/arcgis/services/Bratthet/MapServer/WMSServer?service=WMS&request=GetMap&version=1.1.1&layers=Bratthet_snoskred&styles=&format=image/png&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&transparent=true'
            ]
          });
        }
        if (!map.getLayer('bratthet')) {
          map.addLayer({
            id: 'bratthet',
            type: 'raster',
            source: 'bratthet',
            paint: { 'raster-opacity': 0.6 },
            layout: { visibility: overlayStates.bratthet ? 'visible' : 'none' }
          });
        }

        // Add snoskred layer
        if (!map.getSource('snoskred')) {
          map.addSource('snoskred', {
            type: 'raster',
            tiles: [
              'https://gis3.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox-epsg-3857}&bboxSR=EPSG:3857&imageSR=EPSG:3857&size=256,256&f=image&layers=show:0,1,2,3,4'
            ]
          });
        }
        if (!map.getLayer('snoskred')) {
          map.addLayer({
            id: 'snoskred',
            type: 'raster',
            source: 'snoskred',
            paint: { 'raster-opacity': 0.6 },
            layout: { visibility: overlayStates.snoskred ? 'visible' : 'none' }
          });
        }

        // Update layer visibility
        ['bratthet', 'snoskred'].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(
              layerId,
              'visibility',
              overlayStates[layerId] ? 'visible' : 'none'
            );
          }
        });

        setIsAddingLayers(false);
      } catch (error) {
        console.error('Error adding overlay layers:', error);
        setIsAddingLayers(false);
        setTimeout(checkStyleAndAddLayers, 200);
      }
    };

    checkStyleAndAddLayers();
  }, [overlayStates, isAddingLayers, mapRef]);

  const handleLayerToggle = useCallback((layerId: string, isVisible: boolean) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Handle base layer changes
    if (['satellite', 'norge-topo', 'default'].includes(layerId)) {
      setCurrentBaseLayer(layerId);
      
      const norgeTopoStyle: StyleSpecification = {
        version: 8,
        sources: {
          'norge-topo': {
            type: 'raster',
            tiles: ['https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="http://www.kartverket.no/">Kartverket</a>'
          }
        },
        layers: [
          {
            id: 'norge-topo-layer',
            type: 'raster',
            source: 'norge-topo',
            paint: { 'raster-opacity': 1 }
          }
        ]
      };

      const newStyle = layerId === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-v9'
        : layerId === 'norge-topo'
          ? norgeTopoStyle
          : 'mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm';

      const currentOverlayStates = { ...overlayStates };

      map.setStyle(newStyle as string);

      map.once('style.load', () => {
        setOverlayStates(currentOverlayStates);
        setTimeout(() => {
          addOverlayLayers();
        }, 200);
      });
    } 
    // Handle overlay toggles
    else {
      setOverlayStates(prev => ({
        ...prev,
        [layerId]: isVisible
      }));

      if (layerId === 'bratthet' || layerId === 'snoskred') {
        const source = layerId === 'bratthet' ? {
          type: 'raster' as const,
          tiles: [
            'https://nve.geodataonline.no/arcgis/services/Bratthet/MapServer/WMSServer?service=WMS&request=GetMap&version=1.1.1&layers=Bratthet_snoskred&styles=&format=image/png&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&transparent=true'
          ]
        } : {
          type: 'raster' as const,
          tiles: [
            'https://gis3.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox-epsg-3857}&bboxSR=EPSG:3857&imageSR=EPSG:3857&size=256,256&f=image&layers=show:0,1,2,3,4'
          ]
        };

        try {
          if (!map.getSource(layerId)) {
            map.addSource(layerId, source);
          }

          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: layerId,
              paint: { 'raster-opacity': 0.6 },
              layout: { visibility: isVisible ? 'visible' : 'none' }
            });
          } else {
            map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
          }
        } catch (error) {
          console.error(`Error handling layer ${layerId}:`, error);
          if (!map.getLayer(layerId)) {
            addOverlayLayers();
          }
        }
      } else {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        }
      }
    }
  }, [addOverlayLayers, overlayStates, mapRef]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const handleStyleData = () => {
      const checkAndAddLayers = () => {
        if (!map.isStyleLoaded() || !map.areTilesLoaded()) {
          setTimeout(checkAndAddLayers, 100);
          return;
        }
        if (!map.getLayer('bratthet') && !map.getLayer('snoskred')) {
          addOverlayLayers();
        }
      };
      checkAndAddLayers();
    };

    map.on('style.load', handleStyleData);
    
    if (map.isStyleLoaded()) {
      if (map.areTilesLoaded()) {
        if (!map.getLayer('bratthet') && !map.getLayer('snoskred')) {
          addOverlayLayers();
        }
      } else {
        map.once('idle', () => {
          if (!map.getLayer('bratthet') && !map.getLayer('snoskred')) {
            addOverlayLayers();
          }
        });
      }
    }

    return () => {
      map.off('style.load', handleStyleData);
    };
  }, [addOverlayLayers, mapRef]);

  return {
    currentBaseLayer,
    overlayStates,
    handleLayerToggle,
  };
}; 