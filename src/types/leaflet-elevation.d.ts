import * as L from 'leaflet';

declare module 'leaflet' {
    interface Control {
        elevation(options?: {
            position?: string;
            theme?: string;
            width?: number;
            height?: number;
            margins?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            };
            useHeightIndicator?: boolean;
            interpolation?: string;
            collapsed?: boolean;
            detached?: boolean;
        }): Control & {
            loadChart(geojsonLayer: L.GeoJSON): void;
        };
    }
} 