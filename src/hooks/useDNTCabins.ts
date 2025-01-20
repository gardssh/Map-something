import { useEffect, useState } from 'react';
import type { CabinCollection, CabinFeature } from '@/types/dnt-cabins';

export function useDNTCabins() {
  const [cabinData, setCabinData] = useState<CabinCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  useEffect(() => {
    async function fetchCabins() {
      try {
        const response = await fetch('/api/cabins');
        const enrichedCabins = await response.json();

        // Convert enriched cabins to GeoJSON format
        const features: CabinFeature[] = enrichedCabins.map((cabin: any) => ({
          type: 'Feature',
          properties: {
            name: cabin.name,
            url: cabin.url,
            coordinates: cabin.coordinates,
            serviceLevel: cabin.serviceLevel,
            capacity: cabin.capacity,
            requiresKey: cabin.requiresKey,
            description: cabin.description,
            openingHours: cabin.openingHours,
          },
          geometry: {
            type: 'Point',
            coordinates: [cabin.coordinates.lng, cabin.coordinates.lat],
          },
        }));

        setCabinData({
          type: 'FeatureCollection',
          features,
        });
      } catch (error) {
        console.error('Error fetching cabin data:', error);
      }
    }

    fetchCabins();
  }, []);

  return cabinData;
} 