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

async function fetchNearbyHotels(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates');
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Geoapify API key missing');
  }

  const categories = ['accommodation.hotel', 'accommodation'].join(',');
  const radius = 5000;

  const url =
    `${GEOAPIFY_BASE}` +
    `?categories=${categories}` +
    `&filter=circle:${longitude},${latitude},${radius}` +
    `&limit=15` +
    `&apiKey=${apiKey}`;

  const result = await callGeoapify(url);

  if (!result || !Array.isArray(result.features)) {
    return [];
  }

  const normalizedHotels = [];
  const seen = new Set();

  result.features.forEach((feature) => {
    const props = feature.properties || {};
    const name = props.name || props.poi?.name || '';

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return;
    }

    const coords = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates
      : [props.lon, props.lat];

    const hotelLat = typeof props.lat === 'number' ? props.lat : coords[1] ?? null;
    const hotelLon = typeof props.lon === 'number' ? props.lon : coords[0] ?? null;

    if (hotelLat === null || hotelLon === null) {
      return;
    }

    const key = `${name.toLowerCase()}-${hotelLat}-${hotelLon}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const distance =
      typeof props.distance === 'number' && !Number.isNaN(props.distance)
        ? props.distance
        : calculateDistanceMeters(latitude, longitude, hotelLat, hotelLon);

    normalizedHotels.push({
      name: name.trim(),
      formatted: props.formatted || props.address_line1 || '',
      latitude: hotelLat,
      longitude: hotelLon,
      placeId: props.place_id ? String(props.place_id) : props.osm_id ? String(props.osm_id) : '',
      categories: props.categories || [],
      distance,
    });
  });

  normalizedHotels.sort((a, b) => a.distance - b.distance);

  return normalizedHotels;
}

module.exports = {
  fetchNearbyHotels,
};
