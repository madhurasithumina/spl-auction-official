import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './LiveScoreboard.css';

const API_BASE = `${API_BASE_URL}/backend/api`;

const LiveScoreboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matchIdParam = searchParams.get('match');
  
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('scorecard'); // scorecard, batsmen, bowlers
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');
  
  // Only show admin features if explicitly logged in as admin
  const isAdmin = isAuthenticated && userRole === 'admin';
  const staffMode = searchParams.get('mode') === 'staff';
  const showAdmin = isAdmin && !staffMode;

  const fetchMatchDetails = useCallback(async (matchId) => {
    try {
      const response = await axios.get(`${API_BASE}/matches/live.php?match_id=${matchId}`);
      setSelectedMatch(response.data);
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/matches/index.php`);
      setMatches(response.data);
      
      // Auto-select live match or match from URL
      if (matchIdParam) {
        fetchMatchDetails(matchIdParam);
      } else {
        const liveMatch = response.data.find(m => m.status === 'live');
        if (liveMatch) {
          fetchMatchDetails(liveMatch.id);
        } else if (response.data.length > 0) {
          fetchMatchDetails(response.data[0].id);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
    }
  }, [matchIdParam, fetchMatchDetails]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    let interval;
    if (autoRefresh && selectedMatch) {
      interval = setInterval(() => {
        fetchMatchDetails(selectedMatch.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedMatch, fetchMatchDetails]);

  const getTeamColor = (teamName) => {
    const colors = {
      'Software': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', primary: '#667eea' },
      'Marketing': { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', primary: '#f093fb' },
      'Technical': { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', primary: '#4facfe' },
      'Accounts': { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', primary: '#43e97b' }
    };
    return colors[teamName] || { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', primary: '#667eea' };
  };

  const getOversDisplay = (balls) => {
    if (!balls) return '0.0';
    const overs = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    return `${overs}.${ballsInOver}`;
  };

  const getDismissalText = (batsman) => {
    if (!batsman || batsman.status === 'yet_to_bat') return 'Yet to bat';
    if (batsman.status === 'batting' || batsman.dismissal_type === 'not_out') return 'not out';
    
    switch (batsman.dismissal_type) {
      case 'bowled': return `b ${batsman.dismissed_by_name}`;
      case 'caught': return `c ${batsman.fielder_name || ''} b ${batsman.dismissed_by_name}`;
      case 'lbw': return `lbw b ${batsman.dismissed_by_name}`;
      case 'run_out': return `run out (${batsman.fielder_name || ''})`;
      case 'stumped': return `st ${batsman.fielder_name} b ${batsman.dismissed_by_name}`;
      case 'hit_wicket': return `hit wicket b ${batsman.dismissed_by_name}`;
      default: return batsman.dismissal_type || '';
    }
  };

  const getBallClass = (ball) => {
    if (ball.is_wicket) return 'ball-indicator wicket';
    if (ball.is_wide || ball.is_noball) return 'ball-indicator extra';
    if (ball.is_boundary_six) return 'ball-indicator six';
    if (ball.is_boundary_four) return 'ball-indicator four';
    if (ball.runs_scored === 0 && !ball.is_bye && !ball.is_legbye) return 'ball-indicator dot';
    return 'ball-indicator runs';
  };

  const getBallText = (ball) => {
    if (ball.is_wicket) return 'W';
    if (ball.is_wide) return `${ball.total_runs}wd`;
    if (ball.is_noball) return `${ball.runs_scored}nb`;
    if (ball.is_bye) return `${ball.runs_scored}b`;
    if (ball.is_legbye) return `${ball.runs_scored}lb`;
    return ball.runs_scored;
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="live-scoreboard-container">
        <div className="loading-screen">
          <div className="cricket-ball-loader"></div>
          <p>Loading Live Scores...</p>
        </div>
      </div>
    );
  }

  const currentInnings = selectedMatch?.current_innings_data || 
                         selectedMatch?.innings?.find(i => i.status === 'in_progress') ||
                         selectedMatch?.innings?.[selectedMatch?.innings?.length - 1];

  const battingTeam = currentInnings?.batting_team_name;
  const bowlingTeam = currentInnings?.bowling_team_name;

  return (
    <div className="live-scoreboard-container">
      {/* Header */}
      <header className="scoreboard-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate(staffMode ? '/staff-dashboard' : (isAdmin ? '/home' : '/staff-dashboard'))}>
            <img src="/assets/spl logo.png" alt="SPL Logo" className="spl-logo" />
            <h1>SARASA PREMIER LEAGUE</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/staff-dashboard')}>
              {staffMode ? 'Dashboard' : (isAdmin ? 'Home' : 'Dashboard')}
            </button>
            <button className="nav-button" onClick={() => navigate(staffMode ? '/view-players?mode=staff' : '/view-players')}>View Players</button>
            {showAdmin && (
              <>
                <button className="nav-button" onClick={() => navigate('/auction')}>Auction</button>
              </>
            )}
            <button className="nav-button" onClick={() => navigate(staffMode ? '/teams?mode=staff' : '/teams')}>Teams</button>
            <button className="nav-button active">Live Scoreboard</button>
            <button className="nav-button" onClick={() => navigate(staffMode ? '/points-table?mode=staff' : '/points-table')}>Points Table</button>
            {showAdmin && (
              <>
                <button className="nav-button" onClick={() => navigate('/match-setup')}>Match Setup</button>
                <button className="nav-button" onClick={() => navigate('/reports')}>Reports</button>
                <button className="nav-button" onClick={() => navigate('/admin')}>Admin</button>
                <button className="nav-button register-btn" onClick={() => navigate('/register-player')}>
                  Register Player
                </button>
              </>
            )}
            {isAuthenticated && (
              <div className="user-info">
                <span className="username">{username}</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </nav>
          <div className="header-controls">
            <label className="auto-refresh-toggle">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)} 
              />
              <span>Auto Refresh</span>
            </label>
          </div>
        </div>
      </header>

      {/* Match Selector */}
      {matches.length > 1 && (
        <div className="match-selector">
          {matches.slice(0, 5).map((match, idx) => (
            <button
              key={`match-btn-${match.id}-${idx}`}
              className={`match-selector-btn ${selectedMatch?.id === match.id ? 'active' : ''} ${match.status}`}
              onClick={() => fetchMatchDetails(match.id)}
            >
              <span className="match-teams">{match.team1_name} vs {match.team2_name}</span>
              <span className={`match-status-badge ${match.status}`}>
                {match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedMatch ? (
        <div className="scoreboard-main">
          {/* Main Score Card */}
          <div className="main-scorecard">
            {/* Live Indicator */}
            {selectedMatch.status === 'live' && (
              <div className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </div>
            )}

            {/* Team Scores */}
            <div className="teams-score-display">
              {selectedMatch.innings?.map((innings, idx) => (
                <div 
                  key={`innings-${innings.id || idx}-${innings.innings_number}`} 
                  className={`team-score-card ${innings.status === 'in_progress' ? 'batting' : ''}`}
                  style={{ background: getTeamColor(innings.batting_team_name).bg }}
                >
                  <div className="team-badge">
                    <div className="team-icon">🏏</div>
                    <h2>{innings.batting_team_name}</h2>
                    {innings.innings_number === 1 && <span className="innings-badge">1st Innings</span>}
                    {innings.innings_number === 2 && <span className="innings-badge">2nd Innings</span>}
                  </div>
                  
                  <div className="team-score">
                    <span className="runs">{innings.total_runs || 0}</span>
                    <span className="wickets">/{innings.total_wickets || 0}</span>
                  </div>
                  
                  <div className="team-overs">
                    ({getOversDisplay(innings.total_balls)} ov)
                  </div>
                  
                  {innings.run_rate > 0 && (
                    <div className="run-rate-badge">
                      RR: {innings.run_rate}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Match Status */}
            <div className="match-status-display">
              {selectedMatch.status === 'live' && currentInnings?.innings_number === 2 && currentInnings.target && (
                <div className="chase-info">
                  <div className="chase-detail">
                    <span className="label">Target</span>
                    <span className="value">{currentInnings.target}</span>
                  </div>
                  <div className="chase-detail">
                    <span className="label">Need</span>
                    <span className="value">{currentInnings.runs_needed} runs</span>
                  </div>
                  <div className="chase-detail">
                    <span className="label">From</span>
                    <span className="value">{currentInnings.balls_remaining} balls</span>
                  </div>
                  <div className="chase-detail">
                    <span className="label">RRR</span>
                    <span className="value">{currentInnings.required_run_rate}</span>
                  </div>
                </div>
              )}
              
              {selectedMatch.status === 'completed' && selectedMatch.winner_name && (
                <div className="match-result">
                  🏆 {selectedMatch.winner_name} won by {selectedMatch.win_margin}
                </div>
              )}
              
              {selectedMatch.status === 'innings_break' && (
                <div className="innings-break-info">
                  Innings Break • Target: {selectedMatch.innings?.[1]?.target} runs
                </div>
              )}
            </div>
          </div>

          {/* Current Players (Live) */}
          {selectedMatch.status === 'live' && currentInnings && (
            <div className="current-players-section">
              {/* Batsmen at Crease */}
              <div className="at-crease-panel">
                <h3>🏏 At The Crease</h3>
                <div className="crease-batsmen">
                  {currentInnings.batsmen_at_crease?.map((batsman, idx) => (
                    <div key={`crease-${batsman.player_id}-${idx}`} className={`crease-batsman ${batsman.is_on_strike ? 'on-strike' : ''}`}>
                      <div className="batsman-row">
                        <span className="name">
                          {batsman.player_name}
                          {batsman.is_on_strike && <span className="strike-marker">*</span>}
                        </span>
                        <span className="score">{batsman.runs_scored} ({batsman.balls_faced})</span>
                      </div>
                      <div className="batsman-extras">
                        <span>4s: {batsman.fours}</span>
                        <span>6s: {batsman.sixes}</span>
                        <span>SR: {batsman.strike_rate || '0.00'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Bowler */}
              <div className="current-bowler-panel">
                <h3>⚾ Bowling</h3>
                {currentInnings.current_bowler && (
                  <div className="current-bowler">
                    <span className="name">{currentInnings.current_bowler.player_name}</span>
                    <span className="figures">
                      {currentInnings.current_bowler.overs_bowled || '0'}-
                      {currentInnings.current_bowler.maidens || '0'}-
                      {currentInnings.current_bowler.runs_conceded || '0'}-
                      {currentInnings.current_bowler.wickets || '0'}
                    </span>
                    <span className="economy">Econ: {currentInnings.current_bowler.economy || '0.00'}</span>
                  </div>
                )}
              </div>

              {/* Recent Balls */}
              <div className="recent-balls-panel">
                <h3>Recent</h3>
                <div className="balls-track">
                  {selectedMatch.recent_balls?.slice(-12).map((ball, idx) => (
                    <div key={`ball-${ball.id || idx}-${idx}`} className={getBallClass(ball)}>
                      {getBallText(ball)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* View Mode Tabs */}
          <div className="view-tabs">
            <button 
              className={`view-tab ${viewMode === 'scorecard' ? 'active' : ''}`}
              onClick={() => setViewMode('scorecard')}
            >
              Full Scorecard
            </button>
            <button 
              className={`view-tab ${viewMode === 'batsmen' ? 'active' : ''}`}
              onClick={() => setViewMode('batsmen')}
            >
              Batting
            </button>
            <button 
              className={`view-tab ${viewMode === 'bowlers' ? 'active' : ''}`}
              onClick={() => setViewMode('bowlers')}
            >
              Bowling
            </button>
          </div>

          {/* Detailed Scorecard */}
          {currentInnings && (
            <div className="detailed-scorecard">
              {/* Batting Card */}
              {(viewMode === 'scorecard' || viewMode === 'batsmen') && (
                <div className="batting-card">
                  <div className="card-header" style={{ background: getTeamColor(battingTeam).bg }}>
                    <h3>{battingTeam} - Batting</h3>
                  </div>
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th className="batsman-col">Batsman</th>
                        <th className="dismissal-col">Dismissal</th>
                        <th>R</th>
                        <th>B</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInnings.batsmen?.filter(b => b.status !== 'yet_to_bat').map((batsman, idx) => (
                        <tr key={`bat-${batsman.player_id}-${currentInnings.id}-${idx}`} className={batsman.status === 'batting' ? 'not-out' : ''}>
                          <td className="batsman-col">
                            <span className="batsman-name">
                              {batsman.player_name}
                              {batsman.status === 'batting' && <span className="batting-indicator">*</span>}
                            </span>
                          </td>
                          <td className="dismissal-col">{getDismissalText(batsman)}</td>
                          <td className="runs-cell">{batsman.runs_scored}</td>
                          <td>{batsman.balls_faced}</td>
                          <td>{batsman.fours}</td>
                          <td>{batsman.sixes}</td>
                          <td>{batsman.strike_rate || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Extras */}
                  <div className="extras-row-display">
                    <span className="extras-label">Extras</span>
                    <span className="extras-detail">
                      (wd {currentInnings.extras_wide || 0}, 
                       nb {currentInnings.extras_noball || 0}, 
                       b {currentInnings.extras_bye || 0}, 
                       lb {currentInnings.extras_legbye || 0})
                    </span>
                    <span className="extras-total">
                      {(currentInnings.extras_wide || 0) + (currentInnings.extras_noball || 0) + 
                       (currentInnings.extras_bye || 0) + (currentInnings.extras_legbye || 0)}
                    </span>
                  </div>
                  
                  {/* Total */}
                  <div className="total-row">
                    <span className="total-label">Total</span>
                    <span className="total-detail">
                      ({currentInnings.total_wickets} wkts, {getOversDisplay(currentInnings.total_balls)} Ov)
                    </span>
                    <span className="total-runs">{currentInnings.total_runs}</span>
                  </div>
                  
                  {/* Yet to Bat */}
                  {currentInnings.batsmen?.filter(b => b.status === 'yet_to_bat').length > 0 && (
                    <div className="yet-to-bat">
                      <span className="ytb-label">Yet to bat:</span>
                      <span className="ytb-names">
                        {currentInnings.batsmen?.filter(b => b.status === 'yet_to_bat').map(b => b.player_name).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Fall of Wickets */}
                  {currentInnings.fall_of_wickets?.length > 0 && (
                    <div className="fall-of-wickets">
                      <span className="fow-label">Fall of Wickets:</span>
                      <span className="fow-list">
                        {currentInnings.fall_of_wickets?.map((fow, idx) => (
                          <span key={`fow-${fow.wicket_number}-${idx}`} className="fow-item">
                            {fow.runs_at_fall}-{fow.wicket_number} ({fow.player_name}, {fow.overs_at_fall} ov)
                            {idx < currentInnings.fall_of_wickets.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bowling Card */}
              {(viewMode === 'scorecard' || viewMode === 'bowlers') && (
                <div className="bowling-card">
                  <div className="card-header" style={{ background: getTeamColor(bowlingTeam).bg }}>
                    <h3>{bowlingTeam} - Bowling</h3>
                  </div>
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th className="bowler-col">Bowler</th>
                        <th>O</th>
                        <th>M</th>
                        <th>R</th>
                        <th>W</th>
                        <th>Econ</th>
                        <th>Wd</th>
                        <th>Nb</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInnings.bowlers?.map((bowler, idx) => (
                        <tr key={`bowl-${bowler.player_id}-${currentInnings.id}-${idx}`} className={bowler.is_current_bowler ? 'current-bowler' : ''}>
                          <td className="bowler-col">
                            <span className="bowler-name">
                              {bowler.player_name}
                              {bowler.is_current_bowler && <span className="bowling-indicator">*</span>}
                            </span>
                          </td>
                          <td>{bowler.overs_bowled || '0'}</td>
                          <td>{bowler.maidens || 0}</td>
                          <td>{bowler.runs_conceded || 0}</td>
                          <td className="wickets-cell">{bowler.wickets || 0}</td>
                          <td>{bowler.economy || '0.00'}</td>
                          <td>{bowler.wides || 0}</td>
                          <td>{bowler.noballs || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Match Info Footer */}
          <div className="match-info-footer">
            <div className="info-item">
              <span className="label">Venue</span>
              <span className="value">{selectedMatch.venue}</span>
            </div>
            <div className="info-item">
              <span className="label">Toss</span>
              <span className="value">
                {selectedMatch.toss_winner_name} won the toss and elected to {selectedMatch.toss_choice} first
              </span>
            </div>
            <div className="info-item">
              <span className="label">Overs</span>
              <span className="value">{selectedMatch.total_overs} overs match</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-match-selected">
          <div className="empty-state">
            <span className="empty-icon">🏏</span>
            <h2>No Match Selected</h2>
            <p>Select a match from above or create a new match</p>
            <button className="create-match-btn" onClick={() => navigate('/match-setup')}>
              Create New Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScoreboard;
