'use client';

import { useState, useCallback, useEffect } from 'react';
import { Source, Layer, Popup, useMap } from 'react-map-gl';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useDNTCabins } from '@/hooks/useDNTCabins';
import type { CabinFeature } from '@/types/dnt-cabins';

export function DNTCabinLayer({ visible = true }: { visible?: boolean }) {
	const { current: map } = useMap();
	const cabinData = useDNTCabins();
	const [selectedCabin, setSelectedCabin] = useState<CabinFeature | null>(null);

	useEffect(() => {
		if (!map) return;

		const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['dnt-cabins-touch'],
			});

			if (features.length > 0) {
				const cabin = features[0] as unknown as CabinFeature;
				if (cabin.properties) {
					setSelectedCabin(cabin);
				}
			} else {
				setSelectedCabin(null);
			}
		};

		map.on('click', handleMapClick);

		return () => {
			map.off('click', handleMapClick);
		};
	}, [map]);

	return (
		<>
			<Source type="geojson" data={cabinData}>
				{/* Touch layer for better interaction */}
				<Layer
					id="dnt-cabins-touch"
					type="circle"
					layout={{
						visibility: visible ? 'visible' : 'none',
					}}
					paint={{
						'circle-color': '#000000',
						'circle-radius': 12,
						'circle-opacity': 0,
					}}
				/>

				{/* Visual cabin dot layer */}
				<Layer
					id="dnt-cabins"
					type="circle"
					layout={{
						visibility: visible ? 'visible' : 'none',
					}}
					paint={{
						'circle-color': '#e60000',
						'circle-radius': 6,
						'circle-stroke-width': 2,
						'circle-stroke-color': '#ffffff',
					}}
				/>

				{/* Text label layer */}
				<Layer
					id="dnt-cabins-label"
					type="symbol"
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
				/>
			</Source>

			{selectedCabin && (
				<Popup
					longitude={selectedCabin.geometry.coordinates[0]}
					latitude={selectedCabin.geometry.coordinates[1]}
					onClose={() => setSelectedCabin(null)}
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
