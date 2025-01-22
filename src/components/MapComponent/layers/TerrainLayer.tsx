'use client';

import { useEffect } from 'react';
import { Source } from 'react-map-gl';
import { useMap } from 'react-map-gl';

interface TerrainLayerProps {
	is3DMode: boolean;
}

export const TerrainLayer = ({ is3DMode }: TerrainLayerProps) => {
	const { current: mapRef } = useMap();

	useEffect(() => {
		if (!mapRef) return;
		const map = mapRef.getMap();

		const updateTerrain = () => {
			if (is3DMode) {
				map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
			} else {
				map.setTerrain(null);
			}
		};

		// Only update terrain after style is loaded
		if (map.isStyleLoaded()) {
			updateTerrain();
		} else {
			map.once('style.load', updateTerrain);
		}

		return () => {
			map.off('style.load', updateTerrain);
		};
	}, [mapRef, is3DMode]);

	// Always render the source, but terrain effect is controlled by setTerrain
	return (
		<Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
	);
};
