const express = require('express');
const router = express.Router();

const { getFood } = require('../controllers/foodController');

console.log("✅ foodRoutes loaded");

router.get('/', getFood);

module.exports = router;
