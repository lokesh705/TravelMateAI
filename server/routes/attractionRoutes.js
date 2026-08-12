const express = require('express');
const router = express.Router();

const { getAttractions, getAttractionImageRoute } = require('../controllers/attractionController');

console.log("✅ attractionRoutes loaded");

router.get('/', getAttractions);
router.get('/image', getAttractionImageRoute);

module.exports = router;