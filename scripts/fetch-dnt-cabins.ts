import * as fs from 'fs';
import * as path from 'path';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

const query = `
[out:json][timeout:25];
area["ISO3166-1"="NO"][admin_level=2]->.norway;
(
  // DNT cabins with various tourism tags
  node["operator"="DNT"]["tourism"="alpine_hut"](area.norway);
  node["operator"="DNT"]["tourism"="wilderness_hut"](area.norway);
  node["operator"="Den Norske Turistforening"]["tourism"="alpine_hut"](area.norway);
  node["operator"="Den Norske Turistforening"]["tourism"="wilderness_hut"](area.norway);
  
  // Include cabins with DNT in the network tag
  node["network"="Den Norske Turistforening"](area.norway);
  
  // Include cabins with DNT classification
  node["dnt:classification"](area.norway);
  
  // Include cabins with DNT operator variants
  node["operator"~"DNT.*"]["tourism"~"hut|cabin|alpine_hut|wilderness_hut"](area.norway);
  node["operator"~".*Turistforening"]["tourism"~"hut|cabin|alpine_hut|wilderness_hut"](area.norway);
);
out body;
>;
out skel qt;
`;

async function fetchDNTCabins() {
  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to GeoJSON
    const features = data.elements.map((element: any) => ({
      type: 'Feature',
      properties: {
        name: element.tags.name || 'Unknown',
        service_level: element.tags['dnt:classification'] || element.tags.service_level || 'unknown',
        operator: element.tags.operator || element.tags.network || 'DNT',
        capacity: parseInt(element.tags.capacity || '0', 10),
        booking_required: element.tags.booking === 'required' || element.tags['dnt:lock'] === 'yes',
        fee: element.tags.fee === 'yes',
        fireplace: element.tags.fireplace === 'yes',
      },
      geometry: {
        type: 'Point',
        coordinates: [element.lon, element.lat],
      },
    }));

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    // Save to file
    const outputPath = path.join(process.cwd(), 'src/data/dnt-cabins.json');
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    console.log(`Saved ${features.length} cabins to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching DNT cabins:', error);
  }
}

fetchDNTCabins(); 