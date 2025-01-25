// Cache for terrain tiles
const tileCache = new Map<string, ImageData>();

interface TileCoordinate {
    x: number;
    y: number;
    zoom: number;
    pixelX: number;
    pixelY: number;
}

function getTileCoordinate(lng: number, lat: number, zoom: number): TileCoordinate {
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor(
        ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
            Math.pow(2, zoom)
    );

    // Calculate precise pixel coordinates within the tile
    const pixelX = Math.floor((((lng + 180) / 360) * Math.pow(2, zoom) * 256) % 256);
    const pixelY = Math.floor(
        (((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
            Math.pow(2, zoom) *
            256) %
            256
    );

    return { x, y, zoom, pixelX, pixelY };
}

export async function getElevationsFromTile(coordinates: [number, number][], zoom: number): Promise<number[]> {
    // Group coordinates by tile
    const tileGroups = new Map<string, { coord: TileCoordinate; lngLat: [number, number] }[]>();

    coordinates.forEach(([lng, lat]) => {
        const tileCoord = getTileCoordinate(lng, lat, zoom);
        const tileKey = `${tileCoord.zoom}/${tileCoord.x}/${tileCoord.y}`;
        if (!tileGroups.has(tileKey)) {
            tileGroups.set(tileKey, []);
        }
        tileGroups.get(tileKey)?.push({ coord: tileCoord, lngLat: [lng, lat] });
    });

    const elevations: number[] = new Array(coordinates.length).fill(0);
    const coordToIndex = new Map(coordinates.map((coord, i) => [coord.toString(), i]));

    // Process each tile
    for (const [tileKey, points] of tileGroups) {
        const [zoom, x, y] = tileKey.split('/').map(Number);

        // Check cache first
        let imageData = tileCache.get(tileKey);

        if (!imageData) {
            const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tileKey}@2x.pngraw?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            ctx.drawImage(bitmap, 0, 0);
            imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
            tileCache.set(tileKey, imageData);
        }

        // Process all points in this tile
        points.forEach(({ coord, lngLat }) => {
            const pixelIndex = (coord.pixelY * imageData!.width + coord.pixelX) * 4;
            const r = imageData!.data[pixelIndex];
            const g = imageData!.data[pixelIndex + 1];
            const b = imageData!.data[pixelIndex + 2];

            const elevation = -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
            const index = coordToIndex.get(lngLat.toString());
            if (index !== undefined) {
                elevations[index] = elevation;
            }
        });
    }

    return elevations;
}

export function fixElevationErrors(elevations: number[]): number[] {
    const fixedElevations = [...elevations];
    let lastValidIndex = -1;
    let nextValidIndex = -1;

    for (let i = 0; i < fixedElevations.length; i++) {
        if (fixedElevations[i] <= 0) {
            // Find next valid elevation if we haven't already
            if (nextValidIndex <= i) {
                nextValidIndex = i + 1;
                while (nextValidIndex < fixedElevations.length && fixedElevations[nextValidIndex] <= 0) {
                    nextValidIndex++;
                }
            }

            // Interpolate between last valid and next valid points
            if (lastValidIndex >= 0 && nextValidIndex < fixedElevations.length) {
                const ratio = (i - lastValidIndex) / (nextValidIndex - lastValidIndex);
                fixedElevations[i] =
                    fixedElevations[lastValidIndex] +
                    (fixedElevations[nextValidIndex] - fixedElevations[lastValidIndex]) * ratio;
            } else if (lastValidIndex >= 0) {
                // If no next valid point, use last valid elevation
                fixedElevations[i] = fixedElevations[lastValidIndex];
            } else if (nextValidIndex < fixedElevations.length) {
                // If no previous valid point, use next valid elevation
                fixedElevations[i] = fixedElevations[nextValidIndex];
            }
        } else {
            lastValidIndex = i;
        }
    }

    return fixedElevations;
}

export function calculateElevationStats(elevations: number[]) {
    let totalAscent = 0;
    let totalDescent = 0;
    let maxElevation = Math.max(...elevations);
    let minElevation = Math.min(...elevations);
    let lastElevation = elevations[0];

    for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - lastElevation;
        if (diff > 0) totalAscent += diff;
        if (diff < 0) totalDescent += Math.abs(diff);
        lastElevation = elevations[i];
    }

    return {
        totalAscent: Math.round(totalAscent),
        totalDescent: Math.round(totalDescent),
        maxElevation: Math.round(maxElevation),
        minElevation: Math.round(minElevation)
    };
} 