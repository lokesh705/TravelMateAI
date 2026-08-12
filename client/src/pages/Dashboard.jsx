import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/dashboard.css';
import SearchBar from '../components/SearchBar';
import '../styles/destination.css';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedTrips, setSavedTrips] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data.user);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load profile.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedTrips = async () => {
      try {
        const response = await api.get('/user/saved-trips', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.success) {
          setSavedTrips(response.data.savedTrips || []);
        }
      } catch (err) {
        console.error('Failed to fetch saved trips:', err);
      }
    };

    fetchProfile();
    fetchSavedTrips();
  }, [navigate]);

  // Ensure SearchBar input placeholder matches requirement (without changing SearchBar file)
  useEffect(() => {
    const id = setTimeout(() => {
      const input = document.querySelector('input[aria-label="Search city"]');
      if (input) {
        input.placeholder = 'Search cities, tourist places, temples, beaches, waterfalls...';
      }
    }, 300);
    return () => clearTimeout(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <Navbar />
          <div className="loading-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-hero"></div>
            <div className="skeleton-cards"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <Navbar />
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <Navbar />

        <main className="main-area">
          {/* Hero Section */}
          <section className="dashboard-hero">
            <div className="hero-content">
              <h1 className="hero-title">Discover your next adventure</h1>
              <p className="hero-subtitle">
                Explore destinations, attractions, hotels, restaurants and more.
              </p>
            </div>
          </section>

          {/* Search Section */}
          <section className="search-section">
            <div className="search-container">
              <SearchBar initialResult={location.state} />
            </div>
          </section>

          {/* Quick Actions */}
          <section className="quick-actions">
            <div className="action-card" onClick={() => navigate('/saved-trips')}>
              <div className="action-icon">❤️</div>
              <div className="action-text">
                <h3>Saved Trips</h3>
                <p>{savedTrips.length} places saved</p>
              </div>
            </div>
            <div className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon">👤</div>
              <div className="action-text">
                <h3>My Profile</h3>
                <p>Manage your account</p>
              </div>
            </div>
          </section>

          {/* Saved Trips Preview */}
          {savedTrips.length > 0 && (
            <section className="saved-trips-preview">
              <div className="section-header">
                <h2>❤️ Your Saved Trips</h2>
                <button className="view-all-btn" onClick={() => navigate('/saved-trips')}>
                  View All
                </button>
              </div>
              <div className="trips-grid">
                {savedTrips.slice(0, 3).map((trip) => (
                  <div 
                    className="trip-card" 
                    key={trip.placeId}
                    onClick={() => navigate(`/destination/attraction/${trip.placeId}`, {
                      state: { attraction: trip },
                    })}
                  >
                    {trip.imageUrl ? (
                      <img src={trip.imageUrl} alt={trip.name} className="trip-image" />
                    ) : (
                      <div className="trip-image placeholder">No Image</div>
                    )}
                    <div className="trip-info">
                      <h4>{trip.name}</h4>
                      <p>{trip.formatted}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search results are handled by SearchBar's DestinationCard component when present */}
        </main>
      </div>
    </div>
  );
}
