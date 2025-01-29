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
			// Wait for both the style and the source to be ready
			if (!map.isStyleLoaded()) {
				setTimeout(updateTerrain, 100);
				return;
			}

			// For custom styles (Norge layers), we need to ensure the source exists
			if (!map.getSource('mapbox-dem')) {
				// Add the source if it doesn't exist
				try {
					map.addSource('mapbox-dem', {
						type: 'raster-dem',
						url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
						tileSize: 512,
						maxzoom: 14,
					});
				} catch (error) {
					// Source might already exist or style might not be loaded yet
					setTimeout(updateTerrain, 100);
					return;
				}
			}

			if (is3DMode) {
				map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.1 });
			} else {
				map.setTerrain(null);
			}
		};

		// Handle both initial load and style changes
		const handleStyleData = () => {
			// Add a delay to ensure the style is fully loaded
			setTimeout(updateTerrain, 150);
		};

		// Set up event listeners
		map.on('style.load', handleStyleData);
		map.on('styledata', handleStyleData);

		// Initial setup
		handleStyleData();

		return () => {
			map.off('style.load', handleStyleData);
			map.off('styledata', handleStyleData);
		};
	}, [mapRef, is3DMode]);

	// Always add the source programmatically in the effect hook
	return null;
};
