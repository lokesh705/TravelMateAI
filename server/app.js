require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const attractionRoutes = require('./routes/attractionRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const foodRoutes = require('./routes/foodRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/destination', destinationRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TravelMate AI Backend Running',
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Safe environment checks
      console.log(
        'Geoapify API key configured:',
        Boolean(process.env.GEOAPIFY_API_KEY)
      );

      console.log(
        'Pexels API key configured:',
        Boolean(process.env.PEXELS_API_KEY)
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();