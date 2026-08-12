const { fetchNearbyHotels } = require('../services/hotelService');

async function getHotels(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon || String(lat).trim() === '' || String(lon).trim() === '') {
      return res.status(400).json({ success: false, message: 'Query parameters "lat" and "lon" are required.' });
    }

    const hotels = await fetchNearbyHotels(lat, lon);
    return res.json({ success: true, hotels });
  } catch (err) {
    console.error('Hotel fetch error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to fetch nearby hotels.' });
  }
}

module.exports = { getHotels };
