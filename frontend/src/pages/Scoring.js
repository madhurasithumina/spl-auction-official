import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import MatchCompletionModal from '../components/MatchCompletionModal';
import './Scoring.css';

const API_BASE = `${API_BASE_URL}/backend/api`;

const Scoring = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentInnings, setCurrentInnings] = useState(null);
  const [matchState, setMatchState] = useState(null);
  
  // Scoring State
  const [selectedRuns, setSelectedRuns] = useState(null);
  const [isWide, setIsWide] = useState(false);
  const [isNoball, setIsNoball] = useState(false);
  const [isBye, setIsBye] = useState(false);
  const [isLegbye, setIsLegbye] = useState(false);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [outBatsman, setOutBatsman] = useState('striker');
  const [fielderId, setFielderId] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);
  
  // Modal States
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [showNewBowlerModal, setShowNewBowlerModal] = useState(false);
  const [showStartInningsModal, setShowStartInningsModal] = useState(false);
  const [showMatchCompletionModal, setShowMatchCompletionModal] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [otherIncompleteMatches, setOtherIncompleteMatches] = useState([]);
  
  // Selected players for starting innings
  const [selectedStriker, setSelectedStriker] = useState('');
  const [selectedNonStriker, setSelectedNonStriker] = useState('');
  const [selectedBowler, setSelectedBowler] = useState('');

  const fetchMatchData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/matches/live.php?match_id=${matchId}`);
      console.log('Match data:', response.data);
      setMatch(response.data);
      setMatchState(response.data.state);
      
      // Determine current innings
      const currentInn = response.data.innings?.find(i => i.status === 'in_progress');
      setCurrentInnings(currentInn || null);
      
      // Check if we need to start innings (no striker selected or no batsmen at crease)
      if (response.data.status === 'live' && currentInn && !response.data.state?.striker_id) {
        setShowStartInningsModal(true);
        setShowNewBowlerModal(false); // Close new bowler modal if start innings is needed
      } else if (response.data.state?.need_new_bowler && response.data.state?.striker_id) {
        // Only show new bowler modal if innings has already started (striker exists)
        setShowNewBowlerModal(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching match:', error);
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatchData();
    const interval = setInterval(fetchMatchData, 5000);
    return () => clearInterval(interval);
  }, [fetchMatchData]);

  useEffect(() => {
    const fetchIncompleteMatches = async () => {
      try {
        const response = await axios.get(`${API_BASE}/matches/index.php`);
        const incomplete = response.data.filter(m => 
          (m.status === 'live' || m.status === 'innings_break') && m.id !== parseInt(matchId)
        );
        setOtherIncompleteMatches(incomplete);
      } catch (error) {
        console.error('Error fetching incomplete matches:', error);
      }
    };
    
    fetchIncompleteMatches();
    const interval = setInterval(fetchIncompleteMatches, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  const startMatch = async () => {
    try {
      await axios.put(`${API_BASE}/matches/index.php`, {
        match_id: matchId,
        action: 'start_match'
      });
      fetchMatchData();
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  const initializeInnings = async () => {
    if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
      alert('Please select all players');
      return;
    }
    
    try {
      await axios.post(`${API_BASE}/innings/index.php`, {
        innings_id: currentInnings.id,
        match_id: matchId,
        striker_id: selectedStriker,
        non_striker_id: selectedNonStriker,
        bowler_id: selectedBowler
      });
      setShowStartInningsModal(false);
      fetchMatchData();
    } catch (error) {
      console.error('Error initializing innings:', error);
    }
  };

  const recordBall = async () => {
    if (selectedRuns === null && !isWide && !isNoball && !isWicket) {
      alert('Please select runs or an event');
      return;
    }

    try {
      const ballData = {
        innings_id: currentInnings.id,
        match_id: matchId,
        batsman_id: matchState.striker_id,
        non_striker_id: matchState.non_striker_id,
        bowler_id: matchState.current_bowler_id,
        runs_scored: selectedRuns || 0,
        is_wide: isWide,
        is_noball: isNoball,
        is_bye: isBye,
        is_legbye: isLegbye,
        is_wicket: isWicket,
        wicket_type: wicketType || null,
        wicket_player_id: isWicket ? (outBatsman === 'striker' ? matchState.striker_id : matchState.non_striker_id) : null,
        fielder_id: fielderId || null,
        is_penalty: isPenalty,
        penalty_runs: isPenalty ? 5 : 0
      };

      const response = await axios.post(`${API_BASE}/innings/score.php`, ballData);
      
      // Check if match completed
      if (response.data.match_completed) {
        // Get winner team name
        let winnerName = '';
        if (response.data.winner_id) {
          if (response.data.winner_id === match.team1_id) {
            winnerName = match.team1_name;
          } else {
            winnerName = match.team2_name;
          }
        } else {
          winnerName = 'Match Tied';
        }
        
        setMatchResult({
          winner: winnerName,
          margin: response.data.win_margin
        });
        setShowMatchCompletionModal(true);
        return;
      }
      
      // Check if innings ended (but match not completed)
      if (response.data.innings_ended) {
        alert(`Innings ended: ${response.data.innings_end_reason}`);
        fetchMatchData();
        return;
      }
      
      // Reset scoring state
      resetScoringState();
      
      // Check if we need a new batsman
      if (response.data.need_new_batsman) {
        setShowNewBatsmanModal(true);
      }
      
      // Check if we need a new bowler
      if (response.data.need_new_bowler) {
        setShowNewBowlerModal(true);
      }
      
      fetchMatchData();
    } catch (error) {
      console.error('Error recording ball:', error);
      alert('Error recording ball');
    }
  };

  const resetScoringState = () => {
    setSelectedRuns(null);
    setIsWide(false);
    setIsNoball(false);
    setIsBye(false);
    setIsLegbye(false);
    setIsWicket(false);
    setWicketType('');
    setOutBatsman('striker');
    setFielderId('');
    setIsPenalty(false);
    setShowWicketModal(false);
  };

  const selectNewBatsman = async (playerId) => {
    try {
      await axios.post(`${API_BASE}/matches/live.php`, {
        action: 'set_batsman',
        match_id: matchId,
        innings_id: currentInnings.id,
        player_id: playerId,
        is_striker: true
      });
      setShowNewBatsmanModal(false);
      fetchMatchData();
    } catch (error) {
      console.error('Error setting batsman:', error);
    }
  };

  const selectNewBowler = async (playerId) => {
    try {
      await axios.post(`${API_BASE}/matches/live.php`, {
        action: 'set_bowler',
        match_id: matchId,
        innings_id: currentInnings.id,
        player_id: playerId
      });
      setShowNewBowlerModal(false);
      fetchMatchData();
    } catch (error) {
      console.error('Error setting bowler:', error);
    }
  };

  const undoLastBall = async () => {
    if (window.confirm('Are you sure you want to undo the last ball?')) {
      try {
        await axios.post(`${API_BASE}/matches/live.php`, {
          action: 'undo_ball',
          match_id: matchId,
          innings_id: currentInnings.id
        });
        fetchMatchData();
      } catch (error) {
        console.error('Error undoing ball:', error);
      }
    }
  };

  const endInnings = async () => {
    if (window.confirm('Are you sure you want to end this innings?')) {
      try {
        await axios.put(`${API_BASE}/matches/index.php`, {
          match_id: matchId,
          action: 'innings_break'
        });
        fetchMatchData();
      } catch (error) {
        console.error('Error ending innings:', error);
      }
    }
  };

  const startSecondInnings = async () => {
    try {
      await axios.put(`${API_BASE}/matches/index.php`, {
        match_id: matchId,
        action: 'start_second_innings'
      });
      fetchMatchData();
    } catch (error) {
      console.error('Error starting second innings:', error);
    }
  };

  const endMatch = async (winnerId, margin) => {
    if (!window.confirm('Are you sure you want to end this match?')) return;
    try {
      await axios.put(`${API_BASE}/matches/index.php`, {
        match_id: matchId,
        action: 'end_match',
        winner_id: winnerId,
        win_margin: margin
      });
      navigate('/live-scoreboard');
    } catch (error) {
      console.error('Error ending match:', error);
    }
  };

  // Function to manually end match as a draw or abandon
  const handleEndMatchManually = () => {
    endMatch(null, 'Match ended manually');
  };

  const getTeamColor = (teamName) => {
    const colors = {
      'Software': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Marketing': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'Technical': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'Accounts': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };
    return colors[teamName] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const getOversDisplay = (balls) => {
    const overs = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    return `${overs}.${ballsInOver}`;
  };

  const getBallDisplay = (ball) => {
    if (ball.is_wicket) return 'W';
    if (ball.is_wide) return `${ball.total_runs}Wd`;
    if (ball.is_noball) return `${ball.runs_scored}Nb`;
    if (ball.is_bye) return `${ball.runs_scored}B`;
    if (ball.is_legbye) return `${ball.runs_scored}Lb`;
    if (ball.is_boundary_six) return '6';
    if (ball.is_boundary_four) return '4';
    return ball.runs_scored.toString();
  };

  const getBallClass = (ball) => {
    if (ball.is_wicket) return 'ball wicket';
    if (ball.is_wide || ball.is_noball) return 'ball extra';
    if (ball.is_boundary_six) return 'ball six';
    if (ball.is_boundary_four) return 'ball four';
    if (ball.runs_scored === 0) return 'ball dot';
    return 'ball runs';
  };

  if (loading) {
    return (
      <div className="scoring-container">
        <div className="loading-screen">
          <div className="cricket-ball-loader"></div>
          <p>Loading match data...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="scoring-container">
        <div className="error-screen">
          <h2>Match not found</h2>
          <button onClick={() => navigate('/match-setup')}>Create New Match</button>
        </div>
      </div>
    );
  }

  const battingTeam = currentInnings ? 
    (currentInnings.batting_team_id === match.team1_id ? match.team1_name : match.team2_name) : '';
  const bowlingTeam = currentInnings ? 
    (currentInnings.bowling_team_id === match.team1_id ? match.team1_name : match.team2_name) : '';

  // Get batsmen and bowlers for current innings
  const batsmenAtCrease = currentInnings?.batsmen_at_crease || [];
  const striker = batsmenAtCrease.find(b => b.is_on_strike);
  const nonStriker = batsmenAtCrease.find(b => !b.is_on_strike);
  const currentBowler = currentInnings?.current_bowler;

  // Get available batsmen (yet to bat)
  const availableBatsmen = currentInnings?.batsmen?.filter(b => b.status === 'yet_to_bat') || [];

  // Get available bowlers (from bowling team's playing XI)
  const bowlingTeamId = currentInnings?.bowling_team_id;
  const bowlingTeamXI = bowlingTeamId === match.team1_id ? 
    Object.values(match.team1_xi || {}) : Object.values(match.team2_xi || {});

  return (
    <div className="scoring-container">
      {/* Header */}
      <header className="scoring-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL SCORER</h1>
          </div>
          <div className="match-info-header">
            <span className="match-title">{match.team1_name} vs {match.team2_name}</span>
            <span className="match-meta">{match.total_overs} Overs • {match.venue}</span>
          </div>
          <div className="header-actions">
            {otherIncompleteMatches.length > 0 && (
              <button className="incomplete-match-btn" onClick={() => navigate(`/scoring/${otherIncompleteMatches[0].id}`)}>
                <span className="live-indicator"></span>
                {otherIncompleteMatches[0].status === 'innings_break' ? '▶️ Start 2nd Innings' : '🏏 Continue Match'}
                <span className="match-teams-mini">{otherIncompleteMatches[0].team1_name} vs {otherIncompleteMatches[0].team2_name}</span>
              </button>
            )}
            <button className="action-btn" onClick={() => navigate(`/live-scoreboard?match=${matchId}`)}>
              📺 Live View
            </button>
          </div>
        </div>
      </header>

      {/* Match Status Bar */}
      {match.status === 'setup' && (
        <div className="status-bar setup">
          <p>Match is ready to start</p>
          <button className="start-match-btn" onClick={startMatch}>🏏 Start Match</button>
        </div>
      )}

      {match.status === 'innings_break' && (
        <div className="status-bar break">
          <p>Innings Break - Target: {match.innings?.[1]?.target} runs</p>
          <button className="start-match-btn" onClick={startSecondInnings}>Start 2nd Innings</button>
        </div>
      )}

      {/* Main Scoring Area */}
      {match.status === 'live' && currentInnings && (
        <div className="scoring-main">
          {/* Score Display */}
          <div className="score-display" style={{ background: getTeamColor(battingTeam) }}>
            <div className="batting-team-info">
              <h2>{battingTeam}</h2>
              <div className="score-big">
                {currentInnings.total_runs}/{currentInnings.total_wickets}
              </div>
              <div className="overs-display">
                Overs: {getOversDisplay(currentInnings.total_balls)} / {match.total_overs}
              </div>
              {currentInnings.innings_number === 2 && currentInnings.target && (
                <div className="target-info">
                  <span>Need {currentInnings.runs_needed} from {currentInnings.balls_remaining} balls</span>
                  <span>RRR: {currentInnings.required_run_rate}</span>
                </div>
              )}
            </div>
            <div className="run-rate-info">
              <div className="rr-item">
                <span className="rr-label">CRR</span>
                <span className="rr-value">{currentInnings.run_rate || '0.00'}</span>
              </div>
              {currentInnings.innings_number === 2 && (
                <div className="rr-item">
                  <span className="rr-label">RRR</span>
                  <span className="rr-value">{currentInnings.required_run_rate || '-'}</span>
                </div>
              )}
            </div>
          </div>

          {/* This Over Display */}
          <div className="this-over">
            <h4>This Over</h4>
            <div className="over-balls">
              {match.recent_balls?.filter(b => b.over_number === matchState?.current_over).map((ball, idx) => (
                <span key={idx} className={getBallClass(ball)}>
                  {getBallDisplay(ball)}
                </span>
              ))}
            </div>
          </div>

          {/* Batsmen Panel */}
          <div className="players-panel">
            <div className="batsmen-section">
              <h3>🏏 Batsmen</h3>
              <div className="batsmen-cards">
                {striker && (
                  <div className="batsman-card striker">
                    <div className="strike-indicator">*</div>
                    <div className="batsman-name">{striker.player_name}</div>
                    <div className="batsman-stats">
                      <span className="runs">{striker.runs_scored}</span>
                      <span className="balls">({striker.balls_faced})</span>
                      <span className="sr">SR: {striker.strike_rate || '0.00'}</span>
                    </div>
                    <div className="batsman-details">
                      <span>4s: {striker.fours}</span>
                      <span>6s: {striker.sixes}</span>
                    </div>
                  </div>
                )}
                {nonStriker && (
                  <div className="batsman-card">
                    <div className="batsman-name">{nonStriker.player_name}</div>
                    <div className="batsman-stats">
                      <span className="runs">{nonStriker.runs_scored}</span>
                      <span className="balls">({nonStriker.balls_faced})</span>
                      <span className="sr">SR: {nonStriker.strike_rate || '0.00'}</span>
                    </div>
                    <div className="batsman-details">
                      <span>4s: {nonStriker.fours}</span>
                      <span>6s: {nonStriker.sixes}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bowler-section">
              <h3>⚾ Bowler</h3>
              {currentBowler && (
                <div className="bowler-card">
                  <div className="bowler-name">{currentBowler.player_name}</div>
                  <div className="bowler-stats">
                    <span>{currentBowler.overs_bowled || '0'}-{currentBowler.maidens || '0'}-{currentBowler.runs_conceded || '0'}-{currentBowler.wickets || '0'}</span>
                    <span className="econ">Econ: {currentBowler.economy || '0.00'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scoring Buttons */}
          <div className="scoring-buttons">
            <h3>Score Ball</h3>
            
            {/* Run Buttons */}
            <div className="runs-grid">
              {[0, 1, 2, 3, 4, 5, 6].map(run => (
                <button
                  key={run}
                  className={`run-btn ${selectedRuns === run ? 'selected' : ''} ${run === 4 ? 'four' : ''} ${run === 6 ? 'six' : ''}`}
                  onClick={() => setSelectedRuns(run)}
                >
                  {run}
                </button>
              ))}
            </div>

            {/* Extras */}
            <div className="extras-row">
              <button 
                className={`extra-btn ${isWide ? 'active' : ''}`}
                onClick={() => { setIsWide(!isWide); setIsNoball(false); }}
              >
                Wide
              </button>
              <button 
                className={`extra-btn ${isNoball ? 'active' : ''}`}
                onClick={() => { setIsNoball(!isNoball); setIsWide(false); }}
              >
                No Ball
              </button>
              <button 
                className={`extra-btn ${isBye ? 'active' : ''}`}
                onClick={() => { setIsBye(!isBye); setIsLegbye(false); }}
              >
                Bye
              </button>
              <button 
                className={`extra-btn ${isLegbye ? 'active' : ''}`}
                onClick={() => { setIsLegbye(!isLegbye); setIsBye(false); }}
              >
                Leg Bye
              </button>
              <button 
                className={`extra-btn penalty ${isPenalty ? 'active' : ''}`}
                onClick={() => setIsPenalty(!isPenalty)}
              >
                Penalty (5)
              </button>
            </div>

            {/* Wicket Button */}
            <div className="wicket-row">
              <button 
                className={`wicket-btn ${isWicket ? 'active' : ''}`}
                onClick={() => setShowWicketModal(true)}
              >
                🎯 WICKET
              </button>
            </div>

            {/* Action Buttons */}
            <div className="action-row">
              <button className="confirm-btn" onClick={recordBall} disabled={!matchState?.striker_id}>
                ✓ Confirm Ball
              </button>
              <button className="undo-btn" onClick={undoLastBall}>
                ↩ Undo
              </button>
              <button className="end-innings-btn" onClick={endInnings}>
                End Innings
              </button>
              <button className="end-match-btn" onClick={handleEndMatchManually} style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
                End Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="modal-overlay">
          <div className="modal wicket-modal">
            <h2>🎯 Wicket Details</h2>
            
            <div className="modal-section">
              <label>Dismissal Type</label>
              <div className="dismissal-grid">
                {['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'].map(type => (
                  <button
                    key={type}
                    className={`dismissal-btn ${wicketType === type ? 'selected' : ''}`}
                    onClick={() => setWicketType(type)}
                  >
                    {type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {(wicketType === 'run_out') && (
              <div className="modal-section">
                <label>Who is out?</label>
                <div className="out-batsman-select">
                  <button 
                    className={`out-btn ${outBatsman === 'striker' ? 'selected' : ''}`}
                    onClick={() => setOutBatsman('striker')}
                  >
                    Striker ({striker?.player_name})
                  </button>
                  <button 
                    className={`out-btn ${outBatsman === 'non_striker' ? 'selected' : ''}`}
                    onClick={() => setOutBatsman('non_striker')}
                  >
                    Non-Striker ({nonStriker?.player_name})
                  </button>
                </div>
              </div>
            )}

            {(wicketType === 'caught' || wicketType === 'run_out' || wicketType === 'stumped') && (
              <div className="modal-section">
                <label>Fielder</label>
                <select 
                  value={fielderId} 
                  onChange={(e) => setFielderId(e.target.value)}
                  className="fielder-select"
                >
                  <option value="">Select Fielder</option>
                  {bowlingTeamXI.map(player => (
                    <option key={player.player_id} value={player.player_id}>
                      {player.player_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowWicketModal(false); setIsWicket(false); setWicketType(''); }}>
                Cancel
              </button>
              <button 
                className="confirm-wicket-btn" 
                onClick={() => { setIsWicket(true); setShowWicketModal(false); }}
                disabled={!wicketType}
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Batsman Modal */}
      {showNewBatsmanModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>👤 Select New Batsman</h2>
            <div className="player-select-grid">
              {availableBatsmen.map(player => (
                <button
                  key={player.player_id}
                  className="player-select-btn"
                  onClick={() => selectNewBatsman(player.player_id)}
                >
                  {player.player_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Bowler Modal */}
      {showNewBowlerModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>⚾ Select Next Bowler</h2>
            <p className="modal-note">Previous bowler cannot bowl consecutive overs</p>
            <div className="player-select-grid">
              {bowlingTeamXI.filter(p => p.player_id !== matchState?.last_bowler_id).map(player => (
                <button
                  key={player.player_id}
                  className="player-select-btn"
                  onClick={() => selectNewBowler(player.player_id)}
                >
                  {player.player_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Start Innings Modal */}
      {showStartInningsModal && (
        <div className="modal-overlay">
          <div className="modal start-innings-modal">
            <h2>🏏 Start {currentInnings?.innings_number === 1 ? '1st' : '2nd'} Innings</h2>
            <p>Select opening batsmen and first bowler</p>
            
            <div className="innings-setup-grid">
              <div className="setup-section">
                <h3>Opening Batsmen ({battingTeam})</h3>
                <div className="setup-field">
                  <label>Striker</label>
                  <select value={selectedStriker} onChange={(e) => setSelectedStriker(e.target.value)}>
                    <option value="">Select Striker</option>
                    {/* Use batsmen from innings if available, otherwise use batting team's playing XI */}
                    {(currentInnings?.batsmen?.length > 0 
                      ? currentInnings.batsmen.filter(b => b.player_id !== parseInt(selectedNonStriker))
                      : Object.values(currentInnings?.batting_team_id === match?.team1_id ? (match?.team1_xi || {}) : (match?.team2_xi || {}))
                          .filter(p => p.player_id !== parseInt(selectedNonStriker))
                    ).map(player => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.player_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="setup-field">
                  <label>Non-Striker</label>
                  <select value={selectedNonStriker} onChange={(e) => setSelectedNonStriker(e.target.value)}>
                    <option value="">Select Non-Striker</option>
                    {(currentInnings?.batsmen?.length > 0 
                      ? currentInnings.batsmen.filter(b => b.player_id !== parseInt(selectedStriker))
                      : Object.values(currentInnings?.batting_team_id === match?.team1_id ? (match?.team1_xi || {}) : (match?.team2_xi || {}))
                          .filter(p => p.player_id !== parseInt(selectedStriker))
                    ).map(player => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.player_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="setup-section">
                <h3>Opening Bowler ({bowlingTeam})</h3>
                <div className="setup-field">
                  <label>Bowler</label>
                  <select value={selectedBowler} onChange={(e) => setSelectedBowler(e.target.value)}>
                    <option value="">Select Bowler</option>
                    {bowlingTeamXI.map(player => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.player_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={initializeInnings}
                disabled={!selectedStriker || !selectedNonStriker || !selectedBowler}
              >
                Start Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Completion Modal */}
      {showMatchCompletionModal && matchResult && (
        <MatchCompletionModal
          winner={matchResult.winner}
          margin={matchResult.margin}
          onClose={() => {
            setShowMatchCompletionModal(false);
            navigate('/live-scoreboard');
          }}
        />
      )}
    </div>
  );
};

export default Scoring;
