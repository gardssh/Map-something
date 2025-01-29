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

	const addOverlayLayers = useCallback(async () => {
		if (!mapRef.current || isAddingLayers) return;
		const map = mapRef.current.getMap();

		setIsAddingLayers(true);

		const checkStyleAndAddLayers = async () => {
			if (!map.isStyleLoaded()) {
				setTimeout(checkStyleAndAddLayers, 100);
				return;
			}

			try {
				// Add or update overlay layers
				for (const [layerId, isVisible] of Object.entries(overlayStates)) {
					const layer = mapLayers.getOverlayLayer(layerId as OverlayLayerId);
					if (!layer) continue;

					const style = layer.style as StyleSpecification;
					if (!style?.sources || !style?.layers) continue;

					// Add sources if they don't exist
					for (const [sourceId, sourceConfig] of Object.entries(style.sources)) {
						if (!map.getSource(sourceId)) {
							map.addSource(sourceId, sourceConfig);
						}
					}

					// Add or update layers
					for (const layerDef of style.layers) {
						const existingLayer = map.getLayer(layerDef.id);
						
						if (existingLayer) {
							// Update visibility of existing layer
							map.setLayoutProperty(
								layerDef.id,
								'visibility',
								isVisible ? 'visible' : 'none'
							);
						} else if (isVisible) {
							// Add new layer if it should be visible
							map.addLayer({
								...layerDef,
								layout: {
									...layerDef.layout,
									visibility: 'visible'
								}
							});
						}
					}

					// If layer is not visible, ensure all its layers are hidden
					if (!isVisible) {
						style.layers.forEach(layerDef => {
							if (map.getLayer(layerDef.id)) {
								map.setLayoutProperty(layerDef.id, 'visibility', 'none');
							}
						});
					}
				}

				setIsAddingLayers(false);
			} catch (error) {
				console.error('Error adding overlay layers:', error);
				setIsAddingLayers(false);
				setTimeout(checkStyleAndAddLayers, 200);
			}
		};

		await checkStyleAndAddLayers();
	}, [mapRef, overlayStates, isAddingLayers]);

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
			const layer = mapLayers.getOverlayLayer(layerId as OverlayLayerId);
			if (!layer) return;

			const style = layer.style as StyleSpecification;
			if (!style?.sources || !style?.layers) return;

			// Update state
			setOverlayStates(prev => {
				const newState = {
					...prev,
					[layerId]: isVisible
				};

				// Immediately add sources if they don't exist
				Object.entries(style.sources).forEach(([sourceId, sourceConfig]) => {
					if (!map.getSource(sourceId)) {
						try {
							map.addSource(sourceId, sourceConfig);
						} catch (error) {
							console.error('Error adding source:', error);
						}
					}
				});

				// Immediately add or update layers
				style.layers.forEach(layerDef => {
					const existingLayer = map.getLayer(layerDef.id);
					
					if (existingLayer) {
						map.setLayoutProperty(
							layerDef.id,
							'visibility',
							isVisible ? 'visible' : 'none'
						);
					} else if (isVisible) {
						try {
							map.addLayer({
								...layerDef,
								layout: {
									...layerDef.layout,
									visibility: 'visible'
								}
							});
						} catch (error) {
							console.error('Error adding layer:', error);
						}
					}
				});

				return newState;
			});
		}
	}, [mapRef, currentBaseLayer]);

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