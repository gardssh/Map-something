export interface Waypoint {
  id: string;
  user_id: string;
  name: string;
  coordinates: number[];
  geometry: {
    type: 'Point';
    coordinates: number[];
  };
  comments: string | null;
  created_at: string;
  updated_at: string;
} 