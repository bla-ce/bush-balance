// Tree data with multipliers for erosion, drainage, carbon, and nursery
const trees = [
  {
    species: 'Narrow Leaf Ironbark',
    erosionMultiplier: 1.1,
    drainageMultiplier: 1.0,
    carbonMultiplier: 1.05,
    nurseryMultiplier: 1.08
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

// Populate select options dynamically
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
debug.innerHTML = "<pre>"+JSON.stringify(trees,null, 2) + JSON.stringify(conditions, null, 2) +"</pre>"

// Handle form submission and calculation
document.getElementById('tree-form').addEventListener('submit', function(event) {
  event.preventDefault();

  // Get selected tree multiplier and condition multiplier
  const selectedTreeMultiplier = parseFloat(document.getElementById('species').value);
  const conditionMultiplier = parseFloat(document.getElementById('condition').value);
  const sunExposureMultiplier = parseFloat(document.getElementById('sun-exposure').value);
  const trunkSize = parseFloat(document.getElementById('trunk-size').value);

  // Check if all values are valid
  if (isNaN(selectedTreeMultiplier) || isNaN(conditionMultiplier) || isNaN(sunExposureMultiplier) || isNaN(trunkSize) || trunkSize <= 0) {
    alert('Please fill in all fields with valid values.');
    return;
  }

  // Calculation logic
  const finalValue = baseValue * conditionMultiplier * selectedTreeMultiplier * sunExposureMultiplier * (trunkSize / 100);

  // Display result
  document.getElementById('result').innerHTML = `The estimated value of the tree is $${finalValue.toFixed(2)}.`;
});

// Handle getting the current location
document.getElementById('get-location').addEventListener('click', function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      document.getElementById('location-info').textContent = `Latitude: ${lat}, Longitude: ${lon}`;
    }, function(error) {
      document.getElementById('location-info').textContent = `Error: ${error.message}`;
    });
  } else {
    document.getElementById('location-info').textContent = 'Geolocation is not supported by this browser.';
  }
});

