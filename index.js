// Tree data with multipliers for erosion, drainage, carbon, and nursery
const trees = [
  {
    species: 'Narrow Leaf Ironbark',
    erosionMultiplier: 1.1,
    drainageMultiplier: 1.0,
    carbonMultiplier: 1.05,
    nurseryMultiplier: 1.08,
    carbonUptake: 0.5
  },
  {
    species: 'Tallow Wood',
    erosionMultiplier: 1.15,
    drainageMultiplier: 1.1,
    carbonMultiplier: 1.1,
    nurseryMultiplier: 1.12,
    carbonUptake: 1.3
  },
  {
    species: 'Bunya Pine',
    erosionMultiplier: 1.2,
    drainageMultiplier: 1.2,
    carbonMultiplier: 1.2,
    nurseryMultiplier: 1.15,
    carbonUptake: 1
  },
  {
    species: 'Blue Gum',
    erosionMultiplier: 1.05,
    drainageMultiplier: 1.05,
    carbonMultiplier: 1.0,
    nurseryMultiplier: 1.1,
    carbonUptake: 3.47
  }
];

const carbonUptake = {
  'Narrow Leaf Ironbark': 0.5,
  'Tallow Wood': 1.3,
  'Bunya Pine': 1,
  'Blue Gum': 3.47
}

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

const debug = document.getElementById("debug");
debug.innerHTML =
  "<pre>" +
    JSON.stringify(trees,null, 2) + 
    JSON.stringify(conditions, null, 2) +
    JSON.stringify(sunExposures, null, 2) +
  "</pre>"


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
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      document.getElementById('manual-lat').value = lat;
      document.getElementById('manual-lon').value = lon;

      document.getElementById('location-info').textContent = `Latitude: ${lat}, Longitude: ${lon}`;

      // Remove the previous marker if it exists
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }

      // Add a new marker at the clicked location
      currentMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup('Selected Location')
        .openPopup();
    });

    await fetchKoalaSightings();
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

        L.marker([lat, lon]).addTo(map)
          .bindPopup(`<b>Koala ID:</b> ${koalaID}<br><b>Observed Date:</b> ${observedDate}`)
          .openPopup();
      });
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

    const selectElement = document.getElementById('species');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    const treeName = selectedOption.textContent;
    const coUptake = carbonUptake[treeName] * trunkSize;

    const lat = parseFloat(document.getElementById('manual-lat').value);
    const lon = parseFloat(document.getElementById('manual-lon').value);

    if (isNaN(selectedTreeMultiplier) || isNaN(conditionMultiplier) || isNaN(sunExposureMultiplier) || isNaN(trunkSize) || trunkSize <= 0) {
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

      let finalTreeMultiplier = selectedTreeMultiplier;
      if (withinRadius) {
        finalTreeMultiplier *= 1.1; 
      }

      const finalValue = baseValue * conditionMultiplier * finalTreeMultiplier * sunExposureMultiplier * (trunkSize / 100) + coUptake;

      document.getElementById('result').innerHTML = `The estimated value of the tree over 20 years is $${finalValue.toFixed(2)}.`;
    } catch (error) {
      console.error('Error fetching GeoJSON data:', error);
    }
  });

  document.getElementById('get-location').addEventListener('click', function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        document.getElementById('manual-lat').value = lat;
        document.getElementById('manual-lon').value = lon;

        document.getElementById('location-info').textContent = `Latitude: ${lat}, Longitude: ${lon}`;
        map.setView([lat, lon], 13); 
        if (currentMarker) {
          map.removeLayer(currentMarker);
        }
        currentMarker = L.marker([lat, lon]).addTo(map)
          .bindPopup('Your Location')
          .openPopup();
      }, function(error) {
        document.getElementById('location-info').textContent = `Error: ${error.message}`;
      });
    } else {
      document.getElementById('location-info').textContent = 'Geolocation is not supported by this browser.';
    }
  });
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

