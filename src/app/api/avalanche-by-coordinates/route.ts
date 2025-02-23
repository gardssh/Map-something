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
        const debugInfo = {
            coordinates: { lat, lng },
            dates: { startDate, endDate },
            requestInfo: { headers: {} } as any,
            responseInfo: { headers: {}, status: 0, rawResponse: '' } as any
        };
        
        const url = `https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/AvalancheWarningByCoordinates/Detail/${lat}/${lng}/1/${startDate}/${endDate}`;
        debugInfo.requestInfo.url = url;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'MapViewer/1.0 (https://kart.gardsh.no)',
                'Origin': 'https://www.varsom.no',
                'Referer': 'https://www.varsom.no/',
                'X-Requested-With': 'XMLHttpRequest'
            },
            cache: 'no-cache'
        });

        debugInfo.responseInfo.status = response.status;
        debugInfo.responseInfo.headers = Object.fromEntries(response.headers.entries());
        
        // Get the raw response text first
        const rawResponse = await response.text();
        debugInfo.responseInfo.rawResponse = rawResponse.substring(0, 1000); // First 1000 characters

        // Check if the response looks like HTML
        if (rawResponse.trim().toLowerCase().startsWith('<!doctype') || rawResponse.includes('<html')) {
            return NextResponse.json({ 
                success: false, 
                message: 'Received HTML response instead of JSON',
                debug: debugInfo
            }, { status: 500 });
        }

        // Try to parse the response as JSON
        let data;
        try {
            data = JSON.parse(rawResponse);
        } catch (parseError: any) {
            return NextResponse.json({ 
                success: false, 
                message: 'Failed to parse JSON response',
                debug: debugInfo,
                parseError: parseError.message
            }, { status: 500 });
        }
        
        if (!data) {
            return NextResponse.json({ 
                success: false, 
                message: 'No data received from API',
                debug: debugInfo
            }, { status: 404 });
        }

        const processedData = Array.isArray(data) ? data : [data];

        if (!processedData.every(forecast => forecast && typeof forecast === 'object' && 'ValidFrom' in forecast)) {
            return NextResponse.json({ 
                success: false, 
                message: 'Invalid forecast data structure',
                debug: debugInfo,
                receivedData: processedData
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            data: processedData,
            debug: debugInfo
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to fetch forecast',
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : error
        }, { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
} 