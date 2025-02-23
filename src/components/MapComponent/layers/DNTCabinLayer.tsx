'use client';

import { useState, useCallback, useEffect } from 'react';
import { Source, Layer, Popup, useMap } from 'react-map-gl';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useDNTCabins } from '@/hooks/useDNTCabins';
import type { CabinFeature } from '@/types/dnt-cabins';
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'react-map-gl';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function DNTCabinLayer({ visible = false }: { visible?: boolean }) {
	const { current: map } = useMap();
	const cabinData = useDNTCabins();
	const [selectedCabin, setSelectedCabin] = useState<CabinFeature | null>(null);
	const [hoveredCabin, setHoveredCabin] = useState<CabinFeature | null>(null);
	const { isMobile } = useResponsiveLayout();
	const [touchStartPoint, setTouchStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
	const [layersInitialized, setLayersInitialized] = useState(false);

	const handlePopupClose = useCallback(() => {
		setSelectedCabin(null);
	}, []);

	const handleMouseMove = useCallback(
		(e: mapboxgl.MapMouseEvent) => {
			if (!map || isMobile || !layersInitialized) return;

			const features = map.queryRenderedFeatures(e.point, {
				layers: ['dnt-cabins-touch'],
			});

			if (features.length > 0) {
				const cabin = features[0] as unknown as CabinFeature;
				if (cabin.properties) {
					setHoveredCabin(cabin);
					map.getCanvas().style.cursor = 'pointer';
				}
			} else {
				setHoveredCabin(null);
				map.getCanvas().style.cursor = '';
			}
		},
		[map, isMobile, layersInitialized]
	);

	const handleMouseLeave = useCallback(() => {
		if (!map) return;
		setHoveredCabin(null);
		map.getCanvas().style.cursor = '';
	}, [map]);

	const handleTouchStart = useCallback((e: mapboxgl.MapLayerTouchEvent) => {
		setTouchStartPoint({ x: e.point.x, y: e.point.y });
		setTouchStartTime(Date.now());
	}, []);

	const handleTouchEnd = useCallback(
		(e: mapboxgl.MapLayerTouchEvent) => {
			if (!map || !layersInitialized) return;

			// Check if this was a drag or a tap
			if (touchStartPoint && touchStartTime) {
				const dx = e.point.x - touchStartPoint.x;
				const dy = e.point.y - touchStartPoint.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const duration = Date.now() - touchStartTime;

				// Reset touch tracking
				setTouchStartPoint(null);
				setTouchStartTime(null);

				// If moved more than 10 pixels or took longer than 300ms, treat as drag and ignore
				if (distance > 10 || duration > 300) {
					return;
				}

				// Add a small delay to ensure map has finished moving
				setTimeout(() => {
					const features = map.queryRenderedFeatures(e.point, {
						layers: ['dnt-cabins-touch', 'dnt-cabins-touch-mobile'],
					});

					if (features.length > 0) {
						const cabin = features[0] as unknown as CabinFeature;
						if (cabin.properties) {
							setSelectedCabin(cabin);
						}
					} else {
						setSelectedCabin(null);
					}
				}, 50);
			}
		},
		[map, touchStartPoint, touchStartTime, layersInitialized]
	);

	const handleMapClick = useCallback(
		(e: mapboxgl.MapMouseEvent | mapboxgl.MapLayerTouchEvent) => {
			if (!map || !layersInitialized) return;
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['dnt-cabins-touch', 'dnt-cabins-touch-mobile'],
			});

			if (features.length > 0) {
				const cabin = features[0] as unknown as CabinFeature;
				if (cabin.properties) {
					setSelectedCabin(cabin);
				}
			} else {
				setSelectedCabin(null);
			}
		},
		[map, layersInitialized]
	);

	useEffect(() => {
		if (!map || !cabinData.features.length) return;

		// Wait for the source and layers to be added
		const checkLayers = () => {
			const hasSource = map.getSource('dnt-cabins');
			const hasMainLayer = map.getLayer('dnt-cabins');
			const hasTouchLayer = map.getLayer('dnt-cabins-touch');
			const hasTouchMobileLayer = map.getLayer('dnt-cabins-touch-mobile');
			const hasLabelLayer = map.getLayer('dnt-cabins-label');

			if (hasSource && hasMainLayer && hasTouchLayer && hasTouchMobileLayer && hasLabelLayer) {
				setLayersInitialized(true);
			}
		};

		// Check when source data or style changes
		map.on('sourcedata', checkLayers);
		map.on('styledata', checkLayers);

		// Initial check
		checkLayers();

		// Add event listeners only after initialization
		if (layersInitialized) {
			map.on('click', handleMapClick);
			map.on('touchstart', handleTouchStart);
			map.on('touchend', handleTouchEnd);
			map.on('mousemove', handleMouseMove);
			map.on('mouseleave', handleMouseLeave);
		}

		return () => {
			map.off('sourcedata', checkLayers);
			map.off('styledata', checkLayers);
			if (layersInitialized) {
				map.off('click', handleMapClick);
				map.off('touchstart', handleTouchStart);
				map.off('touchend', handleTouchEnd);
				map.off('mousemove', handleMouseMove);
				map.off('mouseleave', handleMouseLeave);
			}
		};
	}, [
		map,
		cabinData.features.length,
		layersInitialized,
		handleMapClick,
		handleTouchStart,
		handleTouchEnd,
		handleMouseMove,
		handleMouseLeave,
	]);

	if (!cabinData.features.length) return null;

	return (
		<>
			<Source id="dnt-cabins" type="geojson" data={cabinData}>
				{/* Large touch target layer for mobile */}
				<Layer
					id="dnt-cabins-touch-mobile"
					type="circle"
					source="dnt-cabins"
					layout={{
						visibility: visible ? 'visible' : 'none',
					}}
					paint={{
						'circle-color': '#000000',
						'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 25, 10, 30, 15, 35, 20, 40],
						'circle-opacity': 0,
					}}
					minzoom={0}
					maxzoom={24}
				/>

				{/* Desktop hover touch target */}
				<Layer
					id="dnt-cabins-touch"
					type="circle"
					source="dnt-cabins"
					layout={{
						visibility: visible ? 'visible' : 'none',
					}}
					paint={{
						'circle-color': '#000000',
						'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 10, 20, 15, 25, 20, 30],
						'circle-opacity': 0,
					}}
					minzoom={0}
					maxzoom={24}
				/>

				{/* Visual cabin dot layer */}
				<Layer
					id="dnt-cabins"
					type="circle"
					source="dnt-cabins"
					layout={{
						visibility: visible ? 'visible' : 'none',
					}}
					paint={{
						'circle-color': '#e60000',
						'circle-radius': 6,
						'circle-stroke-width': 2,
						'circle-stroke-color': '#ffffff',
						'circle-opacity': 1,
						'circle-stroke-opacity': 1,
					}}
					minzoom={0}
					maxzoom={24}
				/>

				{/* Text label layer */}
				<Layer
					id="dnt-cabins-label"
					type="symbol"
					source="dnt-cabins"
					layout={{
						visibility: visible ? 'visible' : 'none',
						'text-field': ['get', 'name'],
						'text-offset': [0, 1.2],
						'text-anchor': 'top',
						'text-size': 12,
					}}
					paint={{
						'text-color': '#404040',
						'text-halo-color': '#ffffff',
						'text-halo-width': 2,
					}}
					minzoom={0}
					maxzoom={24}
				/>
			</Source>

			{/* Hover popup */}
			{hoveredCabin && !selectedCabin && !isMobile && (
				<Popup
					longitude={hoveredCabin.geometry.coordinates[0]}
					latitude={hoveredCabin.geometry.coordinates[1]}
					closeButton={false}
					closeOnClick={false}
					anchor="bottom"
					className="p-0 overflow-hidden [&_.mapboxgl-popup-content]:p-2"
				>
					<div className="text-sm">
						<div className="font-semibold">{hoveredCabin.properties.name}</div>
						<div className="text-muted-foreground">{hoveredCabin.properties.serviceLevel}</div>
					</div>
				</Popup>
			)}

			{/* Click popup */}
			{selectedCabin && (
				<Popup
					longitude={selectedCabin.geometry.coordinates[0]}
					latitude={selectedCabin.geometry.coordinates[1]}
					onClose={handlePopupClose}
					anchor="bottom"
					className="p-0 overflow-hidden [&_.mapboxgl-popup-content]:p-0 [&_.mapboxgl-popup-close-button]:p-2 [&_.mapboxgl-popup-close-button]:mr-1"
					maxWidth="300px"
				>
					<Card className="border-0 shadow-none max-w-[300px]">
						<CardHeader className="space-y-1">
							<h3 className="text-lg font-semibold break-words">{selectedCabin.properties.name}</h3>
							<p className="text-sm text-muted-foreground break-words">{selectedCabin.properties.serviceLevel}</p>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<span className="text-sm">Capacity: {selectedCabin.properties.capacity} beds</span>
									{selectedCabin.properties.requiresKey && (
										<Lock aria-label="Requires key" className="h-4 w-4 shrink-0" />
									)}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm break-words">{selectedCabin.properties.openingHours}</span>
								</div>
								<a
									href={selectedCabin.properties.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-blue-600 hover:underline break-words"
								>
									View on ut.no
								</a>
							</div>
						</CardContent>
					</Card>
				</Popup>
			)}
		</>
	);
}
