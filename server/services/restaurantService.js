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

// More flexible food/restaurant detection
function isFoodPlace(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return false;
  }
  
  // Food-related keywords to check for in categories
  const foodKeywords = [
    'restaurant', 'cafe', 'food', 'catering', 'fast_food', 
    'bistro', 'diner', 'eatery', 'pizza', 'burger', 
    'sushi', 'barbecue', 'bbq', 'bakery', 'coffee',
    'tea', 'ice_cream', 'dessert', 'pub', 'bar'
  ];
  
  return categories.some(category => {
    const categoryLower = category.toLowerCase();
    return foodKeywords.some(keyword => 
      categoryLower.includes(keyword)
    );
  });
}

// Exclusions to filter out non-food places
const EXCLUDED_KEYWORDS = [
  'hotel', 'motel', 'hostel', 'resort', 'accommodation',
  'shop', 'store', 'market', 'supermarket', 'grocery',
  'pharmacy', 'medical', 'hospital', 'clinic',
  'office', 'company', 'business', 'bank',
  'tourist', 'attraction', 'museum', 'monument', 'statue',
  'park', 'garden', 'nature', 'forest',
  'school', 'university', 'college', 'education',
  'government', 'police', 'fire', 'station'
];

function shouldExclude(name, categories) {
  const nameLower = (name || '').toLowerCase();
  const categoriesLower = (categories || []).map(c => c.toLowerCase());
  
  // Check exclusions in name
  if (EXCLUDED_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return true;
  }
  
  // Check exclusions in categories
  if (categoriesLower.some(category => 
    EXCLUDED_KEYWORDS.some(keyword => category.includes(keyword))
  )) {
    return true;
  }
  
  return false;
}

async function fetchNearbyRestaurants(lat, lon) {
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

  // Use correct Geoapify restaurant categories
  const categories = 'catering.restaurant,catering.fast_food,catering.food_court';
  
  // IMPORTANT: Geoapify uses longitude,latitude order in circle filter
  const url =
    `${GEOAPIFY_BASE}` +
    `?categories=${categories}` +
    `&filter=circle:${longitude},${latitude},${radius}` +
    `&bias=proximity:${longitude},${latitude}` +
    `&limit=20` +
    `&apiKey=${apiKey}`;

  console.log('====================================');
  console.log('Restaurant request coordinates:');
  console.log('Latitude :', latitude);
  console.log('Longitude:', longitude);
  console.log('Restaurant Geoapify URL (without API key):', 
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

  const normalizedRestaurants = [];
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

    const restaurantLat = typeof props.lat === 'number' ? props.lat : coords[1] ?? null;
    const restaurantLon = typeof props.lon === 'number' ? props.lon : coords[0] ?? null;

    if (restaurantLat === null || restaurantLon === null) {
      return;
    }

    // Accept if categories contain any of the restaurant categories
    const categories = props.categories || [];
    const hasRestaurantCategory = categories.some(cat => 
      cat === 'catering.restaurant' || 
      cat === 'catering.fast_food' || 
      cat === 'catering.food_court' ||
      cat.startsWith('catering.')
    );

    if (!hasRestaurantCategory) {
      console.log(`Filtered out: ${name} - Categories:`, categories);
      return;
    }

    const key = `${name.toLowerCase()}-${restaurantLat}-${restaurantLon}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const distance =
      typeof props.distance === 'number' && !Number.isNaN(props.distance)
        ? props.distance
        : calculateDistanceMeters(latitude, longitude, restaurantLat, restaurantLon);

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

    normalizedRestaurants.push({
      name: name.trim(),
      formatted: formatted,
      latitude: restaurantLat,
      longitude: restaurantLon,
      placeId: props.place_id ? String(props.place_id) : props.osm_id ? String(props.osm_id) : '',
      categories: categories,
      distance,
    });
  });

  console.log('Number of valid restaurants after filtering:', normalizedRestaurants.length);

  // Sort by distance (nearest first)
  normalizedRestaurants.sort((a, b) => a.distance - b.distance);

  // Return maximum 20 results
  return normalizedRestaurants.slice(0, 20);
}

module.exports = {
  fetchNearbyRestaurants,
};
