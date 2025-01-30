'use client';

import type { MapRef } from 'react-map-gl';
import { mapLayers, DEFAULT_BASE_LAYER } from '../config/mapLayers';

export interface MapConfigOptions {
	mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapConfig = ({ mapRef }: MapConfigOptions) => {
	const initialMapState = {
		longitude: 8.296987,
		latitude: 61.375172,
		zoom: 14,
		pitch: 0,
	};

	const mapSettings = (isDrawing: boolean, is3DMode: boolean = false) => ({
		renderWorldCopies: false,
		maxTileCacheSize: 50,
		trackResize: false,
		dragPan: true,
		keyboard: true,
		interactiveLayerIds: isDrawing
			? []
			: [
					'waypoints-layer',
					'waypoints-layer-touch',
					'foot-sports',
					'cycle-sports',
					'water-sports',
					'winter-sports',
					'other-sports',
					'unknown-sports',
					'saved-routes-layer',
					'saved-routes-border',
			  ],
	});

	return {
		mapStyle: mapLayers.getBaseLayer(DEFAULT_BASE_LAYER)?.style,
		availableLayers: mapLayers.all,
		mapSettings,
		initialMapState,
	};
};