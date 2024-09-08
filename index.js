// Tree data with multipliers for erosion, drainage, carbon, and nursery
const trees = [
  {
    species: 'Narrow Leaf Ironbark',
    erosionMultiplier: 1.1,
    drainageMultiplier: 1.0,
    carbonMultiplier: 1.05,
    nurseryMultiplier: 1.08,
  },
  {
    species: 'Tallow Wood',
    erosionMultiplier: 1.15,
    drainageMultiplier: 1.1,
    carbonMultiplier: 1.1,
    nurseryMultiplier: 1.12
  },
  {
    species: 'Bunya Pine',
    erosionMultiplier: 1.2,
    drainageMultiplier: 1.2,
    carbonMultiplier: 1.2,
    nurseryMultiplier: 1.15
  },
  {
    species: 'Blue Gum',
    erosionMultiplier: 1.05,
    drainageMultiplier: 1.05,
    carbonMultiplier: 1.0,
    nurseryMultiplier: 1.1
  }
];

const carbonUptake = {
  'Narrow Leaf Ironbark': 0.5,
  'Tallow Wood': 1.3,
  'Bunya Pine': 1,
  'Blue Gum': 3.47
}

const regions = [
  { name: 'Noosa', multiplier: 0.8 },
  { name: 'Maroochydore', multiplier: 0.62 },
  { name: 'Mooloolah', multiplier: 0.55 },
  { name: 'Pumicestone', multiplier: 0.74 },
  { name: 'Caboolture', multiplier: 0.61 },
  { name: 'Stanley', multiplier: 0.63 },
  { name: 'Upper Brisbane', multiplier: 0.37 },
  { name: 'Pine', multiplier: 0.73 },
  { name: 'Central', multiplier: 0.83 },
  { name: 'Western', multiplier: 0.83 },
  { name: 'Mid Brisbane', multiplier: 0.7 },
  { name: 'Lower Brisbane', multiplier: 0.43 },
  { name: 'Eastern', multiplier: 0.84 },
  { name: 'Southern', multiplier: 0.7 },
  { name: 'Lockyer', multiplier: 0.31 },
  { name: 'Redland', multiplier: 0.55 }
];

const sunExposures = [
  { exposure: 'Full Sun', multiplier: 1.2 },
  { exposure: 'Partial Shade', multiplier: 1.0 },
  { exposure: 'Full Shade', multiplier: 0.8 }
];

const conditions = [
  { condition: 'Excellent', multiplier: 1.5 },
  { condition: 'Good', multiplier: 1.3 },
  { condition: 'Fair', multiplier: 1.1 },
  { condition: 'Poor', multiplier: 0.9 },
  { condition: 'Critical', multiplier: 0.7 },
  { condition: 'Dying', multiplier: 0.5 },
  { condition: 'Dead', multiplier: 0.3 }
];

// Base value for calculation
const baseValue = 1000;

// Calculate the species multiplier based on all factors
function calculateSpeciesMultiplier(tree) {
  const { erosionMultiplier, drainageMultiplier, carbonMultiplier, nurseryMultiplier } = tree;
  return erosionMultiplier * drainageMultiplier * carbonMultiplier * nurseryMultiplier;
}

// Populate select options 
function populateSelectOptions(id, options, labelKey, valueKey) {
  const select = document.getElementById(id);
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = valueKey === 'multiplier' ? option[valueKey] : JSON.stringify(option);
    opt.textContent = option[labelKey];
    select.appendChild(opt);
  });
}

// Prepare species multipliers for dropdown options
const speciesOptions = trees.map(tree => ({
  species: tree.species,
  multiplier: calculateSpeciesMultiplier(tree)
}));

// Populate species and conditions
populateSelectOptions('species', speciesOptions, 'species', 'multiplier');
populateSelectOptions('condition', conditions, 'condition', 'multiplier');
populateSelectOptions('sun-exposure', sunExposures, 'exposure', 'multiplier');
populateSelectOptions('regions', regions, 'name', 'multiplier');

// const debug = document.getElementById("debug");
// debug.innerHTML =
//   "<pre>" +
//     JSON.stringify(trees,null, 2) + 
//     JSON.stringify(conditions, null, 2) +
//     JSON.stringify(sunExposures, null, 2) +
//   "</pre>"


