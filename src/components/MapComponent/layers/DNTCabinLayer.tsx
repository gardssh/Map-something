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

	const handlePopupClose = useCallback(() => {
		setSelectedCabin(null);
	}, []);

	const handleMouseMove = useCallback(
		(e: mapboxgl.MapMouseEvent) => {
			if (!map || isMobile) return;

			// Check if the layer exists before querying features
			if (!map.getLayer('dnt-cabins-touch')) return;

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
		[map, isMobile]
	);

	const handleMouseLeave = useCallback(() => {
		if (!map) return;
		setHoveredCabin(null);
		map.getCanvas().style.cursor = '';
	}, [map]);

	const handleMapClick = useCallback(
		(e: mapboxgl.MapMouseEvent | mapboxgl.MapLayerTouchEvent) => {
			if (!map) return;
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
		[map]
	);

	useEffect(() => {
		if (!map) return;

		map.on('click', handleMapClick);
		map.on('touchend', handleMapClick);
		map.on('mousemove', handleMouseMove);
		map.on('mouseleave', handleMouseLeave);

		return () => {
			map.off('click', handleMapClick);
			map.off('touchend', handleMapClick);
			map.off('mousemove', handleMouseMove);
			map.off('mouseleave', handleMouseLeave);
		};
	}, [map, handleMapClick, handleMouseMove, handleMouseLeave]);

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
						'circle-radius': [
							'interpolate',
							['linear'],
							['zoom'],
							0,
							25, // At zoom level 0, radius is 25px
							10,
							30, // At zoom level 10, radius is 30px
							15,
							35, // At zoom level 15, radius is 35px
							20,
							40, // At zoom level 20, radius is 40px
						],
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
						'circle-radius': [
							'interpolate',
							['linear'],
							['zoom'],
							0,
							15, // At zoom level 0, radius is 15px
							10,
							20, // At zoom level 10, radius is 20px
							15,
							25, // At zoom level 15, radius is 25px
							20,
							30, // At zoom level 20, radius is 30px
						],
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
				>
					<Card className="border-0 shadow-none">
						<CardHeader>
							<h3 className="text-lg font-semibold">{selectedCabin.properties.name}</h3>
							<p className="text-sm text-muted-foreground">{selectedCabin.properties.serviceLevel}</p>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<span className="text-sm">Capacity: {selectedCabin.properties.capacity} beds</span>
									{selectedCabin.properties.requiresKey && <Lock aria-label="Requires key" className="h-4 w-4" />}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm">{selectedCabin.properties.openingHours}</span>
								</div>
								<a
									href={selectedCabin.properties.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-blue-600 hover:underline"
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
