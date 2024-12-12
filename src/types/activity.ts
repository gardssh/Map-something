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
  max_speed: number;
  start_date: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_heartrate?: number;
  max_heartrate?: number;
  map: {
    summary_polyline: string;
  };
  elev_low?: number;
  elev_high?: number;
  athlete?: {
    id: number;
  };
  selected?: boolean;
  visible?: boolean;
  coordinates?: [number, number] | null;
  bounds?: number[] | null;
  elevation_data?: any;
  feature?: any;
  sourceId?: string;
  layerId?: string;
  isHovered?: boolean;
} 