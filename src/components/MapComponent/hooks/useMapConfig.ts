'use client';

import { useCallback } from 'react';
import type { MapRef } from 'react-map-gl';
import { StyleSpecification } from 'mapbox-gl';

export interface MapConfigOptions {
	mapRef: React.MutableRefObject<MapRef | undefined> | React.RefObject<MapRef>;
}

export const useMapConfig = ({ mapRef }: MapConfigOptions) => {
	const norgeTopoStyle: StyleSpecification = {
		version: 8,
		glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
		sources: {
			'norge-topo': {
				type: 'raster',
				tiles: ['https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'],
				tileSize: 256,
				attribution: '&copy; <a href="http://www.kartverket.no/">Kartverket</a>'
			}
		},
		layers: [
			{
				id: 'norge-topo-layer',
				type: 'raster',
				source: 'norge-topo',
				paint: { 'raster-opacity': 1 }
			}
		]
	};

	const mapStyles = {
		'satellite': 'mapbox://styles/mapbox/satellite-v9',
		'norge-topo': norgeTopoStyle,
		'default': 'mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm'
	} as const;

	const availableLayers = [
		{ id: 'default', name: 'Outdoors', isBase: true },
		{ id: 'satellite', name: 'Satellite', isBase: true },
		{ id: 'norge-topo', name: 'Norge Topo', isBase: true },
		{ id: 'bratthet', name: 'Bratthet', isBase: false },
		{ id: 'snoskred', name: 'Snøskred', isBase: false },
		{ id: 'custom-tileset', name: 'Heatmap 2000m Norge', isBase: false },
	];

	const initialMapState = {
		longitude: 8.296987,
		latitude: 61.375172,
		zoom: 14,
		pitch: 0,
	};

	const mapSettings = (isDrawing: boolean) => ({
		renderWorldCopies: false,
		maxTileCacheSize: 50,
		trackResize: false,
		dragRotate: true,
		pitchWithRotate: true,
		dragPan: true,
		touchZoomRotate: true,
		touchPitch: true,
		interactiveLayerIds: isDrawing ? [] : ['waypoints-layer', 'activities-layer', 'saved-routes-layer'],
	});

	return { 
		mapStyle: norgeTopoStyle, 
		mapStyles,
		mapSettings, 
		availableLayers, 
		initialMapState 
	};
};