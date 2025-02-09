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
			if (!map.isStyleLoaded()) {
				setTimeout(updateTerrain, 100);
				return;
			}

			try {
				// Always ensure we have the terrain source
				if (!map.getSource('mapbox-dem')) {
					map.addSource('mapbox-dem', {
						type: 'raster-dem',
						url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
						tileSize: 512,
						maxzoom: 14,
					});
				}

				// Update terrain configuration
				if (is3DMode) {
					map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
					// Ensure the sky layer is present for better 3D visualization
					if (!map.getLayer('sky')) {
						map.addLayer({
							id: 'sky',
							type: 'sky',
							paint: {
								'sky-type': 'atmosphere',
								'sky-atmosphere-sun': [0.0, 0.0],
								'sky-atmosphere-sun-intensity': 5,
								'sky-opacity': 0.5,
							},
						});
					}
				} else {
					map.setTerrain(null);
					if (map.getLayer('sky')) {
						map.removeLayer('sky');
					}
				}
			} catch (error) {
				console.error('Error updating terrain:', error);
				// Retry after a delay if there was an error
				setTimeout(updateTerrain, 100);
			}
		};

		// Handle both initial load and style changes
		const handleStyleData = () => {
			setTimeout(updateTerrain, 200); // Increased delay to ensure style is fully loaded
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

	return null;
};
