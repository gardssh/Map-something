import { ActivityCategory } from '@/lib/categories';

export interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_speed: number;
  start_date: string;
  map: {
    summary_polyline: string;
  };
  elev_low?: number;
  elev_high?: number;
} 