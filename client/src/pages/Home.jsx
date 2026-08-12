import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/home.css';
import '../styles/navbar.css';
import '../styles/footer.css';

export default function Home() {
  return (
    <div className="page home-page">
      <Navbar />

      <main className="hero-section">
        <div className="hero-text">
          <p className="eyebrow">TravelMateAI</p>
          <h1>Explore the World with AI</h1>
          <p className="description">
            Plan smarter, travel better, and discover amazing destinations with
            TravelMateAI.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="primary-btn">
              Get Started
            </Link>
            <Link to="/login" className="secondary-btn">
              Login
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
