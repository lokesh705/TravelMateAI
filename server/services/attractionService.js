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
          console.log("Geoapify Status:", res.statusCode);

          try {
            const json = JSON.parse(data);

            if (res.statusCode !== 200) {
              console.log(json);
            }

            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

async function fetchNearbyAttractions(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates');
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Geoapify API key missing');
  }

  const categories = [
    'tourism',
    'heritage',
    'entertainment.museum',
  ].join(',');

  const url =
    `${GEOAPIFY_BASE}` +
    `?categories=${categories}` +
    `&filter=circle:${longitude},${latitude},15000` +
    `&limit=20` +
    `&apiKey=${apiKey}`;
  console.log('====================================');
  console.log('Latitude :', latitude);
  console.log('Longitude:', longitude);
  console.log('URL:', url);
  console.log('====================================');

  const result = await callGeoapify(url);

  if (!result || !Array.isArray(result.features)) {
    return [];
  }

  return result.features.map((feature) => {
    const props = feature.properties || {};
    const coords = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates
      : [props.lon, props.lat];

    return {
      name: props.name || props.poi?.name || props.formatted || 'Unknown',
      formatted: props.formatted || props.address_line1 || '',
      latitude: typeof props.lat === 'number' ? props.lat : coords[1] ?? null,
      longitude: typeof props.lon === 'number' ? props.lon : coords[0] ?? null,
      categories: props.categories || [],
      placeId: props.place_id ? String(props.place_id) : props.osm_id ? String(props.osm_id) : '',
    };
  });
}

module.exports = {
  fetchNearbyAttractions
};