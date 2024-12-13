import type { MapRef } from 'react-map-gl';
import { LngLatBounds } from 'mapbox-gl';

export const handleBounds = (
  mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>, 
  coordinates: [number, number][]
) => {
  if (!mapRef.current) return;

  const bounds = coordinates.reduce(
    (bounds, coord) => bounds.extend(coord),
    new LngLatBounds(coordinates[0], coordinates[0])
  );

  mapRef.current.fitBounds(
    [
      [bounds.getWest(), bounds.getSouth()],
      [bounds.getEast(), bounds.getNorth()],
    ],
    { padding: 100, duration: 1000 }
  );
}; 