const { fetchNearbyAttractions } = require('../services/attractionService');
const { getAttractionImage } = require('../services/imageService');

async function getAttractions(req, res) {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon || String(lat).trim() === '' || String(lon).trim() === '') {
      return res.status(400).json({ success: false, message: 'Query parameters "lat" and "lon" are required.' });
    }

    const attractions = await fetchNearbyAttractions(lat, lon);
    return res.json({ success: true, attractions });
  } catch (err) {
    console.error('Attraction fetch error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to fetch attractions.' });
  }
}

async function getAttractionImageRoute(req, res) {
  try {
    const { name } = req.query;
    const result = await getAttractionImage(name);
    return res.json({
      success: true,
      imageUrl: result.imageUrl || null,
      photographer: result.photographer || null,
      photographerUrl: result.photographerUrl || null,
    });
  } catch (err) {
    console.error('Attraction image fetch error:', err.message || err);
    return res.json({ success: true, imageUrl: null, photographer: null, photographerUrl: null });
  }
}

module.exports = { getAttractions, getAttractionImageRoute };
