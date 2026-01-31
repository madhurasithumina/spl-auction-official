import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Sponsor carousel (copied from Home.js)
  const SponsorCarousel = () => {
    const slides = [
      { type: 'video', src: '/assets/sriyani.mp4', alt: 'Sriyani Dresspoint' }
    ];

    const [index, setIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const timerRef = useRef(null);
    const slideRefs = useRef([]);

    useEffect(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setIndex(i => (i + 1) % slides.length);
      }, 6000);
      return () => clearInterval(timerRef.current);
    }, [slides.length]);

    useEffect(() => {
      slideRefs.current.forEach((v, i) => {
        if (!v) return;
        try {
          if (i === index) {
            v.currentTime = 0;
            v.muted = isMuted;
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        } catch (e) {}
      });
    }, [index, isMuted]);

    const goTo = (i) => setIndex(i);
    const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length);
    const next = () => setIndex(i => (i + 1) % slides.length);

    return (
      <div className="carousel">
        {slides.map((s, i) => (
          <div key={i} className={`carousel-slide ${i === index ? 'active' : ''}`}>
            {s.type === 'video' ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <video
                  id={`video-slide-${i}`}
                  ref={(el) => (slideRefs.current[i] = el)}
                  className="carousel-video"
                  src={s.src}
                  muted={isMuted}
                  autoPlay={i === index}
                  playsInline
                  loop
                  controls={false}
                />
                <button
                  className={`video-unmute-btn ${isMuted ? 'muted' : 'unmuted'}`}
                  onClick={() => {
                    const v = slideRefs.current[i];
                    if (!v) return;
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    try {
                      v.muted = newMuted;
                      if (!newMuted) v.play().catch(() => {});
                    } catch (e) {}
                  }}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
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

  const SponsorsMarquee = ({ names = [] }) => {
    const items = [...names, ...names];
    return (
      <div className="sponsors-marquee" role="region" aria-label="Sponsors">
        <div className="marquee-track">
          {items.map((n, i) => (
            <div className="marquee-item" key={i}>{n}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION - STAFF</h1>
          </div>
          <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <button className="close-menu" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">×</button>
            <button className="nav-button" onClick={() => { navigate('/staff-dashboard'); setIsMenuOpen(false); }}>Dashboard</button>
            <button className="nav-button" onClick={() => { navigate('/view-players'); setIsMenuOpen(false); }}>View Players</button>
            <button className="nav-button" onClick={() => { navigate('/teams'); setIsMenuOpen(false); }}>Teams</button>
            <div className="user-info">
              <span className="username">{username}</span>
              <button className="logout-btn" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Scroll button removed */}

      {/* (Hero removed) Sponsor slideshow shown below for a cleaner dashboard */}

      {/* Available Functions removed per user request */}

      {/* Hero Section (sponsor slideshow like Home) */}
      <section className="hero-section hero-carousel">
        <div className="hero-overlay"></div>
        <div id="sponsors" className="hero-carousel-wrapper">
          <SponsorCarousel />
        </div>
      </section>

      {/* Main Sponsors Section */}
      <section className="main-sponsors-section">
        <h2 className="main-sponsors-title">Main Sponsors</h2>
        <div className="sponsors-logos">
          <div className="sponsor-item">
            <img src="/assets/sriyani-image.jpeg" alt="Sriyani Dress Point" />
            <p>Sriyani Dress Point</p>
          </div>
          <div className="sponsor-item">
            <img src="/assets/lady center.png" alt="Lady Center" />
            <p>Lady Center</p>
          </div>
          <div className="sponsor-item">
            <img src="/assets/karunarathna.jpeg" alt="Karunarathne Stores" />
            <p>Karunarathne Stores</p>
          </div>
          <div className="sponsor-item">
            <img src="/assets/nolimit.jpg" alt="Nolimit" />
            <p>Nolimit</p>
          </div>
          <div className="sponsor-item">
            <img src="/assets/supul.PNG" alt="SPUL" />
            <p>SPUL</p>
          </div>
        </div>
      </section>

      {/* Footer with sponsors marquee */}
      <footer className="footer">
        <SponsorsMarquee names={["Sriyani Dress Point", "Nolimit", "Karunarathne Stores"]} />
        <div className="footer-content">
          <p>&copy; 2026 SPL Cricket Auction. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;
