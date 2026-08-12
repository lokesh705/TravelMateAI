import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/destination.css';

function WeatherModal({ weather, onClose }) {
  if (!weather) return null;

  return (
    <div className="weather-modal-overlay" onClick={onClose}>
      <div className="weather-modal" onClick={(e) => e.stopPropagation()}>
        <div className="weather-modal-header">
          <h3>🌤 Weather</h3>
          <button className="weather-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="weather-modal-content">
          <div className="weather-modal-item">
            <span className="weather-label">Temperature</span>
            <span className="weather-value">{weather.temperature}°C</span>
          </div>
          <div className="weather-modal-item">
            <span className="weather-label">Feels Like</span>
            <span className="weather-value">{weather.feelsLike}°C</span>
          </div>
          <div className="weather-modal-item">
            <span className="weather-label">Condition</span>
            <span className="weather-value">{weather.condition}</span>
          </div>
          <div className="weather-modal-item">
            <span className="weather-label">Humidity</span>
            <span className="weather-value">{weather.humidity}%</span>
          </div>
          <div className="weather-modal-item">
            <span className="weather-label">Wind Speed</span>
            <span className="weather-value">{weather.windSpeed} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttractionImage({ attractionName, onImageReady }) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!attractionName) {
        return;
      }

      try {
        const response = await api.get('/attractions/image', {
          params: { name: attractionName },
        });

        const nextImageUrl = response.data?.imageUrl || '';

        if (isMounted) {
          setImageUrl(nextImageUrl);
          setImageError(!nextImageUrl);
          if (typeof onImageReady === 'function') {
            onImageReady(nextImageUrl);
          }
        }
      } catch (err) {
        if (isMounted) {
          setImageUrl('');
          setImageError(true);
          if (typeof onImageReady === 'function') {
            onImageReady('');
          }
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [attractionName, onImageReady]);

  if (!imageUrl && !imageError) {
    return <div className="attraction-image placeholder">Loading image...</div>;
  }

  if (!imageUrl && imageError) {
    return <div className="attraction-image placeholder">Image unavailable</div>;
  }

  return <img className="attraction-image" src={imageUrl} alt={attractionName} />;
}

function HotelImage({ hotelName, destinationCity }) {
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
          params: { name: `${hotelName} ${destinationCity || ''}`.trim() },
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
  }, [hotelName, destinationCity]);

  if (!imageUrl && !imageError) {
    return <div className="attraction-image placeholder">Loading image...</div>;
  }

  if (!imageUrl && imageError) {
    return <div className="attraction-image placeholder">Image unavailable</div>;
  }

  return <img className="attraction-image" src={imageUrl} alt={hotelName} />;
}

