const { fetchWeather } = require('../services/weatherService');

async function getWeather(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid latitude or longitude.' });
    }

    const weather = await fetchWeather(latitude, longitude);

    return res.json({ success: true, weather });
  } catch (err) {
    console.error('Weather fetch error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to fetch weather data.' });
  }
}

module.exports = { getWeather };
