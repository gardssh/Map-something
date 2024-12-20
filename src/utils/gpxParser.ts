import { DOMParser } from '@xmldom/xmldom';
import type { LineString } from 'geojson';

export function parseGPX(gpxString: string): { 
  name: string;
  geometry: LineString;
} {
  const parser = new DOMParser();
  const gpx = parser.parseFromString(gpxString, 'text/xml');
  
  // Get track points
  const trackPoints = Array.from(gpx.getElementsByTagName('trkpt'));
  const coordinates: [number, number][] = trackPoints.map(trkpt => {
    const lat = parseFloat(trkpt.getAttribute('lat') || '0');
    const lon = parseFloat(trkpt.getAttribute('lon') || '0');
    return [lon, lat]; // GeoJSON uses [longitude, latitude] order
  });

  // Get name from GPX file or use default
  const nameElements = gpx.getElementsByTagName('name');
  const name = nameElements.length > 0 
    ? nameElements[0].textContent || `Route ${new Date().toLocaleDateString()}`
    : `Route ${new Date().toLocaleDateString()}`;

  return {
    name,
    geometry: {
      type: 'LineString',
      coordinates
    }
  };
} 