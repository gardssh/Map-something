import { Map } from 'maplibre-gl';
import { useContext } from 'react';
import { MapContext } from '@/components/map-context';

export function useMap() {
    const map = useContext(MapContext);
    return { map: map as Map | null };
} 