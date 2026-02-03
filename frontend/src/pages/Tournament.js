import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './Tournament.css';

const Tournament = () => {
    const [tournamentData, setTournamentData] = useState(null);
    const [playoffBracket, setPlayoffBracket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTournamentData();
        const interval = setInterval(fetchTournamentData, 15000); // Refresh every 15 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchTournamentData = async () => {
        try {
            const [statusResponse, bracketResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/backend/api/tournament/playoffs.php?path=status`),
                fetch(`${API_BASE_URL}/backend/api/tournament/points.php?path=playoff-bracket`)
            ]);

            const statusText = await statusResponse.text();
            const bracketText = await bracketResponse.text();

            let statusData, bracketData;
            try {
                statusData = JSON.parse(statusText);
            } catch (e) {
                console.error('Playoffs status response (non-JSON):', statusText);
                throw e;
            }
            try {
                bracketData = JSON.parse(bracketText);
            } catch (e) {
                console.error('Playoff bracket response (non-JSON):', bracketText);
                throw e;
            }

            if (statusData.success && bracketData.success) {
                setTournamentData(statusData.data);
                setPlayoffBracket(bracketData.data);
                setError(null);
            } else {
                setError('Failed to fetch tournament data');
            }
        } catch (err) {
            console.error('Error fetching tournament data:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const initializePlayoffs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/backend/api/tournament/points.php?path=initialize-playoffs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournament_id: 1 })
            });

            const data = await response.json();
            if (data.success) {
                alert('Playoffs initialized successfully!');
                fetchTournamentData();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            alert('Failed to initialize playoffs');
        }
    };

    const getTeamInitials = (teamName) => {
        if (!teamName) return '?';
        return teamName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);
    };

    const getMatchStatus = (matchId) => {
        if (!matchId) return 'upcoming';
        // You can enhance this with actual match status from database
        return 'completed';
    };

    const renderTeamCard = (teamName, stats, isWinner, position) => {
        if (!teamName) {
            return (
                <div className="team-card">
                    <div className="team-position">{position}</div>
                    <div className="team-logo-bracket">?</div>
                    <div className="team-info">
                        <div className="team-name-bracket">TBD</div>
                        <div className="team-stats-bracket">To be determined</div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`team-card ${isWinner ? 'winner' : 'loser'}`}>
                <div className="team-position">{position}</div>
                <div className="team-logo-bracket">
                    {getTeamInitials(teamName)}
                </div>
                <div className="team-info">
                    <div className="team-name-bracket">{teamName}</div>
                    {stats && <div className="team-stats-bracket">{stats}</div>}
                </div>
                {isWinner && (
                    <div className="winner-badge">
                        <span>✓</span> Winner
                    </div>
                )}
            </div>
        );
    };

    const renderMatchCard = (title, team1, team2, winner, matchId, stage) => {
        const status = getMatchStatus(matchId);
        
        return (
            <div className={`match-card ${status}`}>
                <div className="match-header">
                    <div className="match-number">{title}</div>
                    <div className={`match-status ${status}`}>
                        {status === 'completed' ? 'Completed' : 
                         status === 'live' ? '● LIVE' : 'Upcoming'}
                    </div>
                </div>
                {renderTeamCard(team1?.name, team1?.stats, winner === team1?.name, team1?.position)}
                {renderTeamCard(team2?.name, team2?.stats, winner === team2?.name, team2?.position)}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="tournament-container">
                <div className="empty-playoff">
                    <div className="empty-playoff-icon">⏳</div>
                    <h3>Loading Tournament Data...</h3>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tournament-container">
                <div className="empty-playoff">
                    <div className="empty-playoff-icon">⚠️</div>
                    <h3>Error Loading Tournament</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const qualified = playoffBracket?.qualified_teams || [];
    const bracket = playoffBracket?.bracket;
    const hasPlayoffsStarted = bracket && (bracket.qualifier_1_team1_id !== null);

    // If no playoffs yet
    if (!hasPlayoffsStarted) {
        return (
            <div className="tournament-container">
                <div className="tournament-header">
                    <h1 className="tournament-title">SPL Championship Tournament</h1>
                    <p className="tournament-subtitle">Season 2026</p>
                    <div className="stage-indicator">League Stage</div>
                </div>

                <div className="empty-playoff">
                    <div className="empty-playoff-icon">🏏</div>
                    <h3>Playoffs Not Started Yet</h3>
                    <p>Complete all league matches to qualify teams for playoffs</p>
                    
                    {qualified.length > 0 && (
                        <div className="qualification-info">
                            <h3>Current Standings (Top 4 Qualify)</h3>
                            <ul className="qualification-list">
                                {qualified.map((team, idx) => (
                                    <li key={team.team_id}>
                                        <strong>{team.position}. {team.team_name}</strong>
                                        {' - '}
                                        {team.points} points, NRR: {team.nrr}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {qualified.length >= 4 && (
                        <div className="action-buttons">
                            <button className="action-btn primary" onClick={initializePlayoffs}>
                                🚀 Initialize Playoffs
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show tournament bracket
    const currentStage = tournamentData?.current_stage || 'group_stage';
    const isCompleted = tournamentData?.status === 'completed';

    return (
        <div className="tournament-container">
            <div className="tournament-header">
                <h1 className="tournament-title">SPL Championship Tournament</h1>
                <p className="tournament-subtitle">Season 2026 - Playoff Stage</p>
                <div className="stage-indicator">
                    {isCompleted ? '🏆 Tournament Completed' : 
                     currentStage === 'qualifier_1' ? 'Qualifier 1' :
                     currentStage === 'eliminator' ? 'Eliminator' :
                     currentStage === 'qualifier_2' ? 'Qualifier 2' :
                     currentStage === 'final' ? 'FINAL' : 'Playoffs'}
                </div>
            </div>

            {/* Tournament Complete - Show Champion */}
            {isCompleted && bracket?.champion_team_id && (
                <div className="final-stage">
                    <div className="champion-card">
                        <div className="champion-trophy">🏆</div>
                        <div className="champion-title">Champion</div>
                        <div className="champion-name">{bracket.champion_name}</div>
                        <div className="runner-up">Runner Up: {bracket.runner_up_name}</div>
                    </div>
                </div>
            )}

            {/* Playoff Bracket */}
            {!isCompleted && (
                <div className="bracket-container">
                    {/* First Row: Qualifier 1 and Eliminator */}
                    <div className="bracket-row">
                        <div className="bracket-stage">
                            <div className="stage-title">Qualifier 1</div>
                            {renderMatchCard(
                                'Q1: 1st vs 2nd',
                                {
                                    name: bracket?.q1_team1_name,
                                    position: '1st Place',
                                    stats: qualified[0] ? `${qualified[0].points} pts, NRR ${qualified[0].nrr}` : ''
                                },
                                {
                                    name: bracket?.q1_team2_name,
                                    position: '2nd Place',
                                    stats: qualified[1] ? `${qualified[1].points} pts, NRR ${qualified[1].nrr}` : ''
                                },
                                bracket?.q1_winner_name,
                                bracket?.qualifier_1_match_id,
                                'qualifier_1'
                            )}
                            <div style={{ textAlign: 'center', color: 'white', marginTop: '10px', fontSize: '14px' }}>
                                Winner → Final
                            </div>
                        </div>

                        <div className="bracket-connector">VS</div>

                        <div className="bracket-stage">
                            <div className="stage-title">Eliminator</div>
                            {renderMatchCard(
                                'Eliminator: 3rd vs 4th',
                                {
                                    name: bracket?.e_team1_name,
                                    position: '3rd Place',
                                    stats: qualified[2] ? `${qualified[2].points} pts, NRR ${qualified[2].nrr}` : ''
                                },
                                {
                                    name: bracket?.e_team2_name,
                                    position: '4th Place',
                                    stats: qualified[3] ? `${qualified[3].points} pts, NRR ${qualified[3].nrr}` : ''
                                },
                                bracket?.e_winner_name,
                                bracket?.eliminator_match_id,
                                'eliminator'
                            )}
                            <div style={{ textAlign: 'center', color: 'white', marginTop: '10px', fontSize: '14px' }}>
                                Winner → Qualifier 2
                            </div>
                        </div>
                    </div>

                    {/* Second Row: Qualifier 2 */}
                    {(bracket?.qualifier_2_team1_id || bracket?.qualifier_2_team2_id) && (
                        <div className="bracket-row">
                            <div className="bracket-stage" style={{ maxWidth: '500px', margin: '0 auto' }}>
                                <div className="stage-title">Qualifier 2</div>
                                {renderMatchCard(
                                    'Q2: Q1 Loser vs Eliminator Winner',
                                    {
                                        name: bracket?.q2_team1_name,
                                        position: 'Q1 Loser'
                                    },
                                    {
                                        name: bracket?.q2_team2_name,
                                        position: 'Elim. Winner'
                                    },
                                    bracket?.q2_winner_name,
                                    bracket?.qualifier_2_match_id,
                                    'qualifier_2'
                                )}
                                <div style={{ textAlign: 'center', color: 'white', marginTop: '10px', fontSize: '14px' }}>
                                    Winner → Final
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Final */}
                    {(bracket?.final_team1_id || bracket?.final_team2_id) && (
                        <div className="bracket-row">
                            <div className="bracket-stage" style={{ maxWidth: '600px', margin: '0 auto' }}>
                                <div className="stage-title">🏆 FINAL 🏆</div>
                                <div className="final-match-card">
                                    {renderMatchCard(
                                        'FINAL',
                                        {
                                            name: bracket?.f_team1_name,
                                            position: 'Q1 Winner'
                                        },
                                        {
                                            name: bracket?.f_team2_name,
                                            position: 'Q2 Winner'
                                        },
                                        bracket?.final_winner_id ? 
                                            (bracket?.champion_team_id === bracket?.final_team1_id ? 
                                                bracket?.f_team1_name : bracket?.f_team2_name) : null,
                                        bracket?.final_match_id,
                                        'final'
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button className="action-btn secondary" onClick={fetchTournamentData}>
                    🔄 Refresh
                </button>
            </div>
        </div>
    );
};

export default Tournament;
