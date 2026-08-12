require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

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

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(cors());

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/destination', destinationRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/weather', weatherRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TravelMate AI Backend Running',
  });
});

// ==========================================
// SERVE REACT FRONTEND
// ==========================================

// React production build location:
// TravelMateAI System/
// ├── client/
// │   └── dist/
// └── server/
//     └── app.js

const clientPath = path.join(__dirname, '..', 'client', 'dist');

app.use(express.static(clientPath));

// ==========================================
// REACT ROUTING FALLBACK
// ==========================================

// Send React's index.html for frontend routes.
// API routes are handled above and are not affected.

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// ==========================================
// START SERVER
// ==========================================

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

      console.log(
        'OpenWeather API key configured:',
        Boolean(process.env.OPENWEATHER_API_KEY)
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();