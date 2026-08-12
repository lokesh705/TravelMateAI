import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import '../styles/dashboard.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data.user);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load profile.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

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

  const initials = user?.name ? user.name.split(' ').map((s) => s[0]).join('').slice(0,2).toUpperCase() : 'U';

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <Navbar />

        <main className="main-area">
          <section className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar-large">{initials}</div>
              <div className="profile-info">
                <h1 className="profile-name">{user?.name || 'User'}</h1>
                <p className="profile-email">{user?.email || 'you@example.com'}</p>
                <p className="profile-phone">{user?.phone || 'Phone not provided'}</p>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn" onClick={handleLogout}>
                Logout
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
