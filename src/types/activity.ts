import type { LineString, Feature, GeoJsonProperties } from 'geojson';
import type { RoutePoints } from '@/components/activities/switchCor';

export interface ActivityMap {
  summary_polyline: string;
  geometry?: RoutePoints | null;
}

export interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elev_high?: number;
  elev_low?: number;
  map: ActivityMap;
  athlete?: {
    id: number;
  };
  selected?: boolean;
  visible?: boolean;
  coordinates?: [number, number] | null;
  bounds?: number[] | null;
  elevation_data?: any;
  feature?: Feature<LineString, GeoJsonProperties> | null;
  sourceId?: string;
  layerId?: string;
  isHovered?: boolean;
}

export interface HoverInfo {
  id: string | number;
  name: string;
  longitude: number;
  latitude: number;
}

export type ActivityCategory = 
  | 'Foot Sports'
  | 'Cycle Sports'
  | 'Water Sports'
  | 'Winter Sports'
  | 'Other Sports';
