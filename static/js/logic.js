// Create a map object
let myMap = L.map("map", {
    center: [0, 0],
    zoom: 2
  });
  
  // Add a tile layer (base map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(myMap);
  
  // Load the GeoJSON data
  d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function(data) {
    createFeatures(data.features);
  });
  
  function createFeatures(earthquakeData) {
    function onEachFeature(feature, layer) {
      layer.bindPopup(`<h3>${feature.properties.place}</h3><hr>
                       <p>Magnitude: ${feature.properties.mag}</p>
                       <p>Depth: ${feature.geometry.coordinates[2]} km</p>
                       <p>Date: ${new Date(feature.properties.time)}</p>`);
    }
  
    let earthquakes = L.geoJSON(earthquakeData, {
      onEachFeature: onEachFeature,
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
          radius: getRadius(feature.properties.mag),
          fillColor: getColor(feature.geometry.coordinates[2]),
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      }
    });
  
    earthquakes.addTo(myMap);
    createLegend();
  }
  
  function getColor(depth) {
    return depth > 90 ? "#800026" :
           depth > 70 ? "#BD0026" :
           depth > 50 ? "#E31A1C" :
           depth > 30 ? "#FC4E2A" :
           depth > 10 ? "#FD8D3C" :
                        "#FFEDA0";
  }
  
  function getRadius(magnitude) {
    return magnitude * 4;
  }
  
  function createLegend() {
    let legend = L.control({position: "bottomright"});
    
    legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let depths = [-10, 10, 30, 50, 70, 90];
      let labels = [];
  
      for (let i = 0; i < depths.length; i++) {
        div.innerHTML +=
          '<i style="background:' + getColor(depths[i] + 1) + '"></i> ' +
          depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + ' km<br>' : '+ km');
      }
      return div;
    };
  
    legend.addTo(myMap);
  }