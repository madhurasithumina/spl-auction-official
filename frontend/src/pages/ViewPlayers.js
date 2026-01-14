import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ViewPlayers.css';

const ViewPlayers = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBowling, setFilterBowling] = useState('All');
  const [imageErrors, setImageErrors] = useState({});
  const userRole = localStorage.getItem('userRole') || 'admin';

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('https://spl.sarasagroup.lk/backend/api/players.php');
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setPlayers(response.data);
      } else {
        setPlayers([]);
        console.error('API response is not an array:', response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch players:', err);
      setError('Failed to load players');
      setPlayers([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleImageError = (playerId) => {
    setImageErrors(prev => ({
      ...prev,
      [playerId]: true
    }));
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getBowlingIcon = (style) => {
    const icons = {
      'Fast Bowling': '⚡',
      'Medium Fast': '💨',
      'Off Spin': '🌀',
      'Leg Spin': '🎯'
    };
    return icons[style] || '⚾';
  };

  const getPlayerCardColor = (index) => {
    const colors = [
      '#2D3C59', // Navy Blue

    ];
    return colors[index % colors.length];
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.player_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBowling = filterBowling === 'All' || player.bowling_style === filterBowling;
    return matchesSearch && matchesBowling;
  });

  return (
    <div className="view-players-container">
      {/* Header */}
      <header className="players-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate(userRole === 'staff' ? '/staff-dashboard' : '/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate(userRole === 'staff' ? '/staff-dashboard' : '/')}>
              {userRole === 'staff' ? 'Dashboard' : 'Home'}
            </button>
            <button className="nav-button active">View Players</button>
            {userRole === 'admin' && (
              <>
                <button className="nav-button" onClick={() => navigate('/auction')}>Auction</button>
              </>
            )}
            <button className="nav-button" onClick={() => navigate('/teams')}>Teams</button>
            {userRole === 'admin' && (
              <>
                <button className="nav-button" onClick={() => navigate('/reports')}>Reports</button>
                <button className="nav-button" onClick={() => navigate('/admin')}>Admin</button>
                <button className="nav-button" onClick={() => navigate('/register-player')}>
                  Register Player
                </button>
              </>
            )}
            <div className="user-info">
              <span className="username">{localStorage.getItem('username')}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">REGISTERED PLAYERS</h1>
          <p className="page-subtitle">Browse all registered players for SPL Tournament 2026</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="filters-container">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search players by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterBowling === 'All' ? 'active' : ''}`}
              onClick={() => setFilterBowling('All')}
            >
              All Players
            </button>
            <button 
              className={`filter-btn ${filterBowling === 'Fast Bowling' ? 'active' : ''}`}
              onClick={() => setFilterBowling('Fast Bowling')}
            >
              ⚡ Fast
            </button>
            <button 
              className={`filter-btn ${filterBowling === 'Medium Fast' ? 'active' : ''}`}
              onClick={() => setFilterBowling('Medium Fast')}
            >
              💨 Medium
            </button>
            <button 
              className={`filter-btn ${filterBowling === 'Off Spin' ? 'active' : ''}`}
              onClick={() => setFilterBowling('Off Spin')}
            >
              🌀 Off Spin
            </button>
            <button 
              className={`filter-btn ${filterBowling === 'Leg Spin' ? 'active' : ''}`}
              onClick={() => setFilterBowling('Leg Spin')}
            >
              🎯 Leg Spin
            </button>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="players-content">
        <div className="players-stats">
          <div className="stat-card">
            <div className="stat-number">{players.length}</div>
            <div className="stat-label">Total Players</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{filteredPlayers.length}</div>
            <div className="stat-label">Filtered Results</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading players...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchPlayers} className="retry-btn">Retry</button>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏏</div>
            <h3>No Players Found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={() => navigate('/register-player')} className="register-btn">
              Register First Player
            </button>
          </div>
        ) : (
          <div className="players-grid">
            {filteredPlayers.map((player, index) => (
              <div key={player.id} className="player-card" style={{ background: getPlayerCardColor(index) }}>
                <div className="player-card-image-wrapper">
                  {!imageErrors[player.id] ? (
                    <img 
                      src={`https://spl.sarasagroup.lk/assets/Images/players/${player.id}.png`}
                      alt={player.id}
                      className="player-full-image"
                      onError={() => handleImageError(player.id)}
                    />
                  ) : (
                    <div className="player-avatar-fallback" style={{ background: getAvatarColor(player.player_name) }}>
                      {getInitials(player.player_name)}
                    </div>
                  )}
                  
                  {player.sold_status === 'Sold' && (
                    <img 
                      src="/assets/soldoutRound.png"
                      alt="Sold"
                      className="sold-watermark"
                    />
                  )}
                  {player.sold_status === 'Hold' && (
                    <img 
                      src="/assets/on-hold.png"
                      alt="On Hold"
                      className="hold-watermark"
                    />
                  )}
                                    <div className="player-card-overlay">
                    <div className="player-card-footer">
                      <div className="player-year-badge">
                        <div className="year-text">2026</div>
                        <div className="tournament-text">SPL TOURNAMENT</div>
                      </div>
                      <h3 className="player-card-name">{player.player_name}</h3>
                      <div className="player-meta-info">
                        <span className="meta-badge">{player.batting_side}</span>
                        <span className="meta-separator">•</span>
                        <span className="meta-badge">{player.bowling_style}</span>
                        <span className="meta-separator">•</span>
                        <span className="meta-badge">Age {player.age}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewPlayers;
