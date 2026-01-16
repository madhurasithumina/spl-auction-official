import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleRegisterPlayer = () => {
    navigate('/register-player');
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/')}>Home</button>
            <button className="nav-button" onClick={() => navigate('/view-players')}>View Players</button>
            <button className="nav-button" onClick={() => navigate('/auction')}>Auction</button>
            <button className="nav-button" onClick={() => navigate('/teams')}>Teams</button>
            <button className="nav-button" onClick={() => navigate('/reports')}>Reports</button>
            <button className="nav-button" onClick={() => navigate('/admin')}>Admin</button>
            <button className="nav-button register-btn" onClick={handleRegisterPlayer}>
              Player Registration
            </button>
            <div className="user-info">
              <span className="username">{username}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            WELCOME TO SPL CRICKET AUCTION
          </h1>
          <p className="hero-subtitle">
            Premier Softball Cricket Tournament 2026
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={() => navigate('/auction')}>
              Start Auction
            </button>
            <button className="secondary-button" onClick={() => navigate('/teams')}>
              View Teams
            </button>
          </div>
        </div>
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">4</div>
            <div className="stat-label">Teams</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">2026</div>
            <div className="stat-label">Season</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">45+</div>
            <div className="stat-label">Players</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Tournament Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏏</div>
              <h3>Player Registration</h3>
              <p>Register players with complete cricket profiles including batting and bowling statistics</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Live Auction</h3>
              <p>Real-time bidding system for team owners to build their dream cricket teams</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Comprehensive player statistics and performance tracking throughout the tournament</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Tournament Management</h3>
              <p>Complete tournament scheduling, match updates, and live scoring system</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 SPL Cricket Auction. All rights reserved.</p>
          <p>Powered by MERN Stack</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
