import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import '../styles/destination.css';

// Fix for default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function HotelImage({ hotelName, attractionName }) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!hotelName) {
        return;
      }

      try {
        const response = await api.get('/attractions/image', {
          params: { name: `${hotelName} ${attractionName || ''}`.trim() },
        });

        if (isMounted) {
          setImageUrl(response.data?.imageUrl || '');
          setImageError(!response.data?.imageUrl);
        }
      } catch (err) {
        if (isMounted) {
          setImageUrl('');
          setImageError(true);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [hotelName, attractionName]);

  if (!imageUrl && !imageError) {
    return <div className="attraction-image placeholder">Loading image...</div>;
  }

  if (!imageUrl && imageError) {
    return <div className="attraction-image placeholder">Image unavailable</div>;
  }

  return <img className="attraction-image" src={imageUrl} alt={hotelName} />;
}

function RestaurantImage({ restaurantName, attractionName }) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!restaurantName) {
        return;
      }

      try {
        const response = await api.get('/attractions/image', {
          params: { name: `${restaurantName} ${attractionName || ''}`.trim() },
        });

        if (isMounted) {
          setImageUrl(response.data?.imageUrl || '');
          setImageError(!response.data?.imageUrl);
        }
      } catch (err) {
        if (isMounted) {
          setImageUrl('');
          setImageError(true);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [restaurantName, attractionName]);

  if (!imageUrl && !imageError) {
    return <div className="attraction-image placeholder">Loading image...</div>;
  }

  if (!imageUrl && imageError) {
    return <div className="attraction-image placeholder">Image unavailable</div>;
  }

  return <img className="attraction-image" src={imageUrl} alt={restaurantName} />;
}

function FoodImage({ foodName, attractionName }) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!foodName) {
        return;
      }

      try {
        const response = await api.get('/attractions/image', {
          params: { name: `${foodName} ${attractionName || ''}`.trim() },
        });

        if (isMounted) {
          setImageUrl(response.data?.imageUrl || '');
          setImageError(!response.data?.imageUrl);
        }
      } catch (err) {
        if (isMounted) {
          setImageUrl('');
          setImageError(true);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [foodName, attractionName]);

  if (!imageUrl && !imageError) {
    return <div className="attraction-image placeholder">Loading image...</div>;
  }

  if (!imageUrl && imageError) {
    return <div className="attraction-image placeholder">Image unavailable</div>;
  }

  return <img className="attraction-image" src={imageUrl} alt={foodName} />;
}