document.addEventListener('DOMContentLoaded', function () {
  const baseValue = 1000;
  let map;
  let currentMarker = null; // Variable to keep track of the current marker

  async function initializeMap() {
    map = L.map('map').setView([-27.4698, 153.0251], 13); // Brisbane coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    map.on('click', function(e) {
      const lat = e.latlng.lat.toFixed(4);
      const lon = e.latlng.lng.toFixed(4);

      document.getElementById('manual-lat').value = lat;
      document.getElementById('manual-lon').value = lon;

      document.getElementById('location-info').textContent = `Latitude: ${lat}, Longitude: ${lon}`;

      // Remove the previous marker if it exists
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }

      // Add a new marker at the clicked location
      currentMarker = L.marker([lat, lon], { icon: redIcon }).addTo(map)
        .bindPopup('Selected Location')
        .openPopup();
    });

    await fetchKoalaSightings();
    await fetchGeoJSONData();
    addLegend();
  }

  async function fetchKoalaSightings() {
    try {
      const response = await fetch('https://bla-ce.github.io/bush-balance/koala.geojson');
      const data = await response.json();

      data.features.forEach(feature => {
        const lat = feature.geometry.coordinates[1];
        const lon = feature.geometry.coordinates[0];
        const koalaID = feature.properties.Koala_ID;
        const observedDate = new Date(feature.properties.Observed_Date).toLocaleDateString();

        L.marker([lat, lon], { icon: greyIcon }).addTo(map)
          .bindPopup(`<b>Koala ID:</b> ${koalaID}<br><b>Observed Date:</b> ${observedDate}`)
          .openPopup();
      });
    } catch (error) {
      console.error('Error fetching GeoJSON data:', error);
    }
  }

  async function fetchGeoJSONData() {
    try {
      const response = await fetch('https://bla-ce.github.io/bush-balance/erosion.geojson');
      const data = await response.json();

      L.geoJSON(data, {
        style: function (feature) {
          return {color: 'blue', weight: 2};
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(`<b>Description:</b> ${feature.properties.OVL2_DESC}`);
        }
      }).addTo(map);
    } catch (error) {
      console.error('Error fetching GeoJSON data:', error);
    }
  }

  initializeMap();

  document.getElementById('tree-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const selectedTreeMultiplier = parseFloat(document.getElementById('species').value);
    const conditionMultiplier = parseFloat(document.getElementById('condition').value);
    const sunExposureMultiplier = parseFloat(document.getElementById('sun-exposure').value);
    const trunkSize = parseFloat(document.getElementById('trunk-size').value);
    const regionMultiplier = parseFloat(document.getElementById('regions').value);

    const selectElement = document.getElementById('species');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    const treeName = selectedOption.textContent;
    const coUptake = carbonUptake[treeName] * trunkSize;

    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lon = parseFloat(document.getElementById('manual-lon').value);

    if (isNaN(selectedTreeMultiplier) || isNaN(conditionMultiplier) || isNaN(sunExposureMultiplier) || isNaN(trunkSize) || trunkSize <= 0 || isNaN(regionMultiplier)) {
      alert('Please fill in all fields with valid values.');
      return;
    }

    try {
      const response = await fetch('https://bla-ce.github.io/bush-balance/koala.geojson');
      const data = await response.json();

      let withinRadius = false;
      data.features.forEach(feature => {
        const koalaLat = feature.geometry.coordinates[1];
        const koalaLon = feature.geometry.coordinates[0];
        const distance = calculateDistance(lat, lon, koalaLat, koalaLon);
        if (distance <= 1) {
          withinRadius = true;
        }
      });

      let finalTreeMultiplier = selectedTreeMultiplier * regionMultiplier;
      if (withinRadius) {
        finalTreeMultiplier *= 1.1; 
      }

      const finalValue = baseValue * conditionMultiplier * finalTreeMultiplier * sunExposureMultiplier * (trunkSize / 100) + coUptake;

      const resultModalBody = document.getElementById('resultModalBody');
      resultModalBody.textContent = `The estimated value of the tree over 20 years is $${finalValue.toFixed(2)}.`;

      // Trigger the modal
      const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
      resultModal.show();
    } catch (error) {
      console.error('Error fetching GeoJSON data:', error);
    }
  });

  // Define the red marker icon
  const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], // size of the icon
    iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
    popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    shadowSize: [41, 41], // size of the shadow
  });

  // Define the grey icon for koalas
  const greyIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], // size of the icon
    iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
    popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    shadowSize: [41, 41], // size of the shadow
  });

  document.getElementById('get-location').addEventListener('click', function(e) {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);

        document.getElementById('manual-lat').value = lat;
        document.getElementById('manual-lon').value = lon;

        document.getElementById('location-info').textContent = `Latitude: ${lat}, Longitude: ${lon}`;
        map.setView([lat, lon], 13); 
        if (currentMarker) {
          map.removeLayer(currentMarker);
        }
        currentMarker = L.marker([lat, lon], { icon: redIcon }).addTo(map)
          .bindPopup('Your Location')
          .openPopup();
      }, function(error) {
        document.getElementById('location-info').textContent = `Error: ${error.message}`;
      });
    } else {
      document.getElementById('location-info').textContent = 'Geolocation is not supported by this browser.';
    }
  });

  // Add a legend to the map
  function addLegend() {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'info legend');
      div.classList.add('legend');
      div.innerHTML = `
      <i style="background: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png'); background-size: 25px 41px; width: 25px; height: 41px; display: inline-block;"></i> Koala Sighted<br>
      <i style="background: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'); background-size: 25px 41px; width: 25px; height: 41px; display: inline-block;"></i> Your Location<br>
      <i style="background: blue; width: 20px; height: 20px; display: inline-block;"></i> Coastal Hazard Erosion
    `;
      return div;
    };

    legend.addTo(map);
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

