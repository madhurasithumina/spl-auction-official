import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import './Auction.css';

const Auction = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [soldValue, setSoldValue] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [soldStatus, setSoldStatus] = useState('Sold');
  const [playerRole, setPlayerRole] = useState('Regular');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [auctionResult, setAuctionResult] = useState(null);
  const [audio] = useState(new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_d1718ab41b.mp3'));

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
    initializeTeams();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPlayers();
      fetchTeams();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeTeams = async () => {
    try {
      await axios.post(API_ENDPOINTS.teamsInitialize);
    } catch (error) {
      console.error('Error initializing teams:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.players);
      setPlayers(response.data.filter(p => p.sold_status !== 'Sold'));
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.teams);
      setTeams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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

  const filteredPlayers = players.filter(player =>
    player.player_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setSearchTerm(player.player_name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlayer) {
      alert('Please select a player');
      return;
    }

    if (soldStatus === 'Sold') {
      if (!selectedTeam) {
        alert('Please select a team');
        return;
      }
      
      // If role is Captain or Manager, sold value should be 0
      if (playerRole === 'Captain' || playerRole === 'Manager') {
        // Hold players have 0 value
        if (soldValue && parseInt(soldValue) !== 0) {
          alert(`${playerRole} is a hold player and must have 0 value`);
          return;
        }
      } else {
        // Regular players must have sold value
        if (!soldValue || parseInt(soldValue) <= 0) {
          alert('Please enter a valid sold value for regular players');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.teamsAuction, {
        playerId: selectedPlayer.id,
        teamName: selectedTeam,
        soldValue: (playerRole === 'Captain' || playerRole === 'Manager') ? 0 : parseInt(soldValue),
        soldStatus,
        playerRole: soldStatus === 'Sold' ? playerRole : ''
      });

      setAuctionResult({
        player: selectedPlayer,
        team: selectedTeam,
        value: (playerRole === 'Captain' || playerRole === 'Manager') ? 0 : soldValue,
        status: soldStatus,
        role: playerRole,
        message: response.data.message
      });
      
      setShowPopup(true);
      
      // Play celebration music if player is sold
      if (soldStatus === 'Sold') {
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Audio play failed:', err));
      }
      
      // Reset form
      setTimeout(() => {
        setShowPopup(false);
        audio.pause();
        audio.currentTime = 0;
        setSelectedPlayer(null);
        setSearchTerm('');
        setSoldValue('');
        setSelectedTeam('');
        setSoldStatus('Sold');
        setPlayerRole('Regular');
        fetchPlayers();
        fetchTeams();
      }, 3000);

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process auction');
    } finally {
      setLoading(false);
    }
  };

  const getTeamColor = (teamName) => {
    const colors = {
      'Software': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Marketing': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'Technical': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'Accounts': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };
    return colors[teamName] || colors['Software'];
  };

  return (
    <div className="auction-container">
      {/* Header */}
      <header className="auction-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/')}>Home</button>
            <button className="nav-button" onClick={() => navigate('/view-players')}>View Players</button>
            <button className="nav-button active">Auction</button>
            <button className="nav-button" onClick={() => navigate('/teams')}>Teams</button>
            <button className="nav-button" onClick={() => navigate('/reports')}>Reports</button>
            <button className="nav-button" onClick={() => navigate('/admin')}>Admin</button>
            <button className="nav-button" onClick={() => navigate('/register-player')}>Register Player</button>
            <div className="user-info">
              <span className="username">{localStorage.getItem('username')}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">PLAYER AUCTION</h1>
        <p className="page-subtitle">Bid and acquire players for your team</p>
      </div>

      {/* Teams Budget Display */}
      <div className="teams-budget-section">
        <div className="teams-budget-grid">
          {teams.map(team => (
            <div key={team.id} className="budget-card" style={{ background: getTeamColor(team.team_name) }}>
              <h3>{team.team_name}</h3>
              <div className="budget-amount">LKR {(Number(team.remaining_budget) || 0).toLocaleString()}</div>
              <div className="budget-label">Remaining Budget</div>
              <div className="players-count">{team.players?.length || 0} Players</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auction Content */}
      <div className="auction-content">
        {/* Left Panel - Search and Select Player */}
        <div className="search-panel">
          <h2>Select Player</h2>
          <div className="search-box-auction">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search player by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedPlayer(null);
              }}
            />
          </div>

          <div className="players-list-auction">
            {filteredPlayers.length === 0 ? (
              <div className="no-players">
                <p>No available players found</p>
              </div>
            ) : (
              filteredPlayers.map(player => (
                <div
                  key={player.id}
                  className={`player-item ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                  onClick={() => handleSelectPlayer(player)}
                >
                  <div className="player-item-avatar" style={{ background: getAvatarColor(player.player_name) }}>
                    {getInitials(player.player_name)}
                  </div>
                  <div className="player-item-info">
                    <div className="player-item-name">{player.player_name}</div>
                    <div className="player-item-details">
                      {player.age} yrs | {player.batting_side} | {player.bowling_style}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Auction Form */}
        <div className="auction-form-panel">
          <h2>Auction Details</h2>
          
          {selectedPlayer ? (
            <form onSubmit={handleSubmit} className="auction-form">
              <div className="selected-player-display">
                <div className="selected-avatar" style={{ background: getAvatarColor(selectedPlayer.player_name) }}>
                  {getInitials(selectedPlayer.player_name)}
                </div>
                <div className="selected-player-info">
                  <h3>{selectedPlayer.player_name}</h3>
                  <p>{selectedPlayer.age} years | {selectedPlayer.batting_side} | {selectedPlayer.bowling_style}</p>
                </div>
              </div>

              <div className="form-group">
                <label>Auction Status</label>
                <div className="status-buttons">
                  <button
                    type="button"
                    className={`status-btn ${soldStatus === 'Sold' ? 'active sold' : ''}`}
                    onClick={() => setSoldStatus('Sold')}
                  >
                    ✓ Sold
                  </button>
                  <button
                    type="button"
                    className={`status-btn ${soldStatus === 'Unsold' ? 'active unsold' : ''}`}
                    onClick={() => setSoldStatus('Unsold')}
                  >
                    ✗ Unsold
                  </button>
                </div>
              </div>

              {soldStatus === 'Sold' && (
                <>
                  <div className="form-group">
                    <label>Player Role</label>
                    <select
                      value={playerRole}
                      onChange={(e) => {
                        setPlayerRole(e.target.value);
                        // Auto-set sold value to 0 for Captain/Manager
                        if (e.target.value === 'Captain' || e.target.value === 'Manager') {
                          setSoldValue('0');
                        } else {
                          setSoldValue('');
                        }
                      }}
                      required
                    >
                      <option value="Regular">Regular Player</option>
                      <option value="Captain">Captain (Hold Player - LKR 0)</option>
                      <option value="Manager">Manager (Hold Player - LKR 0)</option>
                    </select>
                    {(playerRole === 'Captain' || playerRole === 'Manager') && (
                      <small style={{color: '#43e97b', display: 'block', marginTop: '8px'}}>
                        ℹ️ Hold players are sold at LKR 0 value (max 2 per team)
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Select Team</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      required
                    >
                      <option value="">Choose a team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.team_name}>
                          {team.team_name} (LKR {(Number(team.remaining_budget) || 0).toLocaleString()} available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sold Value (LKR)</label>
                    <input
                      type="number"
                      value={soldValue}
                      onChange={(e) => setSoldValue(e.target.value)}
                      placeholder={(playerRole === 'Captain' || playerRole === 'Manager') ? '0 (Hold Player)' : 'Enter sold amount'}
                      min="0"
                      disabled={playerRole === 'Captain' || playerRole === 'Manager'}
                      required
                    />
                    {(playerRole === 'Captain' || playerRole === 'Manager') && (
                      <small style={{color: '#ff0844', display: 'block', marginTop: '8px'}}>
                        🔒 Hold players have fixed 0 value
                      </small>
                    )}
                  </div>
                </>
              )}

              <button type="submit" className="submit-auction-btn" disabled={loading}>
                {loading ? 'Processing...' : soldStatus === 'Sold' ? '💰 Confirm Sale' : '✗ Mark as Unsold'}
              </button>
            </form>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">🏏</div>
              <p>Select a player from the list to start auction</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Popup */}
      {showPopup && auctionResult && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header" style={{ background: auctionResult.status === 'Sold' ? getTeamColor(auctionResult.team) : '#636e72' }}>
              <h2>{auctionResult.status === 'Sold' ? '🎉 SOLD!' : '✗ UNSOLD'}</h2>
            </div>
            <div className="popup-body">
              <div className="popup-avatar" style={{ background: getAvatarColor(auctionResult.player.player_name) }}>
                {getInitials(auctionResult.player.player_name)}
              </div>
              <h3>{auctionResult.player.player_name}</h3>
              {auctionResult.status === 'Sold' && (
                <>
                  {auctionResult.role && auctionResult.role !== 'Regular' && (
                    <div className="popup-role" style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {auctionResult.role === 'Captain' ? '⭐ CAPTAIN' : '👔 MANAGER'}
                    </div>
                  )}
                  <div className="popup-team">{auctionResult.team}</div>
                  <div className="popup-value">
                    LKR {parseInt(auctionResult.value).toLocaleString()}
                    {(auctionResult.role === 'Captain' || auctionResult.role === 'Manager') && (
                      <span style={{fontSize: '14px', color: '#43e97b', marginLeft: '10px'}}>
                        (Hold Player)
                      </span>
                    )}
                  </div>
                </>
              )}
              <p className="popup-message">{auctionResult.message}</p>
            </div>
            <button className="popup-close" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auction;
