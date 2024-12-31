import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lng = searchParams.get('x');
    const lat = searchParams.get('y');
    
    if (!lng || !lat) {
        return NextResponse.json({ success: false, message: 'Coordinates are required' }, { status: 400 });
    }

    // Get today's and tomorrow's dates in ISO format
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = today.toISOString().split('T')[0];
    const endDate = tomorrow.toISOString().split('T')[0];

    try {
        console.log(`Fetching forecast for coordinates: lat=${lat}, lng=${lng}`);
        
        // Switch the order: latitude first, then longitude
        const response = await fetch(
            `https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/AvalancheWarningByCoordinates/Detail/${lat}/${lng}/1/${startDate}/${endDate}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data);

        // Ensure we have valid data
        if (!data) {
            return NextResponse.json({ success: false, message: 'No data received from API' }, { status: 404 });
        }

        // If data is an array, return it directly; if it's a single object, wrap it in an array
        const processedData = Array.isArray(data) ? data : [data];

        // Validate that we have the expected data structure
        if (!processedData.every(forecast => forecast && typeof forecast === 'object' && 'ValidFrom' in forecast)) {
            console.error('Invalid forecast data structure:', processedData);
            return NextResponse.json({ success: false, message: 'Invalid forecast data structure' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: processedData });
    } catch (error) {
        console.error('Error fetching avalanche forecast:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to fetch forecast' },
            { status: 500 }
        );
    }
} 