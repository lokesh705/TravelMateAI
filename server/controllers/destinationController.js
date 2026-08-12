const { fetchCityInfo, fetchAutocompleteSuggestions } = require('../services/geoapifyService');

async function searchDestination(req, res) {
  try {
    const { city } = req.query;
    if (!city || String(city).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query parameter "city" is required.' });
    }

    const info = await fetchCityInfo(String(city).trim());

    if (!info) {
      return res.status(404).json({ success: false, message: 'City not found.' });
    }

    return res.json({ success: true, ...info });
  } catch (err) {
    console.error('Destination search error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to fetch destination.' });
  }
}

async function autocompleteDestination(req, res) {
  try {
    const { text } = req.query;
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query parameter "text" is required.' });
    }

    const suggestions = await fetchAutocompleteSuggestions(String(text).trim());
    return res.json({ success: true, suggestions });
  } catch (err) {
    console.error('Destination autocomplete error:', err.message || err);
    return res.status(500).json({ success: false, message: 'Failed to fetch autocomplete suggestions.' });
  }
}

module.exports = { searchDestination, autocompleteDestination };
