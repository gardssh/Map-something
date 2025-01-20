import type { Feature, FeatureCollection, Point } from 'geojson';

export interface CabinProperties {
  name: string;
  url: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  serviceLevel: string;
  capacity: number;
  requiresKey: boolean;
  description: string;
  openingHours: string;
}

export interface CabinFeature extends Feature<Point> {
  properties: CabinProperties;
}

export interface CabinCollection extends FeatureCollection<Point> {
  features: CabinFeature[];
} 