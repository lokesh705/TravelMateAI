const express = require('express');
const router = express.Router();
const { searchDestination, autocompleteDestination } = require('../controllers/destinationController');

router.get('/search', searchDestination);
router.get('/autocomplete', autocompleteDestination);

module.exports = router;
