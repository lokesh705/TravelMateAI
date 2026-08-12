const https = require('https');

const GEOAPIFY_SEARCH_BASE = 'https://api.geoapify.com/v1/geocode/search';
const GEOAPIFY_AUTOCOMPLETE_BASE = 'https://api.geoapify.com/v1/geocode/autocomplete';

function callGeoapify(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getCandidateName(props) {
  return props.city || props.name || props.town || props.village || '';
}

function getPlaceCategory(type) {
  const value = normalizeText(type);
  if (!value) return 'other';
  if (value.includes('city')) return 'city';
  if (value.includes('town')) return 'town';
  if (value.includes('administrative')) return 'administrative';
  if (value.includes('village')) return 'village';
  if (value.includes('hamlet')) return 'hamlet';
  if (value.includes('suburb')) return 'suburb';
  if (value.includes('neighbourhood') || value.includes('neighborhood')) return 'small locality';
  if (value.includes('unknown')) return 'unknown';
  return 'other';
}

function getTypeScore(category) {
  switch (category) {
    case 'city':
      return 120;
    case 'town':
      return 100;
    case 'administrative':
      return 90;
    case 'village':
      return 60;
    case 'small locality':
    case 'hamlet':
    case 'suburb':
      return 20;
    case 'unknown':
      return 10;
    default:
      return 50;
  }
}

function getSuggestionId(props, feature) {
  if (props.place_id) return String(props.place_id);
  if (props.osm_id) return String(props.osm_id);
  return feature.id || feature.properties?.id || null;
}

function scoreSuggestion(feature, normalizedQuery) {
  const props = feature.properties || {};
  const candidate = normalizeText(getCandidateName(props));
  const category = getPlaceCategory(props.type || props.result_type || props.place_type);
  const typeScore = getTypeScore(category);
  const exactMatch = candidate === normalizedQuery;
  const startsWith = candidate.startsWith(normalizedQuery) ? 10 : 0;
  const contains = candidate.includes(normalizedQuery) && !candidate.startsWith(normalizedQuery) ? 5 : 0;
  const exactBoost = exactMatch ? 300 : 0;
  const duplicatePenalty = ['unknown', 'small locality', 'hamlet'].includes(category) ? -20 : 0;

  return typeScore + exactBoost + startsWith + contains + duplicatePenalty;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildSuggestion(feature) {
  const props = feature.properties || {};
  return {
    id: getSuggestionId(props, feature),
    name: getCandidateName(props) || props.formatted || '',
    state: props.state || null,
    country: props.country || null,
    formatted: props.formatted || null,
    latitude: toNumber(props.lat),
    longitude: toNumber(props.lon),
  };
}

function uniqByKey(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchCityInfo(city) {
  const trimmedCity = typeof city === 'string' ? city.trim() : '';
  if (!trimmedCity) throw new Error('City is required');
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('Geoapify API key not configured');

  const normalizedQuery = normalizeText(trimmedCity);
  const params = new URLSearchParams({
    city: trimmedCity,
    country: 'IN',
    filter: 'countrycode:in',
    limit: '10',
    apiKey,
  });

  const url = `${GEOAPIFY_SEARCH_BASE}?${params.toString()}`;
  const result = await callGeoapify(url);

  if (!result || !Array.isArray(result.features) || result.features.length === 0) {
    return null;
  }

  const ranked = result.features
    .map((feature) => ({ feature, score: scoreSuggestion(feature, normalizedQuery) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.feature;
  if (!best) {
    return null;
  }

  const props = best.properties || {};
  const coords = best.geometry && Array.isArray(best.geometry.coordinates) ? best.geometry.coordinates : [null, null];
  const cityName = getCandidateName(props) || null;

  return {
    city: cityName,
    country: props.country || null,
    state: props.state || null,
    latitude: typeof coords[1] === 'number' ? coords[1] : toNumber(props.lat),
    longitude: typeof coords[0] === 'number' ? coords[0] : toNumber(props.lon),
    formattedAddress: props.formatted || null,
    timezone: props.timezone && props.timezone.name ? props.timezone.name : null,
    placeId: props.place_id ? String(props.place_id) : props.osm_id ? String(props.osm_id) : null,
  };
}

async function fetchAutocompleteSuggestions(text) {
  const trimmedText = typeof text === 'string' ? text.trim() : '';
  if (!trimmedText) return [];
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('Geoapify API key not configured');

  const normalizedQuery = normalizeText(trimmedText);
  const params = new URLSearchParams({
    text: trimmedText,
    filter: 'countrycode:in',
    limit: '20',
    apiKey,
  });

  const url = `${GEOAPIFY_AUTOCOMPLETE_BASE}?${params.toString()}`;
  const result = await callGeoapify(url);

  if (!result || !Array.isArray(result.features) || result.features.length === 0) {
    return [];
  }

  const suggestions = result.features
    .map((feature) => {
      const props = feature.properties || {};
      return {
        feature,
        suggestion: buildSuggestion(feature),
        score: scoreSuggestion(feature, normalizedQuery),
        category: getPlaceCategory(props.type || props.result_type || props.place_type),
      };
    })
    .filter((item) => item.suggestion.id && item.suggestion.name)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.category !== b.category) {
        const order = ['city', 'town', 'administrative', 'village', 'other', 'small locality', 'hamlet', 'unknown'];
        return order.indexOf(a.category) - order.indexOf(b.category);
      }
      return a.suggestion.name.localeCompare(b.suggestion.name);
    })
    .map((item) => item.suggestion);

  const unique = uniqByKey(suggestions, (suggestion) => `${suggestion.id}-${suggestion.formatted || suggestion.name}`);
  return unique.slice(0, 8);
}

module.exports = { fetchCityInfo, fetchAutocompleteSuggestions };
