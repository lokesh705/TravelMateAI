const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const addSavedTrip = async (req, res) => {
  try {
    const { placeId, name, formatted, latitude, longitude, imageUrl, categories } = req.body;

    if (!placeId || !name || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Required fields: placeId, name, latitude, longitude',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const existingTrip = user.savedTrips.find(trip => trip.placeId === placeId);

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: 'Place already saved.',
      });
    }

    user.savedTrips.push({
      placeId,
      name,
      formatted: formatted || '',
      latitude,
      longitude,
      imageUrl: imageUrl || '',
      categories: categories || [],
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Trip saved successfully',
      savedTrips: user.savedTrips,
    });
  } catch (error) {
    console.error('Add saved trip error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getSavedTrips = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      savedTrips: user.savedTrips || [],
    });
  } catch (error) {
    console.error('Get saved trips error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const removeSavedTrip = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const initialLength = user.savedTrips.length;
    user.savedTrips = user.savedTrips.filter(trip => trip.placeId !== placeId);

    if (user.savedTrips.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Saved trip not found',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Trip removed successfully',
      savedTrips: user.savedTrips,
    });
  } catch (error) {
    console.error('Remove saved trip error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = { getProfile, addSavedTrip, getSavedTrips, removeSavedTrip };
