import type { StyleSpecification } from 'mapbox-gl';

export type BaseLayerId = 'outdoors' | 'satellite' | 'norge-topo' | 'norge-flyfoto';
export type OverlayLayerId = 'bratthet' | 'snoskred' | 'custom-tileset';
export type LayerId = BaseLayerId | OverlayLayerId;

export interface LayerDefinition {
  id: LayerId;
  name: string;
  isBase: boolean;
  style: string | StyleSpecification;
}

// Base layer definitions
const baseLayers: LayerDefinition[] = [
  {
    id: 'outdoors',
    name: 'Outdoors',
    isBase: true,
    style: 'mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    isBase: true,
    style: 'mapbox://styles/mapbox/satellite-v9'
  },
  {
    id: 'norge-topo',
    name: 'Norge Topo',
    isBase: true,
    style: {
      version: 8,
      glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
      sources: {
        'norge-topo': {
          type: 'raster',
          tiles: ['https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="http://www.kartverket.no/">Kartverket</a>'
        },
        'mapbox-dem': {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
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
    }
  },
  {
    id: 'norge-flyfoto',
    name: 'Norge Flyfoto',
    isBase: true,
    style: {
      version: 8,
      glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
      sources: {
        'norge-flyfoto': {
          type: 'raster',
          tiles: ['https://opencache.statkart.no/gatekeeper/gk/gk.open_nib_web_mercator_wmts_v2?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=Nibcache_web_mercator_v2&STYLE=default&FORMAT=image/png&TILEMATRIXSET=default028mm&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'],
          tileSize: 256,
          attribution: '&copy; <a href="http://www.kartverket.no/">Kartverket</a>'
        },
        'mapbox-dem': {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        }
      },
      layers: [
        {
          id: 'norge-flyfoto-layer',
          type: 'raster',
          source: 'norge-flyfoto',
          paint: { 'raster-opacity': 1 }
        }
      ]
    }
  }
];

// Overlay layer definitions with source configurations
const overlayLayers: LayerDefinition[] = [
  {
    id: 'bratthet',
    name: 'Bratthet',
    isBase: false,
    style: {
      version: 8,
      sources: {
        'bratthet': {
          type: 'raster',
          tiles: [
            'https://nve.geodataonline.no/arcgis/services/Bratthet/MapServer/WMSServer?service=WMS&request=GetMap&version=1.1.1&layers=Bratthet_snoskred&styles=&format=image/png&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&transparent=true'
          ],
          tileSize: 256
        }
      },
      layers: [{
        id: 'bratthet-layer',
        type: 'raster',
        source: 'bratthet',
        paint: { 'raster-opacity': 0.6 }
      }]
    }
  },
  {
    id: 'snoskred',
    name: 'Snøskred',
    isBase: false,
    style: {
      version: 8,
      sources: {
        'snoskred': {
          type: 'raster',
          tiles: [
            'https://gis3.nve.no/arcgis/rest/services/wmts/KastWMTS/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox-epsg-3857}&bboxSR=EPSG:3857&imageSR=EPSG:3857&size=256,256&f=image&layers=show:0,1,2,3,4'
          ],
          tileSize: 256
        }
      },
      layers: [{
        id: 'snoskred-layer',
        type: 'raster',
        source: 'snoskred',
        paint: { 'raster-opacity': 0.6 }
      }]
    }
  },
  {
    id: 'custom-tileset',
    name: 'Heatmap 2000m Norge',
    isBase: false,
    style: {
      version: 8,
      sources: {},
      layers: []
    }
  }
];

export const DEFAULT_BASE_LAYER: BaseLayerId = 'norge-topo';

export const mapLayers = {
  base: baseLayers,
  overlay: overlayLayers,
  all: [...baseLayers, ...overlayLayers],
  getLayer: (id: LayerId) => [...baseLayers, ...overlayLayers].find(layer => layer.id === id),
  getBaseLayer: (id: BaseLayerId) => baseLayers.find(layer => layer.id === id),
  getOverlayLayer: (id: OverlayLayerId) => overlayLayers.find(layer => layer.id === id)
}; 