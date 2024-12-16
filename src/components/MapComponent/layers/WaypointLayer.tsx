import { Marker } from 'react-map-gl';
import type { Waypoint } from '@/types/waypoint';

export const WaypointLayer = ({ waypoints }: { waypoints?: Waypoint[] }) => {
  if (!waypoints?.length) return null;

  return (
    <>
      {waypoints.map((waypoint) => (
        <Marker
          key={waypoint.id}
          longitude={waypoint.coordinates[0]}
          latitude={waypoint.coordinates[1]}
          color="#9333ea"
        />
      ))}
    </>
  );
}; 