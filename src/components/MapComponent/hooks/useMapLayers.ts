'use client';

import { useCallback, useState, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';
import { mapLayers, DEFAULT_BASE_LAYER, type BaseLayerId, type OverlayLayerId } from '../config/mapLayers';
import type { LayerSpecification, StyleSpecification } from 'mapbox-gl';

export interface UseMapLayersProps {
	mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapLayers = ({ mapRef }: UseMapLayersProps) => {
	const [currentBaseLayer, setCurrentBaseLayer] = useState<BaseLayerId>(DEFAULT_BASE_LAYER);
	const [overlayStates, setOverlayStates] = useState<Record<OverlayLayerId, boolean>>({
		bratthet: false,
		snoskred: false,
		'custom-tileset': false
	});
	const [isAddingLayers, setIsAddingLayers] = useState(false);

	const addOverlayLayers = useCallback(() => {
		if (!mapRef.current || isAddingLayers) return;
		const map = mapRef.current.getMap();

		setIsAddingLayers(true);

		const checkStyleAndAddLayers = () => {
			if (!map.isStyleLoaded()) {
				setTimeout(checkStyleAndAddLayers, 100);
				return;
			}

			if (!map.areTilesLoaded()) {
				setTimeout(checkStyleAndAddLayers, 100);
				return;
			}

			try {
				// Add or update overlay layers
				Object.entries(overlayStates).forEach(([layerId, isVisible]) => {
					const layer = mapLayers.getOverlayLayer(layerId as OverlayLayerId);
					if (!layer) return;

					// First, remove any existing layers that use this source
					const style = layer.style as StyleSpecification;
					if (style?.layers) {
						style.layers.forEach((layerDef: LayerSpecification) => {
							if (map.getLayer(layerDef.id)) {
								map.removeLayer(layerDef.id);
							}
						});
					}

					// Then remove the source
					if (map.getSource(layerId)) {
						map.removeSource(layerId);
					}

					// Add source and layer if style is defined and overlay is enabled
					if (style?.sources && isVisible) {
						// Add sources
						Object.entries(style.sources).forEach(([sourceId, source]) => {
							if (!map.getSource(sourceId)) {
								map.addSource(sourceId, source);
							}
						});

						// Add layers
						style.layers?.forEach((layerDef: LayerSpecification) => {
							if (!map.getLayer(layerDef.id)) {
								map.addLayer({
									...layerDef,
									layout: {
										...layerDef.layout,
										visibility: 'visible'
									}
								});
							} else {
								map.setLayoutProperty(layerDef.id, 'visibility', 'visible');
							}
						});
					}
				});

				setIsAddingLayers(false);
			} catch (error) {
				console.error('Error adding overlay layers:', error);
				setIsAddingLayers(false);
				setTimeout(checkStyleAndAddLayers, 200);
			}
		};

		checkStyleAndAddLayers();
	}, [overlayStates, isAddingLayers, mapRef]);

	const handleLayerToggle = useCallback((layerId: string, isVisible: boolean) => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		// Handle base layer changes
		if (mapLayers.getBaseLayer(layerId as BaseLayerId)) {
			if (layerId !== currentBaseLayer) {
				setCurrentBaseLayer(layerId as BaseLayerId);
				const currentOverlayStates = { ...overlayStates };
				const newStyle = mapLayers.getBaseLayer(layerId as BaseLayerId)?.style;

				if (newStyle) {
					map.setStyle(newStyle);
					map.once('style.load', () => {
						setOverlayStates(currentOverlayStates);
						setTimeout(() => {
							addOverlayLayers();
						}, 200);
					});
				}
			}
		}
		// Handle overlay toggles
		else if (mapLayers.getOverlayLayer(layerId as OverlayLayerId)) {
			setOverlayStates(prev => ({
				...prev,
				[layerId]: isVisible
			}));

			const layer = mapLayers.getOverlayLayer(layerId as OverlayLayerId);
			if (!layer) return;

			const style = layer.style as StyleSpecification;
			if (style?.layers) {
				// If turning off, remove layers and sources
				if (!isVisible) {
					// First remove all layers
					style.layers.forEach((layerDef: LayerSpecification) => {
						if (map.getLayer(layerDef.id)) {
							map.removeLayer(layerDef.id);
						}
					});
					// Then remove the source
					if (map.getSource(layerId)) {
						map.removeSource(layerId);
					}
				} else {
					// If turning on, add the layer
					addOverlayLayers();
				}
			}
		}
	}, [addOverlayLayers, overlayStates, mapRef, currentBaseLayer]);

	// Initialize layers when map loads
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const handleStyleData = () => {
			const checkAndAddLayers = () => {
				if (!map.isStyleLoaded() || !map.areTilesLoaded()) {
					setTimeout(checkAndAddLayers, 100);
					return;
				}
				addOverlayLayers();
			};
			checkAndAddLayers();
		};

		map.on('style.load', handleStyleData);
		
		if (map.isStyleLoaded()) {
			if (map.areTilesLoaded()) {
				addOverlayLayers();
			} else {
				map.once('idle', addOverlayLayers);
			}
		}

		return () => {
			map.off('style.load', handleStyleData);
		};
	}, [addOverlayLayers, mapRef]);

	return {
		currentBaseLayer,
		overlayStates,
		handleLayerToggle,
	};
}; 