'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
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
	const isProcessingRef = useRef(false);

	// Function to get active overlays
	const getActiveOverlays = useCallback(() => {
		return Object.entries(overlayStates)
			.filter(([_, isActive]) => isActive)
			.map(([id]) => id as OverlayLayerId);
	}, [overlayStates]);

	const waitForMapReady = useCallback((map: mapboxgl.Map) => {
		return new Promise<void>((resolve) => {
			const checkMapReady = () => {
				if (!map.isStyleLoaded()) {
					setTimeout(checkMapReady, 100);
					return;
				}

				const style = map.getStyle();
				if (!style) {
					setTimeout(checkMapReady, 100);
					return;
				}

				// For WMTS services, we don't need to wait for terrain
				const isWMTS = style.sources && Object.values(style.sources).some(
					source => (source as any).type === 'raster'
				);

				if (!isWMTS) {
					const terrainSource = map.getSource('mapbox-dem');
					if (style.terrain && !terrainSource) {
						setTimeout(checkMapReady, 100);
						return;
					}
				}

				resolve();
			};
			checkMapReady();
		});
	}, []);

	// Function to apply a single overlay
	const applyOverlay = useCallback(async (map: mapboxgl.Map, layerId: OverlayLayerId) => {
		const layer = mapLayers.getOverlayLayer(layerId);
		if (!layer) return;

		const style = layer.style as StyleSpecification;
		if (!style?.sources || !style?.layers) return;

		try {
			// Remove existing overlay first to ensure clean state
			const existingLayers = style.layers.map(l => l.id);
			existingLayers.forEach(id => {
				if (map.getLayer(id)) {
					map.removeLayer(id);
				}
			});

			Object.keys(style.sources).forEach(sourceId => {
				if (map.getSource(sourceId)) {
					map.removeSource(sourceId);
				}
			});

			// Add sources
			Object.entries(style.sources).forEach(([sourceId, sourceConfig]) => {
				if (!map.getSource(sourceId)) {
					map.addSource(sourceId, sourceConfig);
				}
			});

			// Find the first activity layer to use as reference for insertion
			const activityLayers = [
				'foot-sports',
				'cycle-sports',
				'water-sports',
				'winter-sports',
				'other-sports'
			];

			let beforeLayerId: string | undefined;
			for (const layerId of activityLayers) {
				if (map.getLayer(layerId)) {
					beforeLayerId = layerId;
					break;
				}
			}

			// Add layers before activity layers
			style.layers.forEach(layerDef => {
				if (!map.getLayer(layerDef.id)) {
					map.addLayer({
						...layerDef,
						layout: {
							...layerDef.layout,
							visibility: 'visible'
						}
					}, beforeLayerId); // Add before the first activity layer
				}
			});
		} catch (error) {
			console.error(`Error applying overlay ${layerId}:`, error);
		}
	}, []);

	const removeOverlay = useCallback((map: mapboxgl.Map, layerId: OverlayLayerId) => {
		const layer = mapLayers.getOverlayLayer(layerId);
		if (!layer) return;

		const style = layer.style as StyleSpecification;
		if (!style?.layers) return;

		try {
			style.layers.forEach(layerDef => {
				if (map.getLayer(layerDef.id)) {
					map.removeLayer(layerDef.id);
				}
			});

			if (style.sources) {
				Object.keys(style.sources).forEach(sourceId => {
					if (map.getSource(sourceId)) {
						map.removeSource(sourceId);
					}
				});
			}
		} catch (error) {
			console.error(`Error removing overlay ${layerId}:`, error);
		}
	}, []);

	const handleLayerToggle = useCallback((layerId: string, isVisible: boolean) => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		// Handle base layer changes
		if (mapLayers.getBaseLayer(layerId as BaseLayerId)) {
			if (layerId !== currentBaseLayer) {
				const newStyle = mapLayers.getBaseLayer(layerId as BaseLayerId)?.style;
				if (!newStyle) return;

				// Get currently active overlays before style change
				const activeOverlays = getActiveOverlays();

				// Set new base layer immediately
				setCurrentBaseLayer(layerId as BaseLayerId);

				// For WMTS services, we need to force a complete style rebuild
				const isWMTS = (newStyle as StyleSpecification).sources && 
					Object.values((newStyle as StyleSpecification).sources).some(
						source => source.type === 'raster'
					);

				if (isWMTS) {
					// Force complete style rebuild for WMTS
					map.setStyle(newStyle, { diff: false, localIdeographFontFamily: '', localFontFamily: '' });
				} else {
					// Use style diffing for regular styles
					map.setStyle(newStyle);
				}

				// Wait for style load and reapply overlays
				const handleStyleLoad = async () => {
					try {
						await waitForMapReady(map);
						
						// Reapply each active overlay
						for (const overlayId of activeOverlays) {
							await applyOverlay(map, overlayId);
						}
					} catch (error) {
						console.error('Error reapplying overlays:', error);
					}
				};

				map.once('style.load', handleStyleLoad);
			}
		}
		// Handle overlay toggles
		else if (mapLayers.getOverlayLayer(layerId as OverlayLayerId)) {
			const overlayId = layerId as OverlayLayerId;
			
			setOverlayStates(prev => ({ ...prev, [overlayId]: isVisible }));
			
			if (isVisible) {
				if (map.isStyleLoaded()) {
					applyOverlay(map, overlayId);
				} else {
					map.once('style.load', () => applyOverlay(map, overlayId));
				}
			} else {
				if (map.isStyleLoaded()) {
					removeOverlay(map, overlayId);
				}
			}
		}
	}, [mapRef, currentBaseLayer, getActiveOverlays, applyOverlay, removeOverlay, waitForMapReady]);

	// Initialize overlays when map first loads
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current.getMap();

		const initializeOverlays = async () => {
			try {
				await waitForMapReady(map);
				const activeOverlays = getActiveOverlays();
				for (const overlayId of activeOverlays) {
					await applyOverlay(map, overlayId);
				}
			} catch (error) {
				console.error('Error initializing overlays:', error);
			}
		};

		if (map.isStyleLoaded()) {
			initializeOverlays();
		} else {
			map.once('style.load', initializeOverlays);
		}
	}, [mapRef, getActiveOverlays, applyOverlay, waitForMapReady]);

	return {
		currentBaseLayer,
		overlayStates,
		handleLayerToggle,
	};
}; 