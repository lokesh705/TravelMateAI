const express = require('express');
const router = express.Router();

const { getRestaurants } = require('../controllers/restaurantController');

console.log("✅ restaurantRoutes loaded");

router.get('/', getRestaurants);

module.exports = router;