export default function DestinationCard({ data, onReset }) {
  if (!data) return null;

  const navigate = useNavigate();
  const location = useLocation();
  const { city, state, country, latitude, longitude, formattedAddress, timezone, placeId } = data;
  const [attractions, setAttractions] = useState([]);
  const [attractionImages, setAttractionImages] = useState({});
  const [attractionError, setAttractionError] = useState('');
  const [attractionLoading, setAttractionLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [hotelError, setHotelError] = useState('');
  const [hotelLoading, setHotelLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchAttractions = async () => {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return;
      }

      setAttractionLoading(true);
      setAttractionError('');
      try {
        const response = await api.get('/attractions', {
          params: { lat: latitude, lon: longitude },
        });

        if (response.data && response.data.success) {
          setAttractions(response.data.attractions || []);
        } else {
          setAttractionError(response.data?.message || 'No attractions found.');
        }
      } catch (err) {
        setAttractionError('Failed to load nearby attractions.');
      } finally {
        setAttractionLoading(false);
      }
    };

    const fetchHotels = async () => {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return;
      }

      setHotelLoading(true);
      setHotelError('');
      try {
        const response = await api.get('/hotels', {
          params: { lat: latitude, lon: longitude },
        });

        if (response.data && response.data.success) {
          setHotels(response.data.hotels || []);
        } else {
          setHotelError(response.data?.message || 'No nearby hotels found.');
        }
      } catch (err) {
        setHotelError('Failed to load nearby hotels.');
      } finally {
        setHotelLoading(false);
      }
    };

    const fetchSavedPlaces = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await api.get('/user/saved-trips', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.success) {
          setSavedPlaces(response.data.savedTrips || []);
        }
      } catch (err) {
        console.error('Failed to fetch saved places:', err);
      }
    };

    fetchAttractions();
    fetchHotels();
    fetchSavedPlaces();
  }, [latitude, longitude]);

  const handleWeatherClick = async (lat, lon) => {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      setWeatherError('Invalid coordinates');
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');
    setWeatherData(null);

    try {
      const response = await api.get('/weather', {
        params: { lat, lon },
      });

      if (response.data && response.data.success) {
        setWeatherData(response.data.weather);
        setShowWeatherModal(true);
      } else {
        setWeatherError(response.data?.message || 'Failed to fetch weather');
      }
    } catch (err) {
      setWeatherError('Failed to fetch weather data');
    } finally {
      setWeatherLoading(false);
    }
  };

  const isPlaceSaved = (placeId) => {
    return savedPlaces.some(place => place.placeId === placeId);
  };

  const handleSavePlace = async (place) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to save places');
      return;
    }

    setSaveLoading(true);

    try {
      const response = await api.post('/user/saved-trips', {
        placeId: place.placeId,
        name: place.name,
        formatted: place.formatted,
        latitude: place.latitude,
        longitude: place.longitude,
        imageUrl: attractionImages[place.placeId] || '',
        categories: place.categories || [],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setSavedPlaces(response.data.savedTrips || []);
      } else {
        alert(response.data?.message || 'Failed to save place');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Failed to save place');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUnsavePlace = async (placeId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await api.delete(`/user/saved-trips/${placeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setSavedPlaces(response.data.savedTrips || []);
      }
    } catch (err) {
      console.error('Failed to unsave place:', err);
    }
  };

  return (
    <div className="destination-card modern">
      <div className="card-header">
        <div className="title-wrap">
          <div className="city-icon">📍</div>
          <div>
            <h3 className="city-name">{city || 'Unknown City'}</h3>
            <div className="sub">{state || '-'} • {country || '-'}</div>
          </div>
        </div>

        <button className="secondary small" onClick={onReset}>
          Search again
        </button>
      </div>

      <div className="card-grid modern-grid">
        <div className="card-row">
          <span className="label">🌍 Country</span>
          <span className="value">{country || '-'}</span>
        </div>
        <div className="card-row">
          <span className="label">🏛 State</span>
          <span className="value">{state || '-'}</span>
        </div>
        <div className="card-row full">
          <span className="label">📌 Address</span>
          <span className="value">{formattedAddress || '-'}</span>
        </div>
        <div className="card-row">
          <span className="label">🌎 Latitude</span>
          <span className="value">{latitude ?? '-'}</span>
        </div>
        <div className="card-row">
          <span className="label">🌐 Longitude</span>
          <span className="value">{longitude ?? '-'}</span>
        </div>
        <div className="card-row">
          <span className="label">🕒 Timezone</span>
          <span className="value">{timezone || '-'}</span>
        </div>
      </div>

      <section className="attractions-section">
        <div className="attractions-header">
          <h4>Top Tourist Attractions</h4>
          {attractionLoading && <span className="attraction-loading">Loading attractions...</span>}
        </div>

        {attractionError && <p className="attraction-error">{attractionError}</p>}

        {!attractionLoading && !attractionError && attractions.length === 0 && (
          <p className="attraction-empty">No nearby attractions found.</p>
        )}

        <div className="attraction-grid">
          {attractions.map((item) => {
            const itemKey = item.placeId || item.name;
            const selectedImageUrl = attractionImages[itemKey] || '';

            return (
              <div className="attraction-card" key={`${item.placeId}-${item.name}`}>
                <AttractionImage
                  attractionName={item.name}
                  onImageReady={(imageUrl) => {
                    setAttractionImages((prev) => ({
                      ...prev,
                      [itemKey]: imageUrl,
                    }));
                  }}
                />
                <div className="attraction-title">📍 {item.name}</div>
                <div className="attraction-address">{item.formatted}</div>
                <div className="attraction-actions">
                  <button
                    type="button"
                    className="weather-btn"
                    onClick={() => handleWeatherClick(item.latitude, item.longitude)}
                    disabled={weatherLoading}
                  >
                    🌤 Weather
                  </button>
                  <button
                    type="button"
                    className="view-details"
                    onClick={() => navigate(`/destination/attraction/${item.placeId || item.name}`, {
                      state: {
                        attraction: {
                          ...item,
                          imageUrl: selectedImageUrl,
                          categories: item.categories || [],
                        },
                        previousRouteState: {
                          pathname: location.pathname,
                          search: location.search,
                          hash: location.hash,
                          state: data,
                        },
                      },
                    })}
                  >
                    View Details
                  </button>
                </div>
                <button
                  type="button"
                  className={`save-btn ${isPlaceSaved(item.placeId) ? 'saved' : ''}`}
                  onClick={() => {
                    if (isPlaceSaved(item.placeId)) {
                      handleUnsavePlace(item.placeId);
                    } else {
                      handleSavePlace(item);
                    }
                  }}
                  disabled={saveLoading}
                >
                  {isPlaceSaved(item.placeId) ? '❤️ Saved' : '❤️ Save'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="attractions-section">
        <div className="attractions-header">
          <h4>Nearby Hotels</h4>
          {hotelLoading && <span className="attraction-loading">Loading nearby hotels...</span>}
        </div>

        {hotelError && <p className="attraction-error">{hotelError}</p>}

        {!hotelLoading && !hotelError && hotels.length === 0 && (
          <p className="attraction-empty">No nearby hotels found.</p>
        )}

        <div className="attraction-grid">
          {hotels.map((item) => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
            return (
              <div className="attraction-card" key={`${item.placeId}-${item.name}`}>
                <HotelImage hotelName={item.name} destinationCity={city} />
                <div className="attraction-title">🏨 {item.name}</div>
                <div className="attraction-address">{item.formatted}</div>
                <div className="attraction-address">Distance: {Math.round(item.distance / 1000)} km</div>
                <div className="hotel-actions">
                  <button type="button" className="view-details">View Details</button>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="view-details maps-link">Open in Google Maps</a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showWeatherModal && (
        <WeatherModal
          weather={weatherData}
          onClose={() => setShowWeatherModal(false)}
        />
      )}
    </div>
  );
}