export default function AttractionDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { placeId } = useParams();

  const attraction = location.state?.attraction || null;
  const previousRouteState = location.state?.previousRouteState || null;
  const hasImage = typeof attraction?.imageUrl === 'string' && attraction.imageUrl.trim() !== '';

  const [hotels, setHotels] = useState([]);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelError, setHotelError] = useState('');

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState('');

  const [food, setFood] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState('');

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const googleMapsUrl = attraction?.latitude && attraction?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`
    : '';

  const handleBack = () => {
    if (previousRouteState) {
      navigate(previousRouteState, { state: previousRouteState.state });
      return;
    }

    navigate(-1);
  };

  const fetchRestaurants = useCallback(async () => {
    if (typeof attraction?.latitude !== 'number' || typeof attraction?.longitude !== 'number') {
      return;
    }

    setRestaurantLoading(true);
    setRestaurantError('');
    try {
      const response = await api.get('/restaurants', {
        params: { lat: attraction.latitude, lon: attraction.longitude },
      });

      if (response.data && response.data.success) {
        setRestaurants(response.data.restaurants || []);
      } else {
        setRestaurantError(response.data?.message || 'No nearby restaurants found.');
      }
    } catch (err) {
      setRestaurantError('Unable to load nearby restaurants.');
    } finally {
      setRestaurantLoading(false);
    }
  }, [attraction?.latitude, attraction?.longitude]);

  const fetchFood = useCallback(async () => {
    if (typeof attraction?.latitude !== 'number' || typeof attraction?.longitude !== 'number') {
      return;
    }

    setFoodLoading(true);
    setFoodError('');
    try {
      const response = await api.get('/food', {
        params: { lat: attraction.latitude, lon: attraction.longitude },
      });

      if (response.data && response.data.success) {
        setFood(response.data.food || []);
      } else {
        setFoodError(response.data?.message || 'No nearby food or cafes found.');
      }
    } catch (err) {
      setFoodError('Unable to load nearby food and cafes.');
    } finally {
      setFoodLoading(false);
    }
  }, [attraction?.latitude, attraction?.longitude]);

  useEffect(() => {
    const fetchHotels = async () => {
      if (typeof attraction?.latitude !== 'number' || typeof attraction?.longitude !== 'number') {
        return;
      }

      setHotelLoading(true);
      setHotelError('');
      try {
        const response = await api.get('/hotels', {
          params: { lat: attraction.latitude, lon: attraction.longitude },
        });

        if (response.data && response.data.success) {
          setHotels(response.data.hotels || []);
        } else {
          setHotelError(response.data?.message || 'No nearby hotels found.');
        }
      } catch (err) {
        setHotelError('Unable to load nearby hotels.');
      } finally {
        setHotelLoading(false);
      }
    };

    const fetchWeather = async () => {
      if (typeof attraction?.latitude !== 'number' || typeof attraction?.longitude !== 'number') {
        return;
      }

      setWeatherLoading(true);
      setWeatherError('');
      try {
        const response = await api.get('/weather', {
          params: { lat: attraction.latitude, lon: attraction.longitude },
        });

        if (response.data && response.data.success) {
          setWeather(response.data.weather);
        } else {
          setWeatherError(response.data?.message || 'Failed to fetch weather');
        }
      } catch (err) {
        setWeatherError('Unable to load weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchHotels();
    fetchRestaurants();
    fetchFood();
    fetchWeather();
  }, [attraction?.latitude, attraction?.longitude, fetchRestaurants, fetchFood]);

  const handleRetryRestaurants = () => {
    fetchRestaurants();
  };

  const handleRetryFood = () => {
    fetchFood();
  };

  if (!attraction) {
    return (
      <div className="details-page-shell">
        <div className="details-page-card">
          <button type="button" className="details-back-btn" onClick={handleBack}>
            ← Back to Tourist Places
          </button>
          <div className="details-empty-state">
            <h3>No attraction selected.</h3>
            <p>Please return to the attractions list and choose a place.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="details-page-shell">
      <div className="details-page-card">
        <button type="button" className="details-back-btn" onClick={handleBack}>
          ← Back to Tourist Places
        </button>

        <section className="details-hero">
          {hasImage ? (
            <img className="details-hero-image" src={attraction.imageUrl} alt={attraction.name} />
          ) : (
            <div className="details-hero-image placeholder">Image unavailable</div>
          )}

          <div className="details-hero-content">
            <div className="details-pill">Featured Place</div>
            <h1>{attraction.name}</h1>
            <p>{attraction.formatted}</p>
            {googleMapsUrl && (
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="details-map-btn">
                🗺 Open in Google Maps
              </a>
            )}
          </div>
        </section>

        <section className="details-info-grid">
          <div className="details-info-card">
            <h3>📍 Address</h3>
            <p>{attraction.formatted || 'Address not available.'}</p>
          </div>
          <div className="details-info-card">
            <h3>🌍 Coordinates</h3>
            <p>{attraction.latitude ?? '-'} • {attraction.longitude ?? '-'}</p>
          </div>
          <div className="details-info-card secondary">
            <h3>🆔 Place ID</h3>
            <p>{attraction.placeId || placeId || '-'}</p>
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <h2>� Current Weather</h2>
            {weatherLoading && <span className="details-section-tag">Loading weather...</span>}
          </div>

          {weatherError && <p className="attraction-error">{weatherError}</p>}

          {!weatherLoading && !weatherError && weather && (
            <div className="weather-display">
              <div className="weather-display-item">
                <span className="weather-display-label">Temperature</span>
                <span className="weather-display-value">{weather.temperature}°C</span>
              </div>
              <div className="weather-display-item">
                <span className="weather-display-label">Feels Like</span>
                <span className="weather-display-value">{weather.feelsLike}°C</span>
              </div>
              <div className="weather-display-item">
                <span className="weather-display-label">Condition</span>
                <span className="weather-display-value">{weather.condition}</span>
              </div>
              <div className="weather-display-item">
                <span className="weather-display-label">Humidity</span>
                <span className="weather-display-value">{weather.humidity}%</span>
              </div>
              <div className="weather-display-item">
                <span className="weather-display-label">Wind Speed</span>
                <span className="weather-display-value">{weather.windSpeed} m/s</span>
              </div>
            </div>
          )}

          {!weatherLoading && !weatherError && !weather && (
            <p className="attraction-empty">Weather data unavailable.</p>
          )}
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <h2>�🏨 Hotels Near {attraction.name}</h2>
            {hotelLoading && <span className="details-section-tag">Loading nearby hotels...</span>}
          </div>

          {hotelError && <p className="attraction-error">{hotelError}</p>}

          {!hotelLoading && !hotelError && hotels.length === 0 && (
            <p className="attraction-empty">No nearby hotels found.</p>
          )}

          <div className="details-card-grid">
            {hotels.map((hotel) => {
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`;
              return (
                <div className="details-card" key={`${hotel.placeId}-${hotel.name}`}>
                  <HotelImage hotelName={hotel.name} attractionName={attraction.name} />
                  <div className="details-card-title">{hotel.name}</div>
                  <p>{hotel.formatted}</p>
                  <p>Distance: {Math.round(hotel.distance / 1000)} km</p>
                  <div className="hotel-actions">
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="view-details maps-link">
                      Open in Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <h2>🍽 Restaurants Near {attraction.name}</h2>
            {restaurantLoading && <span className="details-section-tag">Loading nearby restaurants...</span>}
          </div>

          {restaurantError && (
            <div>
              <p className="attraction-error">{restaurantError}</p>
              <button 
                type="button" 
                className="secondary" 
                onClick={handleRetryRestaurants}
                disabled={restaurantLoading}
              >
                Retry
              </button>
            </div>
          )}

          {!restaurantLoading && !restaurantError && restaurants.length === 0 && (
            <p className="attraction-empty">No nearby restaurants found.</p>
          )}

          <div className="details-card-grid">
            {restaurants.map((restaurant) => {
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
              return (
                <div className="details-card" key={`${restaurant.placeId}-${restaurant.name}`}>
                  <RestaurantImage restaurantName={restaurant.name} attractionName={attraction.name} />
                  <div className="details-card-title">{restaurant.name}</div>
                  <p>{restaurant.formatted}</p>
                  <p>Distance: {Math.round(restaurant.distance / 1000)} km</p>
                  <div className="hotel-actions">
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="view-details maps-link">
                      Open in Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <h2>☕ Food & Cafes Near {attraction.name}</h2>
            {foodLoading && <span className="details-section-tag">Loading nearby food and cafes...</span>}
          </div>

          {foodError && (
            <div>
              <p className="attraction-error">{foodError}</p>
              <button 
                type="button" 
                className="secondary" 
                onClick={handleRetryFood}
                disabled={foodLoading}
              >
                Retry
              </button>
            </div>
          )}

          {!foodLoading && !foodError && food.length === 0 && (
            <p className="attraction-empty">No nearby food or cafes found.</p>
          )}

          <div className="details-card-grid">
            {food.map((foodItem) => {
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${foodItem.latitude},${foodItem.longitude}`;
              const category = foodItem.categories && foodItem.categories.length > 0 
                ? foodItem.categories[0] 
                : 'Food & Cafe';
              return (
                <div className="details-card" key={`${foodItem.placeId}-${foodItem.name}`}>
                  <FoodImage foodName={foodItem.name} attractionName={attraction.name} />
                  <div className="details-card-title">{foodItem.name}</div>
                  <p>{foodItem.formatted}</p>
                  <p>Distance: {Math.round(foodItem.distance / 1000)} km</p>
                  <p>Category: {category}</p>
                  <div className="hotel-actions">
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="view-details maps-link">
                      Open in Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <h2>🗺️ Explore Nearby</h2>
          </div>

          {typeof attraction?.latitude === 'number' && typeof attraction?.longitude === 'number' && (
            <div className="map-container">
              <MapContainer
                center={[attraction.latitude, attraction.longitude]}
                zoom={15}
                style={{ height: '450px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Tourist Place Marker */}
                <Marker position={[attraction.latitude, attraction.longitude]}>
                  <Popup>
                    <div className="map-popup">
                      <strong>📍 {attraction.name}</strong>
                      <br />
                      {attraction.formatted}
                    </div>
                  </Popup>
                </Marker>

                {/* Hotel Markers */}
                {hotels.map((hotel) => (
                  <Marker
                    key={`hotel-${hotel.placeId}`}
                    position={[hotel.latitude, hotel.longitude]}
                  >
                    <Popup>
                      <div className="map-popup">
                        <strong>🏨 {hotel.name}</strong>
                        <br />
                        {hotel.formatted}
                        <br />
                        Distance: {Math.round(hotel.distance / 1000)} km
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Restaurant Markers */}
                {restaurants.map((restaurant) => (
                  <Marker
                    key={`restaurant-${restaurant.placeId}`}
                    position={[restaurant.latitude, restaurant.longitude]}
                  >
                    <Popup>
                      <div className="map-popup">
                        <strong>🍽 {restaurant.name}</strong>
                        <br />
                        {restaurant.formatted}
                        <br />
                        Distance: {Math.round(restaurant.distance / 1000)} km
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Food & Cafe Markers */}
                {food.map((foodItem) => (
                  <Marker
                    key={`food-${foodItem.placeId}`}
                    position={[foodItem.latitude, foodItem.longitude]}
                  >
                    <Popup>
                      <div className="map-popup">
                        <strong>☕ {foodItem.name}</strong>
                        <br />
                        {foodItem.formatted}
                        <br />
                        Distance: {Math.round(foodItem.distance / 1000)} km
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {typeof attraction?.latitude !== 'number' || typeof attraction?.longitude !== 'number' && (
            <p className="attraction-empty">Map unavailable - coordinates missing.</p>
          )}
        </section>
      </div>
    </div>
  );
}
