import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Teams.css';

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('http://localhost:8081/backend/api/teams.php');
      setTeams(response.data);
      if (response.data.length > 0) {
        setSelectedTeam(response.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const getTeamColor = (teamName) => {
    const colors = {
      'Software': { primary: '#667eea', secondary: '#764ba2', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      'Marketing': { primary: '#f093fb', secondary: '#f5576c', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      'Technical': { primary: '#4facfe', secondary: '#00f2fe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      'Accounts': { primary: '#43e97b', secondary: '#38f9d7', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
    };
    return colors[teamName] || colors['Software'];
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
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

  const getTotalSpent = (team) => {
    const initial = Number(team.initial_budget) || 0;
    const remaining = Number(team.remaining_budget) || 0;
    return initial - remaining;
  };

  return (
    <div className="teams-container">
      {/* Header */}
      <header className="teams-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/')}>Home</button>
            <button className="nav-button" onClick={() => navigate('/view-players')}>View Players</button>
            <button className="nav-button" onClick={() => navigate('/auction')}>Auction</button>
            <button className="nav-button active">Teams</button>
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
      <div className="teams-page-header">
        <h1 className="page-title">TEAM SQUADS</h1>
        <p className="page-subtitle">View all teams and their acquired players</p>
      </div>

      {/* Teams Navigation */}
      <div className="teams-nav-section">
        <div className="teams-nav">
          {teams.map(team => (
            <button
              key={team.id}
              className={`team-nav-btn ${selectedTeam?.id === team.id ? 'active' : ''}`}
              style={{ 
                background: selectedTeam?.id === team.id ? getTeamColor(team.team_name).gradient : 'rgba(255, 255, 255, 0.1)',
                borderColor: getTeamColor(team.team_name).primary
              }}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="team-nav-name">{team.team_name}</div>
              <div className="team-nav-count">{team.players?.length || 0} Players</div>
            </button>
          ))}
        </div>
      </div>

      {/* Team Details */}
      {loading ? (
        <div className="loading-section">
          <div className="spinner"></div>
          <p>Loading teams...</p>
        </div>
      ) : selectedTeam ? (
        <div className="team-details-section">
          <div className="team-details-container">
            {/* Team Header Card */}
            <div className="team-header-card" style={{ background: getTeamColor(selectedTeam.team_name).gradient }}>
              <div className="team-header-content">
                <div className="team-logo">
                  <div className="team-logo-circle">
                    {selectedTeam.team_name.charAt(0)}
                  </div>
                </div>
                <div className="team-header-info">
                  <h2>{selectedTeam.team_name}</h2>
                  <div className="team-stats-row">
                    <div className="team-stat">
                      <div className="stat-value">{selectedTeam.players?.length || 0}</div>
                      <div className="stat-label">Players</div>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="team-stat">
                      <div className="stat-value">LKR {(Number(getTotalSpent(selectedTeam)) || 0).toLocaleString()}</div>
                      <div className="stat-label">Total Spent</div>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="team-stat">
                      <div className="stat-value">LKR {(Number(selectedTeam.remaining_budget) || 0).toLocaleString()}</div>
                      <div className="stat-label">Remaining</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Players Grid */}
            {selectedTeam.players?.length === 0 ? (
              <div className="no-players-section">
                <div className="no-players-icon">🏏</div>
                <h3>No Players Yet</h3>
                <p>This team hasn't acquired any players yet</p>
                <button className="go-auction-btn" onClick={() => navigate('/auction')}>
                  Go to Auction
                </button>
              </div>
            ) : (
              <div className="team-players-grid">
                {selectedTeam.players?.map((player, index) => (
                  <div key={player.id} className="team-player-card">
                    <div className="player-card-number" style={{ background: getTeamColor(selectedTeam.team_name).gradient }}>
                      #{index + 1}
                    </div>
                    {player.player_role && player.player_role !== 'Regular' && (
                      <div className="player-role-badge" style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '6px 12px',
                        background: player.player_role === 'Captain' 
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
                          : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                        zIndex: 10
                      }}>
                        {player.player_role === 'Captain' ? '⭐ CAPTAIN' : '👔 MANAGER'}
                      </div>
                    )}
                    <div className="team-player-avatar" style={{ background: getAvatarColor(player.player_name) }}>
                      {getInitials(player.player_name)}
                    </div>
                    <div className="team-player-name">{player.player_name}</div>
                    <div className="team-player-age">{player.age} years</div>
                    
                    <div className="team-player-stats">
                      <div className="stat-item">
                        <span className="stat-icon">🏏</span>
                        <span className="stat-text">{player.batting_side}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">⚾</span>
                        <span className="stat-text">{player.bowling_side}</span>
                      </div>
                      <div className="stat-item full">
                        <span className="stat-icon">{getBowlingIcon(player.bowling_style)}</span>
                        <span className="stat-text">{player.bowling_style}</span>
                      </div>
                    </div>

                    <div className="team-player-value" style={{ background: getTeamColor(selectedTeam.team_name).gradient }}>
                      LKR {(Number(player.sold_value) || 0).toLocaleString()}
                      {(player.player_role === 'Captain' || player.player_role === 'Manager') && (
                        <span style={{fontSize: '11px', display: 'block', marginTop: '3px', opacity: 0.9}}>
                          (Hold Player)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-teams-section">
          <p>No teams available</p>
        </div>
      )}

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-container">
          <h2>Tournament Summary</h2>
          <div className="summary-grid">
            {teams.map(team => (
              <div key={team.id} className="summary-card" style={{ borderTopColor: getTeamColor(team.team_name)?.primary }}>
                <h3>{team.team_name}</h3>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="summary-label">Players:</span>
                    <span className="summary-value">{team.players?.length || 0}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Spent:</span>
                    <span className="summary-value">LKR {(Number(getTotalSpent(team)) || 0).toLocaleString()}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-label">Remaining:</span>
                    <span className="summary-value">LKR {(Number(team.remaining_budget) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
