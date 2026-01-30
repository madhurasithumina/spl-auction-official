import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const SponsorCarousel = () => {
  const slides = [
    { type: 'video', src: '/assets/sriyani.mp4', alt: 'Sriyani Dresspoint' }
  ];

  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // start/refresh autoplay timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]); // refresh if slides length changes

  useEffect(() => {
    // when slide changes, ensure video (if any) plays
    const el = document.getElementById(`video-slide-${index}`);
    if (el && el.play) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  }, [index]);

  const goTo = (i) => setIndex(i);
  const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex(i => (i + 1) % slides.length);

  return (
    <div className="carousel">
      {slides.map((s, i) => (
        <div key={i} className={`carousel-slide ${i === index ? 'active' : ''}`}>
          {s.type === 'video' ? (
            <video
              id={`video-slide-${i}`}
              className="carousel-video"
              src={s.src}
              muted
              autoPlay={i === index}
              playsInline
              loop
              controls={false}
            />
          ) : (
            <img className="carousel-image" src={s.src} alt={s.alt} />
          )}
        </div>
      ))}

      <button className="carousel-control prev" onClick={prev} aria-label="Previous">‹</button>
      <button className="carousel-control next" onClick={next} aria-label="Next">›</button>

      <div className="carousel-dots">
        {slides.map((_, i) => (
          <button key={i} className={`dot ${i === index ? 'active' : ''}`} onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`}></button>
        ))}
      </div>
    </div>
  );
};

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
            <button className="nav-button" onClick={() => navigate('/match-setup')}>Match Setup</button>
            <button className="nav-button" onClick={() => navigate('/live-scoreboard')}>Live Score</button>
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

      {/* Hero Section (replaced with sponsor slideshow) */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-carousel-wrapper">
          <SponsorCarousel />
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
