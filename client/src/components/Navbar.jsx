import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const popupRef = useRef(null);

  const userRaw = localStorage.getItem('user');
  const userObj = userRaw ? JSON.parse(userRaw) : null;

  const [profile, setProfile] = useState({
    name: userObj?.name || 'User',
    email: userObj?.email || 'you@example.com',
    phone: userObj?.phone || '-',
  });

  useEffect(() => {
    setProfile({
      name: userObj?.name || 'User',
      email: userObj?.email || 'you@example.com',
      phone: userObj?.phone || '-',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRaw]);

  const initials = profile?.name ? profile.name.split(' ').map((s) => s[0]).join('').slice(0,2).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // close popup when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
        setEditMode(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleSave = () => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, name: profile.name, email: profile.email, phone: profile.phone };
    localStorage.setItem('user', JSON.stringify(updated));
    setEditMode(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="left">
          <Link to="/dashboard" className="logo">TravelMateAI</Link>
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`center-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>🏠 Dashboard</Link>
          <Link to="/saved-trips" onClick={() => setMobileMenuOpen(false)}>❤️ Saved Trips</Link>
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>👤 Profile</Link>
        </nav>

        <div className="right" ref={popupRef}>
          <div className="avatar" onClick={() => setOpen((v) => !v)}>{initials}</div>

          {open && (
            <div className="avatar-popup" role="dialog" aria-label="Profile popup">
              {!editMode ? (
                <div className="popup-view">
                  <div className="popup-header">
                    <div className="avatar-large">{initials}</div>
                    <div className="profile-info">
                      <div className="p-name">{profile.name}</div>
                      <div className="p-email">{profile.email}</div>
                      <div className="p-phone">{profile.phone}</div>
                    </div>
                  </div>

                  <div className="popup-actions">
                    <button className="btn" onClick={() => setEditMode(true)}>Edit Profile</button>
                    <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
                  </div>
                </div>
              ) : (
                <div className="popup-edit">
                  <label>
                    Name
                    <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                  </label>
                  <label>
                    Email
                    <input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                  </label>
                  <label>
                    Phone
                    <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                  </label>
                  <div className="popup-actions">
                    <button className="btn" onClick={handleSave}>Save</button>
                    <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
