import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [keySequence, setKeySequence] = useState('');

  // Listen for keyboard input "1234" to access admin login
  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = (keySequence + e.key).slice(-4); // Keep only last 4 characters
      setKeySequence(newSequence);
      
      if (newSequence === '1234') {
        navigate('/login');
        setKeySequence(''); // Reset sequence
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [keySequence, navigate]);

  const sponsors = [
    // Main Sponsors
    { name: "Sriyani Dress Point", image: "/assets/sriyani-image.jpeg" },
    { name: "Piyara Fashion", image: "/assets/piyara.jpeg" },
    { name: "Lady Center", image: "/assets/lady center.png" },
    { name: "Karunarathne Stores", image: "/assets/karunarathna.jpeg" },
    { name: "Nolimit", image: "/assets/nolimit.jpg" },
    { name: "SPUL", image: "/assets/supul.PNG" },
    // Other Sponsors
    { name: "Anjel Fashion", image: "/assets/anjel.png" },
    { name: "Ayu Pharmacy", image: "/assets/ayu pharmacy.jpeg" },
    { name: "Baylee", image: "/assets/baylee.jpeg" },
    { name: "Dias Family Mart", image: "/assets/dias.jpeg" },
    { name: "AUK", image: "/assets/dj.jpeg" },
    { name: "Fashion Bug", image: "/assets/fashion bug.png" },
    { name: "The Light House", image: "/assets/light house.jpg" },
    { name: "Net Core", image: "/assets/net core.png" },
    { name: "NoFolk", image: "/assets/nofolks-cresent.jpeg" },
    { name: "Sarathee", image: "/assets/sarathee.jpeg" },
    { name: "Sarita", image: "/assets/sarita.jpeg" },
    { name: "SPP", image: "/assets/spp.jpeg" },
    { name: "Text Wear", image: "/assets/textware.png" },
    { name: "TKS", image: "/assets/TKS.jpeg" },
    { name: "Unik Wear", image: "/assets/unik wear.jpeg" },
    { name: "ONE.Tech", image: "/assets/one tech.jpeg" },
    { name: "Delmo", image: "/assets/delmo.png" },
    { name: "Saffans", image: "/assets/saffans.jpeg" }
  ];

  // Sponsor carousel (copied from Home.js)
  const SponsorCarousel = () => {
    const slides = [
      {type:'video', src:'/assets/lady center.mp4', alt:'Lady Center'},
      { type: 'video', src: '/assets/sriyani.mp4', alt: 'Sriyani Dresspoint' },
      { type: 'video', src: '/assets/piyara-video.mp4', alt: 'Piyara Fashion' },
      { type: 'video', src: '/assets/nolimit-video.mp4', alt: 'Nolimit' },
      { type: 'video', src: '/assets/supul video.mp4', alt: 'SPUL-Collection' },
      { type: 'video', src: '/assets/delmo-video.mp4', alt: 'Delmo' }
    ];

    const [index, setIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const slideRefs = useRef([]);

    // Handle video ended event to play next video
    useEffect(() => {
      slideRefs.current.forEach((v, i) => {
        if (!v) return;
        
        const handleVideoEnd = () => {
          if (i === index) {
            setIndex((prevIndex) => (prevIndex + 1) % slides.length);
          }
        };

        v.addEventListener('ended', handleVideoEnd);
        
        return () => {
          v.removeEventListener('ended', handleVideoEnd);
        };
      });
    }, [index, slides.length]);

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

  const SponsorsMarquee = ({ sponsors = [] }) => {
    const items = [...sponsors, ...sponsors];
    return (
      <div className="sponsors-marquee" role="region" aria-label="Sponsors">
        <div className="marquee-track">
          {items.map((s, i) => (
            <div className="marquee-item" key={i}>
              <div className="sponsor-content">
                <img src={s.image} alt={s.name} />
                <span className="sponsor-name">{s.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="staff-dashboard-container">
      {/* Floating cricket accents */}
      <div className="cricket-accent"></div>
      <div className="cricket-accent"></div>
      <div className="cricket-accent"></div>
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/assets/spl logo.png" alt="SPL Logo" className="spl-logo" />
            <h1>SARASA PREMIER LEAGUE</h1>
          </div>
          <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <button className="close-menu" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">×</button>
            <button className="nav-button" onClick={() => { navigate('/staff-dashboard'); setIsMenuOpen(false); }}>Dashboard</button>
            <button className="nav-button" onClick={() => { navigate('/view-players?mode=staff'); setIsMenuOpen(false); }}>View Players</button>
            <button className="nav-button" onClick={() => { navigate('/teams?mode=staff'); setIsMenuOpen(false); }}>Teams</button>
            <button className="nav-button" onClick={() => { navigate('/live-scoreboard?mode=staff'); setIsMenuOpen(false); }}>Live Scoreboard</button>
            <button className="nav-button" onClick={() => { navigate('/points-table?mode=staff'); setIsMenuOpen(false); }}>Points Table</button>
            {/* <div className="user-info">
              <span className="username">{username}</span>
              <button className="logout-btn" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Logout</button>
            </div> */}
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
            <img src="/assets/piyara.jpeg" alt="Piyara Fashion" />
            <p>Piyara Fashion</p>
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
            <p>SPUL-Collection</p>
          </div>
        </div>
      </section>

      {/* Other Sponsors Section */}
      <section className="other-sponsors-section">
        <div className="other-sponsors-header">
          <div className="header-decoration left"></div>
          <h2 className="other-sponsors-title">
            <span className="title-icon">⭐</span>
            Powered By Our Partners
            <span className="title-icon">⭐</span>
          </h2>
          <div className="header-decoration right"></div>
        </div>
        <p className="other-sponsors-subtitle">Supporting Excellence in Cricket</p>
        
        <div className="other-sponsors-grid">
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/anjel.png" alt="Anjel Fashion" />
            </div>
            <h3 className="sponsor-card-name">Anjel Fashion</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/ayu pharmacy.jpeg" alt="Ayu Pharmacy" />
            </div>
            <h3 className="sponsor-card-name">Ayu Pharmacy</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/baylee.jpeg" alt="Baylee" />
            </div>
            <h3 className="sponsor-card-name">Baylee</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/dias.jpeg" alt="Dias Family Mart" />
            </div>
            <h3 className="sponsor-card-name">Dias Family Mart</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/dj.jpeg" alt="AUK" />
            </div>
            <h3 className="sponsor-card-name">AUK</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/fashion bug.png" alt="Fashion Bug" />
            </div>
            <h3 className="sponsor-card-name">Fashion Bug</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/light house.jpg" alt="The Light House" />
            </div>
            <h3 className="sponsor-card-name">The Light House</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/net core.png" alt="Net Core" />
            </div>
            <h3 className="sponsor-card-name">Net Core</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/nofolks-cresent.jpeg" alt="NoFolk" />
            </div>
            <h3 className="sponsor-card-name">NoFolk</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/sarathee.jpeg" alt="Sarathee" />
            </div>
            <h3 className="sponsor-card-name">Sarathee</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/sarita.jpeg" alt="Sarita" />
            </div>
            <h3 className="sponsor-card-name">Sarita</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/spp.jpeg" alt="SPP" />
            </div>
            <h3 className="sponsor-card-name">SPP</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/textware.png" alt="Text Wear" />
            </div>
            <h3 className="sponsor-card-name">Text Wear</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/TKS.jpeg" alt="TKS" />
            </div>
            <h3 className="sponsor-card-name">TKS</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/unik wear.jpeg" alt="Unik Wear" />
            </div>
            <h3 className="sponsor-card-name">Unik Wear</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/one tech.jpeg" alt="ONE.Tech" />
            </div>
            <h3 className="sponsor-card-name">ONE.Tech</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/delmo.png" alt="Delmo" />
            </div>
            <h3 className="sponsor-card-name">Delmo</h3>
          </div>
          
          <div className="other-sponsor-card">
            <div className="sponsor-logo-wrapper">
              <img src="/assets/saffans.jpeg" alt="Saffans" />
            </div>
            <h3 className="sponsor-card-name">Saffans</h3>
          </div>
        </div>
      </section>

      {/* Creative Footer Section */}
      <footer className="footer">
        <SponsorsMarquee sponsors={sponsors} />
        <div className="footer-content">
          <div className="footer-section footer-about">
            <div className="footer-logo">
              <div className="footer-cricket-ball"></div>
              <h3>SARASA PREMIER LEAGUE</h3>
            </div>
            <p className="footer-tagline">Bringing the excitement of SARASA PREMIER LEAGUE to life</p>
          </div>

          <div className="footer-section footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={() => navigate('/staff-dashboard')}>Dashboard</button></li>
              <li><button onClick={() => navigate('/view-players')}>View Players</button></li>
              <li><button onClick={() => navigate('/teams')}>Teams</button></li>
            </ul>
          </div>

          <div className="footer-section footer-contact">
            <h4>Contact Us</h4>
            <p><span className="footer-icon">📧</span> info@sarasapremierleague.com</p>
            <p><span className="footer-icon">📞</span> +94 123 456 789</p>
            <p><span className="footer-icon">📍</span> Colombo, Sri Lanka</p>
          </div>

          <div className="footer-section footer-social">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <button className="social-btn" aria-label="Facebook">f</button>
              <button className="social-btn" aria-label="Twitter">𝕏</button>
              <button className="social-btn" aria-label="Instagram">📷</button>
              <button className="social-btn" aria-label="YouTube">▶</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 SARASA PREMIER LEAGUE. All rights reserved.</p>
          <p className="footer-credits">Designed with ❤️ for Cricket Lovers</p>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;
