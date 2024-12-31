import { NextResponse } from 'next/server';

const BASE_URL = 'https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api';

export async function GET() {
  console.log('API route started');
  
  try {
    const testRegion = {
      Id: 3009,
      Name: "Nord-Troms",
      TypeId: 10,
      TypeName: "A"
    };
    console.log('Using test region:', testRegion);

    // Use current date as start date and add 3 days for end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    // Fetch detailed forecast
    const forecastUrl = `${BASE_URL}/AvalancheWarningByRegion/Detail/${testRegion.Id}/1/${formatDate(startDate)}/${formatDate(endDate)}`;
    console.log('Fetching detailed forecast from:', forecastUrl);

    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    console.log('Forecast response status:', forecastResponse.status);
    
    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.log('Error response:', errorText);
      throw new Error(`Failed to fetch forecast: ${forecastResponse.status}`);
    }

    const forecast = await forecastResponse.json();
    console.log('Full API Response Structure:', JSON.stringify({
      RegId: forecast[0]?.RegId,
      RegionId: forecast[0]?.RegionId,
      RegionName: forecast[0]?.RegionName,
      DangerLevel: forecast[0]?.DangerLevel,
      ValidFrom: forecast[0]?.ValidFrom,
      ValidTo: forecast[0]?.ValidTo,
      NextWarningTime: forecast[0]?.NextWarningTime,
      PublishTime: forecast[0]?.PublishTime,
      MainText: forecast[0]?.MainText,
      AvalancheProblems: forecast[0]?.AvalancheProblems?.map((p: any) => ({
        AvalancheType: p.AvalancheType,
        AvalancheProblemId: p.AvalancheProblemId,
        ValidExpositions: p.ValidExpositions,
        ValidHeights: p.ValidHeights,
        ExposedHeight: p.ExposedHeight,
        ExposedHeightFill: p.ExposedHeightFill,
        Probability: p.Probability,
        ProbabilityId: p.ProbabilityId,
        Destructive_size: p.Destructive_size,
        DestructiveSizeId: p.DestructiveSizeId,
        AvalancheExtTID: p.AvalancheExtTID,
        AvalancheExtName: p.AvalancheExtName,
        AvalCauseId: p.AvalCauseId,
        AvalCauseName: p.AvalCauseName,
        Comment: p.Comment,
        AvalTriggerSimpleName: p.AvalTriggerSimpleName,
        AvalPropagationName: p.AvalPropagationName,
        AvalReleaseHeightName: p.AvalReleaseHeightName,
        AvalancheProbabilityName: p.AvalancheProbabilityName,
        DestructiveSizeName: p.DestructiveSizeName
      }))
    }, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      data: forecast,
      regionName: testRegion.Name
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 