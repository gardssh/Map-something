import { Position } from '@/hooks/useActivityRecording';
import polyline from '@mapbox/polyline';

export interface RecordedActivity {
  id: string;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
  summary_polyline: string;
  elev_low: number | null;
  elev_high: number | null;
  start_latlng: [number, number];
  end_latlng: [number, number];
  positions: Position[];
}

export const processRecordedActivity = (
  positions: Position[],
  distance: number,
  elapsedTime: number,
  averageSpeed: number,
  activityName: string = 'Recorded Activity',
  activityType: string = 'Run'
): RecordedActivity => {
  // Calculate elevation gain and extremes
  let totalElevationGain = 0;
  let elevLow = positions[0]?.altitude ?? null;
  let elevHigh = positions[0]?.altitude ?? null;
  let maxSpeed = 0;

  positions.forEach((pos, index) => {
    if (pos.altitude !== null) {
      if (elevLow === null || pos.altitude < elevLow) elevLow = pos.altitude;
      if (elevHigh === null || pos.altitude > elevHigh) elevHigh = pos.altitude;
      
      if (index > 0) {
        const prevAltitude = positions[index - 1].altitude;
        if (prevAltitude !== null) {
          const elevDiff = pos.altitude - prevAltitude;
          if (elevDiff > 0) totalElevationGain += elevDiff;
        }
      }
    }

    if (pos.speed !== null && pos.speed > maxSpeed) {
      maxSpeed = pos.speed;
    }
  });

  // Create polyline
  const polylineCoords: [number, number][] = positions.map(pos => [pos.latitude, pos.longitude]);
  const summaryPolyline = polyline.encode(polylineCoords);

  return {
    id: crypto.randomUUID(),
    name: activityName,
    type: activityType,
    sport_type: activityType,
    distance,
    moving_time: Math.round(elapsedTime),
    total_elevation_gain: totalElevationGain,
    start_date: new Date().toISOString(),
    average_speed: averageSpeed,
    max_speed: maxSpeed,
    summary_polyline: summaryPolyline,
    elev_low: elevLow,
    elev_high: elevHigh,
    start_latlng: [positions[0].latitude, positions[0].longitude],
    end_latlng: [
      positions[positions.length - 1].latitude,
      positions[positions.length - 1].longitude,
    ],
    positions,
  };
};

export const saveActivity = async (activity: RecordedActivity) => {
  try {
    // Here you would typically save to your backend/database
    // For now, we'll save to localStorage as an example
    const savedActivities = JSON.parse(
      localStorage.getItem('recorded_activities') || '[]'
    );
    savedActivities.push(activity);
    localStorage.setItem('recorded_activities', JSON.stringify(savedActivities));
    
    return activity;
  } catch (error) {
    console.error('Error saving activity:', error);
    throw error;
  }
}; 