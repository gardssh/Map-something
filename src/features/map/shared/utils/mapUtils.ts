import type { MapRef } from 'react-map-gl';

export const handleBounds = (mapRef: React.RefObject<MapRef>, coordinates: [number, number][]) => {
	if (!mapRef.current || !coordinates.length) return;

	const bounds = coordinates.reduce(
		(bounds, coord) => {
			return [
				[Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
				[Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])],
			];
		},
		[
			[coordinates[0][0], coordinates[0][1]],
			[coordinates[0][0], coordinates[0][1]],
		]
	);

	mapRef.current.fitBounds(bounds as [[number, number], [number, number]], {
		padding: 50,
		duration: 1000,
	});
}; 