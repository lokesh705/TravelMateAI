const https = require('https');

const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';

function callWeatherAPI(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(json);
            } else {
              reject(new Error(`Weather API returned status ${res.statusCode}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

async function fetchWeather(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Valid latitude and longitude are required');
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    appid: apiKey,
    units: 'metric',
  });

  const url = `${WEATHER_BASE}?${params.toString()}`;
  const result = await callWeatherAPI(url);

  if (!result) {
    throw new Error('No weather data received');
  }

  return {
    temperature: result.main?.temp || null,
    feelsLike: result.main?.feels_like || null,
    condition: result.weather?.[0]?.description || null,
    humidity: result.main?.humidity || null,
    windSpeed: result.wind?.speed || null,
    icon: result.weather?.[0]?.icon || null,
  };
}

module.exports = { fetchWeather };
