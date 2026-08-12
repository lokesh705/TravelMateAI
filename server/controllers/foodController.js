const { fetchNearbyFood } = require('../services/foodService');

async function getFood(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon || String(lat).trim() === '' || String(lon).trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required.' 
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid latitude or longitude.' 
      });
    }

    const food = await fetchNearbyFood(lat, lon);
    return res.json({ success: true, food });
  } catch (err) {
    console.error('Food fetch error:', err.message || err);
    
    if (err.message === 'Geoapify API key missing') {
      return res.status(500).json({ 
        success: false, 
        message: 'Geoapify API key is not configured.' 
      });
    }
    
    return res.status(502).json({ 
      success: false, 
      message: 'Unable to fetch nearby food and cafes.' 
    });
  }
}

module.exports = { getFood };
