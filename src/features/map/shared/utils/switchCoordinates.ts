export interface Activity {
  id: number;
  name: string;
  sport_type: string;
  start_point: [number, number];
  end_point: [number, number];
  distance: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export const switchCoordinates = (activity: Activity) => {
  if (!activity.geometry?.coordinates?.length) {
    return { startPoint: null, endPoint: null };
  }

  const coordinates = activity.geometry.coordinates;
  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];

  return { startPoint, endPoint };
}; 