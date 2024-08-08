'use client'
import Head from 'next/head'
import Map from "react-map-gl";

export const MapComponent = () => {
  return (
    <div className="h-full w-full">
    <Head>
      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css' rel='stylesheet' />

    </Head>
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
    mapLib={import('mapbox-gl')}
    initialViewState={{
      longitude: 8.296987,
      latitude: 61.375172,
      zoom: 14
    }}
    style={{width: "100%", height: "100%"}}
    mapStyle="mapbox://styles/gardsh/clyqbqyjs005s01phc7p2a8dm"
  />

    </div>
  );
}
