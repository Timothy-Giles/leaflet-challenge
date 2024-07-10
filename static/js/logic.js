// Define base map layers
let satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
});

let outdoors = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the map object
let myMap = L.map("map", {
  center: [0, 0],
  zoom: 2,
  layers: [satellite]  // Set default layer
});

// Create layer groups for earthquakes and tectonic boundaries
let earthquakes = new L.LayerGroup();
let tectonicBoundaries = new L.LayerGroup();

// Define base maps object for layer control
let baseMaps = {
  "Satellite": satellite,
  "Grayscale": grayscale,
  "Outdoors": outdoors
};

// Define overlay maps object for layer control
let overlayMaps = {
  "Earthquakes": earthquakes,
  "Tectonic Boundaries": tectonicBoundaries
};

// Add layer control to the map
L.control.layers(baseMaps, overlayMaps).addTo(myMap);

// Load earthquake data from USGS GeoJSON feed
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function(data) {
  createFeatures(data.features);
});

// Load and process the tectonic boundary data
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_steps.json").then(function(stepsData) {
  L.geoJSON(stepsData, {
      style: function(feature) {
          return {
              color: getBoundaryColor(feature.properties.STEPCLASS),
              weight: 2,
              opacity: 0.8
          };
      },
      onEachFeature: function(feature, layer) {
          layer.bindPopup(`<strong>Boundary Type:</strong> ${feature.properties.STEPCLASS}<br>
                           <strong>Plates:</strong> ${feature.properties.PLATEBOUND}<br>
                           <strong>Velocity:</strong> ${feature.properties.VELOCITYLE} mm/year`);
      }
  }).addTo(tectonicBoundaries);
  
  tectonicBoundaries.addTo(myMap);
  createTectonicLegend();
});

// Function to create earthquake features
function createFeatures(earthquakeData) {
  function onEachFeature(feature, layer) {
      layer.bindPopup(`<h3>${feature.properties.place}</h3><hr>
                       <p>Magnitude: ${feature.properties.mag}</p>
                       <p>Depth: ${feature.geometry.coordinates[2]} km</p>
                       <p>Date: ${new Date(feature.properties.time)}</p>`);
  }

  L.geoJSON(earthquakeData, {
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
  }).addTo(earthquakes);

  earthquakes.addTo(myMap);
  createEarthquakeLegend();
}

// Function to determine color based on earthquake depth
function getColor(depth) {
  return depth > 90 ? "#800026" :
         depth > 70 ? "#BD0026" :
         depth > 50 ? "#E31A1C" :
         depth > 30 ? "#FC4E2A" :
         depth > 10 ? "#FD8D3C" :
                      "#FFEDA0";
}

// Function to determine radius based on earthquake magnitude
function getRadius(magnitude) {
  return magnitude * 4;
}

// Function to create the earthquake legend
function createEarthquakeLegend() {
  let legend = L.control({position: "bottomright"});
  
  legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let depths = [-10, 10, 30, 50, 70, 90];
      let labels = [];

      div.innerHTML = "<h4>Earthquake Depth</h4>";

      for (let i = 0; i < depths.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(depths[i] + 1) + '"></i> ' +
              depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + ' km<br>' : '+ km');
      }
      return div;
  };

  legend.addTo(myMap);
}

// Function to determine color based on tectonic boundary type
function getBoundaryColor(stepClass) {
  switch(stepClass) {
      case 'SUB': return '#FF0000';  // Subduction zones
      case 'RIF': return '#00FF00';  // Rifts
      case 'OSR': return '#0000FF';  // Oceanic spreading ridges
      case 'OTF': return '#FFFF00';  // Oceanic transform faults
      default: return '#808080';     // Other types
  }
}

// Function to create the tectonic boundary legend
function createTectonicLegend() {
  let legend = L.control({position: "bottomleft"});
  
  legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let types = ['SUB', 'RIF', 'OSR', 'OTF', 'Other'];
      let labels = ['Subduction', 'Rift', 'Oceanic Spreading Ridge', 'Oceanic Transform Fault', 'Other'];

      div.innerHTML = "<h4>Boundary Types</h4>";

      for (let i = 0; i < types.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getBoundaryColor(types[i]) + '"></i> ' +
              labels[i] + '<br>';
      }
      return div;
  };

  legend.addTo(myMap);
}