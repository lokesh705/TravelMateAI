import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/destination.css';
import Navbar from '../components/Navbar';

export default function SavedTrips() {
  const navigate = useNavigate();
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSavedTrips = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await api.get('/user/saved-trips', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.success) {
          setSavedTrips(response.data.savedTrips || []);
        } else {
          setError(response.data?.message || 'Failed to load saved trips');
        }
      } catch (err) {
        setError('Failed to load saved trips');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedTrips();
  }, [navigate]);

  const handleRemoveTrip = async (placeId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await api.delete(`/user/saved-trips/${placeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setSavedTrips(response.data.savedTrips || []);
      }
    } catch (err) {
      console.error('Failed to remove trip:', err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <Navbar />
          <div className="loading-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-cards"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <Navbar />

        <main className="main-area">
          <section className="page-header">
            <h1 className="page-title">❤️ Your Saved Trips</h1>
            <p className="page-subtitle">Your favorite places, all in one place</p>
          </section>

          {error && <p className="error">{error}</p>}

          {!error && savedTrips.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">❤️</div>
              <h3>You haven't saved any trips yet</h3>
              <p>Start exploring and save your favorite destinations</p>
              <button className="primary-btn" onClick={() => navigate('/dashboard')}>
                Explore Destinations
              </button>
            </div>
          )}

          {savedTrips.length > 0 && (
            <div className="attraction-grid">
              {savedTrips.map((trip) => (
                <div className="attraction-card" key={trip.placeId}>
                  {trip.imageUrl ? (
                    <img className="attraction-image" src={trip.imageUrl} alt={trip.name} />
                  ) : (
                    <div className="attraction-image placeholder">Image unavailable</div>
                  )}
                  <div className="attraction-title">📍 {trip.name}</div>
                  <div className="attraction-address">{trip.formatted}</div>
                  <div className="attraction-actions">
                    <button
                      type="button"
                      className="view-details"
                      onClick={() => navigate(`/destination/attraction/${trip.placeId}`, {
                        state: {
                          attraction: trip,
                        },
                      })}
                    >
                      View Details
                    </button>
                  </div>
                  <button
                    type="button"
                    className="save-btn saved"
                    onClick={() => handleRemoveTrip(trip.placeId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
