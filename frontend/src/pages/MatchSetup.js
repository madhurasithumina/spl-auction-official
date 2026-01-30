import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './MatchSetup.css';

const API_BASE = `${API_BASE_URL}/backend/api`;

const MatchSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('userRole') || 'admin';

  // Match Setup State
  const [matchData, setMatchData] = useState({
    team1_id: '',
    team2_id: '',
    total_overs: 20,
    toss_winner_id: '',
    toss_choice: '',
    venue: 'SPL Stadium',
    match_date: new Date().toISOString().split('T')[0]
  });

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [team1XI, setTeam1XI] = useState([]);
  const [team2XI, setTeam2XI] = useState([]);
  const [matchId, setMatchId] = useState(null);
  const [incompleteMatches, setIncompleteMatches] = useState([]);

  useEffect(() => {
    fetchTeams();
    fetchIncompleteMatches();
    const interval = setInterval(fetchIncompleteMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncompleteMatches = async () => {
    try {
      const response = await axios.get(`${API_BASE}/matches/index.php`);
      const incomplete = response.data.filter(m => m.status === 'live' || m.status === 'innings_break');
      setIncompleteMatches(incomplete);
    } catch (error) {
      console.error('Error fetching incomplete matches:', error);
    }
  };

  useEffect(() => {
    if (matchData.team1_id) {
      fetchTeamPlayers(matchData.team1_id, setTeam1Players);
    }
    if (matchData.team2_id) {
      fetchTeamPlayers(matchData.team2_id, setTeam2Players);
    }
  }, [matchData.team1_id, matchData.team2_id]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE}/teams.php`);
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setLoading(false);
    }
  };

  const fetchTeamPlayers = async (teamId, setPlayers) => {
    try {
      console.log('Fetching players for team ID:', teamId);
      const response = await axios.get(`${API_BASE}/teams.php?id=${teamId}`);
      console.log('Team API response:', response.data);
      if (response.data && response.data.players) {
        console.log('Players found:', response.data.players.length);
        setPlayers(response.data.players);
      } else {
        console.log('No players in response');
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
      setPlayers([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const getTeamColor = (teamName) => {
    const colors = {
      'Software': { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      'Marketing': { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      'Technical': { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      'Accounts': { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
    };
    return colors[teamName]?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleTeamSelect = (teamKey, teamId) => {
    setMatchData(prev => ({
      ...prev,
      [teamKey]: teamId,
      // Reset toss winner if one of the teams changes
      toss_winner_id: teamKey === 'team1_id' || teamKey === 'team2_id' ? '' : prev.toss_winner_id
    }));
  };

  const handlePlayerSelect = (player, teamNum) => {
    if (teamNum === 1) {
      const isSelected = team1XI.find(p => p.player_id === player.id);
      if (isSelected) {
        setTeam1XI(team1XI.filter(p => p.player_id !== player.id));
      } else if (team1XI.length < 11) {
        setTeam1XI([...team1XI, { 
          player_id: player.id, 
          player_name: player.player_name,
          batting_order: team1XI.length + 1,
          is_captain: false,
          is_wicketkeeper: false
        }]);
      }
    } else {
      const isSelected = team2XI.find(p => p.player_id === player.id);
      if (isSelected) {
        setTeam2XI(team2XI.filter(p => p.player_id !== player.id));
      } else if (team2XI.length < 11) {
        setTeam2XI([...team2XI, { 
          player_id: player.id, 
          player_name: player.player_name,
          batting_order: team2XI.length + 1,
          is_captain: false,
          is_wicketkeeper: false
        }]);
      }
    }
  };

  const toggleRole = (playerId, role, teamNum) => {
    const updateXI = teamNum === 1 ? setTeam1XI : setTeam2XI;
    const currentXI = teamNum === 1 ? team1XI : team2XI;
    
    updateXI(currentXI.map(p => {
      if (p.player_id === playerId) {
        return { ...p, [role]: !p[role] };
      }
      // If setting captain, remove captain from others
      if (role === 'is_captain' && !currentXI.find(pl => pl.player_id === playerId)?.[role]) {
        return { ...p, is_captain: false };
      }
      return p;
    }));
  };

  const createMatch = async () => {
    try {
      setLoading(true);
      
      // Create match
      const matchResponse = await axios.post(`${API_BASE}/matches/index.php`, matchData);
      const newMatchId = matchResponse.data.match_id;
      setMatchId(newMatchId);
      
      // Save Playing XI for both teams
      await axios.post(`${API_BASE}/matches/playing_xi.php`, {
        match_id: newMatchId,
        team_id: matchData.team1_id,
        players: team1XI
      });
      
      await axios.post(`${API_BASE}/matches/playing_xi.php`, {
        match_id: newMatchId,
        team_id: matchData.team2_id,
        players: team2XI
      });
      
      setLoading(false);
      setStep(5); // Success step
      
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error creating match. Please try again.');
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return matchData.team1_id && matchData.team2_id && matchData.team1_id !== matchData.team2_id;
      case 2:
        return matchData.total_overs > 0 && matchData.toss_winner_id && matchData.toss_choice;
      case 3:
        return team1XI.length === 11;
      case 4:
        return team2XI.length === 11;
      default:
        return false;
    }
  };

  const getSelectedTeam = (teamId) => teams.find(t => t.id === parseInt(teamId));

  if (loading && step === 1) {
    return (
      <div className="match-setup-container">
        <div className="loading-screen">
          <div className="cricket-ball-loader"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="match-setup-container">
      {/* Header */}
      <header className="match-setup-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate(userRole === 'staff' ? '/staff-dashboard' : '/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL LIVE</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/')}>Home</button>
            <button className="nav-button" onClick={() => navigate('/live-scoreboard')}>Live Scores</button>
            <button className="nav-button active">New Match</button>
            {incompleteMatches.length > 0 && (
              <button className="nav-button live-match" onClick={() => navigate(`/scoring/${incompleteMatches[0].id}`)}>
                <span className="live-dot"></span>
                {incompleteMatches[0].status === 'innings_break' ? 'Start 2nd Innings' : 'Continue Scoring'}
              </button>
            )}
          </nav>
          <div className="user-info">
            <span className="username">{localStorage.getItem('username') || 'Admin'}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="progress-section">
        <div className="progress-steps">
          {['Select Teams', 'Match Settings', 'Team 1 XI', 'Team 2 XI', 'Confirm'].map((label, idx) => (
            <div key={idx} className={`progress-step ${step > idx + 1 ? 'completed' : ''} ${step === idx + 1 ? 'active' : ''}`}>
              <div className="step-number">{step > idx + 1 ? '✓' : idx + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="setup-content">
        {/* Step 1: Select Teams */}
        {step === 1 && (
          <div className="step-panel">
            <h2 className="step-title">🏏 Select Playing Teams</h2>
            <p className="step-subtitle">Choose the two teams that will compete in this match</p>
            
            <div className="teams-selection-grid">
              <div className="team-selection-box">
                <h3>Team 1</h3>
                <div className="team-cards">
                  {teams.map(team => (
                    <div 
                      key={team.id}
                      className={`team-card ${matchData.team1_id === team.id.toString() ? 'selected' : ''} ${matchData.team2_id === team.id.toString() ? 'disabled' : ''}`}
                      style={{ background: getTeamColor(team.team_name) }}
                      onClick={() => matchData.team2_id !== team.id.toString() && handleTeamSelect('team1_id', team.id.toString())}
                    >
                      <div className="team-card-icon">🏏</div>
                      <h4>{team.team_name}</h4>
                      <p>{team.players?.length || 0} Players</p>
                      {matchData.team1_id === team.id.toString() && <div className="selected-badge">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="vs-divider">
                <span>VS</span>
              </div>
              
              <div className="team-selection-box">
                <h3>Team 2</h3>
                <div className="team-cards">
                  {teams.map(team => (
                    <div 
                      key={team.id}
                      className={`team-card ${matchData.team2_id === team.id.toString() ? 'selected' : ''} ${matchData.team1_id === team.id.toString() ? 'disabled' : ''}`}
                      style={{ background: getTeamColor(team.team_name) }}
                      onClick={() => matchData.team1_id !== team.id.toString() && handleTeamSelect('team2_id', team.id.toString())}
                    >
                      <div className="team-card-icon">🏏</div>
                      <h4>{team.team_name}</h4>
                      <p>{team.players?.length || 0} Players</p>
                      {matchData.team2_id === team.id.toString() && <div className="selected-badge">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Match Settings */}
        {step === 2 && (
          <div className="step-panel">
            <h2 className="step-title">⚙️ Match Settings</h2>
            <p className="step-subtitle">Configure match details, toss winner and their choice</p>
            
            <div className="settings-grid">
              <div className="setting-card">
                <label>Total Overs</label>
                <div className="overs-selector">
                  {[5, 10, 15, 20, 50].map(overs => (
                    <button 
                      key={overs}
                      className={`overs-btn ${matchData.total_overs === overs ? 'active' : ''}`}
                      onClick={() => setMatchData(prev => ({ ...prev, total_overs: overs }))}
                    >
                      {overs}
                    </button>
                  ))}
                  <input 
                    type="number" 
                    placeholder="Custom"
                    className="custom-overs"
                    min="1"
                    max="50"
                    value={![5, 10, 15, 20, 50].includes(matchData.total_overs) ? matchData.total_overs : ''}
                    onChange={(e) => setMatchData(prev => ({ ...prev, total_overs: parseInt(e.target.value) || 20 }))}
                  />
                </div>
              </div>

              <div className="setting-card">
                <label>Match Date</label>
                <input 
                  type="date" 
                  className="date-input"
                  value={matchData.match_date}
                  onChange={(e) => setMatchData(prev => ({ ...prev, match_date: e.target.value }))}
                />
              </div>

              <div className="setting-card">
                <label>Venue</label>
                <input 
                  type="text" 
                  className="venue-input"
                  placeholder="Enter venue name"
                  value={matchData.venue}
                  onChange={(e) => setMatchData(prev => ({ ...prev, venue: e.target.value }))}
                />
              </div>
            </div>

            <div className="toss-section">
              <h3>🪙 Toss Winner</h3>
              <div className="toss-teams">
                {[matchData.team1_id, matchData.team2_id].map(teamId => {
                  const team = getSelectedTeam(teamId);
                  if (!team) return null;
                  return (
                    <div 
                      key={teamId}
                      className={`toss-team-card ${matchData.toss_winner_id === teamId ? 'selected' : ''}`}
                      style={{ background: getTeamColor(team.team_name) }}
                      onClick={() => setMatchData(prev => ({ ...prev, toss_winner_id: teamId }))}
                    >
                      <h4>{team.team_name}</h4>
                      {matchData.toss_winner_id === teamId && <div className="winner-badge">🏆 Won Toss</div>}
                    </div>
                  );
                })}
              </div>

              {matchData.toss_winner_id && (
                <div className="toss-choice">
                  <h3>Winner's Choice</h3>
                  <div className="choice-buttons">
                    <button 
                      className={`choice-btn bat ${matchData.toss_choice === 'bat' ? 'active' : ''}`}
                      onClick={() => setMatchData(prev => ({ ...prev, toss_choice: 'bat' }))}
                    >
                      <span className="choice-icon">🏏</span>
                      <span>Bat First</span>
                    </button>
                    <button 
                      className={`choice-btn bowl ${matchData.toss_choice === 'bowl' ? 'active' : ''}`}
                      onClick={() => setMatchData(prev => ({ ...prev, toss_choice: 'bowl' }))}
                    >
                      <span className="choice-icon">⚾</span>
                      <span>Bowl First</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Team 1 Playing XI */}
        {step === 3 && (
          <div className="step-panel">
            <h2 className="step-title">👥 {getSelectedTeam(matchData.team1_id)?.team_name} - Playing XI</h2>
            <p className="step-subtitle">Select 11 players for the match ({team1XI.length}/11 selected)</p>
            
            <div className="playing-xi-section">
              <div className="available-players">
                <h3>Available Players</h3>
                <div className="players-grid">
                  {team1Players.map(player => {
                    const isSelected = team1XI.find(p => p.player_id === player.id);
                    return (
                      <div 
                        key={player.id}
                        className={`player-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handlePlayerSelect(player, 1)}
                      >
                        <div className="player-avatar" style={{ background: getTeamColor(getSelectedTeam(matchData.team1_id)?.team_name) }}>
                          {getInitials(player.player_name)}
                        </div>
                        <div className="player-info">
                          <h4>{player.player_name}</h4>
                          <p>{player.batting_style} • {player.bowling_style || 'N/A'}</p>
                        </div>
                        {isSelected && <div className="select-badge">✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="selected-xi">
                <h3>Selected Playing XI</h3>
                <div className="xi-list">
                  {team1XI.map((player, index) => (
                    <div key={player.player_id} className="xi-player">
                      <span className="xi-number">{index + 1}</span>
                      <span className="xi-name">{player.player_name}</span>
                      <div className="xi-roles">
                        <button 
                          className={`role-btn ${player.is_captain ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleRole(player.player_id, 'is_captain', 1); }}
                        >
                          C
                        </button>
                        <button 
                          className={`role-btn ${player.is_wicketkeeper ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleRole(player.player_id, 'is_wicketkeeper', 1); }}
                        >
                          WK
                        </button>
                      </div>
                      <button className="remove-btn" onClick={() => handlePlayerSelect({ id: player.player_id }, 1)}>×</button>
                    </div>
                  ))}
                  {team1XI.length < 11 && (
                    <div className="xi-placeholder">
                      {Array(11 - team1XI.length).fill(0).map((_, i) => (
                        <div key={i} className="xi-player placeholder">
                          <span className="xi-number">{team1XI.length + i + 1}</span>
                          <span className="xi-name">Select player...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Team 2 Playing XI */}
        {step === 4 && (
          <div className="step-panel">
            <h2 className="step-title">👥 {getSelectedTeam(matchData.team2_id)?.team_name} - Playing XI</h2>
            <p className="step-subtitle">Select 11 players for the match ({team2XI.length}/11 selected)</p>
            
            <div className="playing-xi-section">
              <div className="available-players">
                <h3>Available Players</h3>
                <div className="players-grid">
                  {team2Players.map(player => {
                    const isSelected = team2XI.find(p => p.player_id === player.id);
                    return (
                      <div 
                        key={player.id}
                        className={`player-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handlePlayerSelect(player, 2)}
                      >
                        <div className="player-avatar" style={{ background: getTeamColor(getSelectedTeam(matchData.team2_id)?.team_name) }}>
                          {getInitials(player.player_name)}
                        </div>
                        <div className="player-info">
                          <h4>{player.player_name}</h4>
                          <p>{player.batting_style} • {player.bowling_style || 'N/A'}</p>
                        </div>
                        {isSelected && <div className="select-badge">✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="selected-xi">
                <h3>Selected Playing XI</h3>
                <div className="xi-list">
                  {team2XI.map((player, index) => (
                    <div key={player.player_id} className="xi-player">
                      <span className="xi-number">{index + 1}</span>
                      <span className="xi-name">{player.player_name}</span>
                      <div className="xi-roles">
                        <button 
                          className={`role-btn ${player.is_captain ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleRole(player.player_id, 'is_captain', 2); }}
                        >
                          C
                        </button>
                        <button 
                          className={`role-btn ${player.is_wicketkeeper ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleRole(player.player_id, 'is_wicketkeeper', 2); }}
                        >
                          WK
                        </button>
                      </div>
                      <button className="remove-btn" onClick={() => handlePlayerSelect({ id: player.player_id }, 2)}>×</button>
                    </div>
                  ))}
                  {team2XI.length < 11 && (
                    <div className="xi-placeholder">
                      {Array(11 - team2XI.length).fill(0).map((_, i) => (
                        <div key={i} className="xi-player placeholder">
                          <span className="xi-number">{team2XI.length + i + 1}</span>
                          <span className="xi-name">Select player...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation / Success */}
        {step === 5 && (
          <div className="step-panel success-panel">
            <div className="success-icon">🎉</div>
            <h2 className="step-title">Match Created Successfully!</h2>
            <p className="step-subtitle">The match is ready to begin</p>
            
            <div className="match-summary">
              <div className="summary-teams">
                <div className="summary-team" style={{ background: getTeamColor(getSelectedTeam(matchData.team1_id)?.team_name) }}>
                  <h3>{getSelectedTeam(matchData.team1_id)?.team_name}</h3>
                </div>
                <div className="vs-badge">VS</div>
                <div className="summary-team" style={{ background: getTeamColor(getSelectedTeam(matchData.team2_id)?.team_name) }}>
                  <h3>{getSelectedTeam(matchData.team2_id)?.team_name}</h3>
                </div>
              </div>
              
              <div className="summary-details">
                <p><strong>Overs:</strong> {matchData.total_overs}</p>
                <p><strong>Toss:</strong> {getSelectedTeam(matchData.toss_winner_id)?.team_name} won and elected to {matchData.toss_choice} first</p>
                <p><strong>Venue:</strong> {matchData.venue}</p>
              </div>
            </div>

            <div className="action-buttons">
              <button className="primary-btn" onClick={() => navigate(`/scoring/${matchId}`)}>
                🏏 Start Scoring
              </button>
              <button className="secondary-btn" onClick={() => navigate('/live-scoreboard')}>
                📺 View Scoreboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="step-navigation">
            {step > 1 && (
              <button className="nav-btn back" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}
            <button 
              className="nav-btn next" 
              disabled={!canProceedToNext()}
              onClick={() => step === 4 ? createMatch() : setStep(step + 1)}
            >
              {step === 4 ? (loading ? 'Creating...' : 'Create Match') : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSetup;
