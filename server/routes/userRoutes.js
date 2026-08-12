const express = require('express');
const { getProfile, addSavedTrip, getSavedTrips, removeSavedTrip } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.post('/saved-trips', authMiddleware, addSavedTrip);
router.get('/saved-trips', authMiddleware, getSavedTrips);
router.delete('/saved-trips/:placeId', authMiddleware, removeSavedTrip);

module.exports = router;
