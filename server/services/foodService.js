const https = require('https');

const GEOAPIFY_BASE = 'https://api.geoapify.com/v2/places';

function callGeoapify(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

// Food & Cafe specific category detection
function isFoodOrCafePlace(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return false;
  }
  
  // Prioritize cafes, coffee shops, bakeries, desserts
  const foodCafeKeywords = [
    'cafe', 'coffee', 'bakery', 'dessert', 'ice_cream',
    'pastry', 'tea', 'fast_food', 'food_court', 'catering'
  ];
  
  return categories.some(category => {
    const categoryLower = category.toLowerCase();
    return foodCafeKeywords.some(keyword => 
      categoryLower.includes(keyword)
    );
  });
}

async function fetchNearbyFood(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates');
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Geoapify API key missing');
  }

  const radius = 5000;

  // Use Geoapify categories for cafes, coffee shops, bakeries, and food
  const categories = 'catering.cafe,catering.fast_food,catering.food_court';
  
  // IMPORTANT: Geoapify uses longitude,latitude order in circle filter
  const url =
    `${GEOAPIFY_BASE}` +
    `?categories=${categories}` +
    `&filter=circle:${longitude},${latitude},${radius}` +
    `&bias=proximity:${longitude},${latitude}` +
    `&limit=20` +
    `&apiKey=${apiKey}`;

  console.log('====================================');
  console.log('Food & Cafe request coordinates:');
  console.log('Latitude :', latitude);
  console.log('Longitude:', longitude);
  console.log('Food & Cafe Geoapify URL (without API key):', 
    `${GEOAPIFY_BASE}?categories=${categories}&filter=circle:${longitude},${latitude},${radius}&bias=proximity:${longitude},${latitude}&limit=20`);
  console.log('====================================');

  const result = await callGeoapify(url);

  console.log('Geoapify HTTP status:', result.status || 'N/A');

  if (!result || !Array.isArray(result.features)) {
    console.log('No results received from Geoapify');
    return [];
  }

  console.log('Total features:', result.features.length);

  // Debug: Log every result
  result.features.forEach((feature, index) => {
    const props = feature.properties || {};
    console.log({
      name: props.name || props.poi?.name || 'N/A',
      categories: props.categories || [],
      address: props.formatted || 'N/A',
      lat: props.lat,
      lon: props.lon
    });
  });

  const normalizedFood = [];
  const seen = new Set();

  result.features.forEach((feature) => {
    const props = feature.properties || {};
    const name = props.name || props.poi?.name || '';

    // Only require name and coordinates for a valid result
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return;
    }

    const coords = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates
      : [props.lon, props.lat];

    const foodLat = typeof props.lat === 'number' ? props.lat : coords[1] ?? null;
    const foodLon = typeof props.lon === 'number' ? props.lon : coords[0] ?? null;

    if (foodLat === null || foodLon === null) {
      return;
    }

    // Accept if categories contain any food/cafe related terms
    const categories = props.categories || [];
    const hasFoodCategory = isFoodOrCafePlace(categories);

    if (!hasFoodCategory) {
      console.log(`Filtered out: ${name} - Categories:`, categories);
      return;
    }

    const key = `${name.toLowerCase()}-${foodLat}-${foodLon}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const distance =
      typeof props.distance === 'number' && !Number.isNaN(props.distance)
        ? props.distance
        : calculateDistanceMeters(latitude, longitude, foodLat, foodLon);

    // Build address from available fields
    let formatted = props.formatted || '';
    if (!formatted) {
      const parts = [];
      if (props.address_line1) parts.push(props.address_line1);
      if (props.address_line2) parts.push(props.address_line2);
      if (props.street) parts.push(props.street);
      if (props.city) parts.push(props.city);
      formatted = parts.join(', ') || '';
    }

    normalizedFood.push({
      name: name.trim(),
      formatted: formatted,
      latitude: foodLat,
      longitude: foodLon,
      placeId: props.place_id ? String(props.place_id) : props.osm_id ? String(props.osm_id) : '',
      categories: categories,
      distance,
    });
  });

  console.log('Number of valid food & cafes after filtering:', normalizedFood.length);

  // Sort by distance (nearest first)
  normalizedFood.sort((a, b) => a.distance - b.distance);

  // Return maximum 20 results
  return normalizedFood.slice(0, 20);
}

module.exports = {
  fetchNearbyFood,
};
