'use client';

import { useCallback, useState, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';
import type { LineLayer, CircleLayer } from 'react-map-gl';
import type { StyleSpecification } from 'mapbox-gl';

export interface UseMapLayersProps {
	mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapLayers = ({ mapRef }: UseMapLayersProps) => {
	const [currentBaseLayer, setCurrentBaseLayer] = useState<string>('default');
	const [overlayStates, setOverlayStates] = useState<{ [key: string]: boolean }>({
		bratthet: false,
		snoskred: false,
		'custom-tileset': false,
	});
	const [isAddingLayers, setIsAddingLayers] = useState(false);

	const handleLayerToggle = useCallback((layerId: string, isVisible: boolean) => {
		if (['satellite', 'norge-topo', 'default'].includes(layerId)) {
			setCurrentBaseLayer(layerId);
		} else {
			setOverlayStates(prev => ({ ...prev, [layerId]: isVisible }));
		}
	}, []);

	const layers: (LineLayer | CircleLayer)[] = [
		{
			id: 'activities-layer',
			type: 'line',
			source: 'activities',
			layout: {
				'line-join': 'round',
				'line-cap': 'round',
			},
			paint: {
				'line-color': '#ff4400',
				'line-width': 2,
			},
		},
		{
			id: 'saved-routes-layer',
			type: 'line',
			source: 'saved-routes',
			layout: {
				'line-join': 'round',
				'line-cap': 'round',
			},
			paint: {
				'line-color': '#0088ff',
				'line-width': 2,
			},
		},
		{
			id: 'waypoints-layer',
			type: 'circle',
			source: 'waypoints',
			paint: {
				'circle-radius': 6,
				'circle-color': '#00ff88',
				'circle-stroke-width': 2,
				'circle-stroke-color': '#ffffff',
			},
		},
	];

	return {
		layers,
		currentBaseLayer,
		overlayStates,
		handleLayerToggle,
	};
}; 