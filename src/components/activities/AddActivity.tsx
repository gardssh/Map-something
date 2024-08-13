

function addActivites(aktivitet, map, coordinates) {
    // Legg til ruter fra json-filen til kartet
    map.addSource("route" + String(aktivitet.id), {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });
  
    map.addLayer({
      id: "route" + String(aktivitet.id),
      type: "line",
      source: "route" + String(aktivitet.id),
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": getActivityColor(aktivitet.type),
        "line-width": 8,
        "line-opacity": 0.5,
      },
    });
  }