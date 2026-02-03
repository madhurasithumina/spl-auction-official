import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import './PointsTable.css';

const PointsTable = () => {
    const navigate = useNavigate();
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [currentSponsor, setCurrentSponsor] = useState(0);
    
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    // Only show admin features if explicitly logged in as admin
    const isAdmin = isAuthenticated && userRole === 'admin';
    // Staff dashboard mode via query param
    const location = useLocation();
    const staffMode = new URLSearchParams(location.search).get('mode') === 'staff';
    const showAdmin = isAdmin && !staffMode;

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
        { name: "The Light House", image: "/assets/light house" },
        { name: "Net Core", image: "/assets/net core.png" },
        { name: "NoFolk", image: "/assets/nofolk-cresent.jpeg" },
        { name: "Sarathee", image: "/assets/sarathee.jpeg" },
        { name: "Sarita", image: "/assets/sarita.jpeg" },
        { name: "SPP", image: "/assets/spp.jpeg" },
        { name: "Text Wear", image: "/assets/textware.png" },
        { name: "TKS", image: "/assets/TKS.jpeg" },
        { name: "Unik Wear", image: "/assets/unik wear.jpeg" },
        { name: "ONE.Tech", image: "/assets/one tech.jpeg" }
    ];

    useEffect(() => {
        fetchPointsTable();
        const interval = setInterval(fetchPointsTable, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Sponsor carousel auto-rotation
    useEffect(() => {
        const sponsorInterval = setInterval(() => {
            setCurrentSponsor((prev) => (prev + 1) % sponsors.length);
        }, 3000); // Change every 3 seconds
        return () => clearInterval(sponsorInterval);
    }, [sponsors.length]);

    const fetchPointsTable = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/backend/api/tournament/points.php?path=points-table`);
            const data = await response.json();
            
            if (data.success) {
                setStandings(data.data);
                setLastUpdated(new Date());
                setError(null);
            } else {
                setError(data.message || 'Failed to fetch points table');
            }
        } catch (err) {
            console.error('Error fetching points table:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const getTeamInitials = (teamName) => {
        return teamName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);
    };

    const getPositionClass = (position) => {
        if (position === 1) return 'top-1';
        if (position === 2) return 'top-2';
        if (position <= 4) return 'top-4';
        return '';
    };

    const getQualificationZone = (position) => {
        if (position === 1) return 'q1 qualification-zone';
        if (position === 2) return 'q2 qualification-zone';
        if (position <= 4) return 'eliminator qualification-zone';
        return '';
    };

    const getQualificationBadge = (position) => {
        if (position <= 4) {
            return <span className="qualified-badge">Qualified</span>;
        }
        return null;
    };

    const getNRRClass = (nrr) => {
        const nrrValue = parseFloat(nrr);
        if (nrrValue > 0) return 'nrr-positive';
        if (nrrValue < 0) return 'nrr-negative';
        return 'nrr-neutral';
    };

    const formatNRR = (nrr) => {
        const nrrValue = parseFloat(nrr);
        return nrrValue > 0 ? `+${nrr}` : nrr;
    };

    if (loading) {
        return (
            <div className="points-table-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading Points Table...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="points-table-container">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <h3>Error Loading Points Table</h3>
                    <p>{error}</p>
                    <button onClick={fetchPointsTable} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (standings.length === 0) {
        return (
            <div className="points-table-container">
                <div className="empty-state">
                    <div className="empty-state-icon">🏏</div>
                    <h3>No Data Available</h3>
                    <p>Points table will be updated after matches are completed</p>
                </div>
            </div>
        );
    }

    return (
        <div className="points-table-container">
            {/* Navigation Header */}
            <header className="points-header">
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
                        <button className="nav-button" onClick={() => navigate(staffMode ? '/live-scoreboard?mode=staff' : '/live-scoreboard')}>Live Scoreboard</button>
                        <button className="nav-button active">Points Table</button>
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
                </div>
            </header>

            <div className="points-table-header">
                <h1 className="points-table-title">SPL Championship - Points Table</h1>
                <p className="points-table-subtitle">
                    Season 2026 • Last Updated: {lastUpdated.toLocaleTimeString()}
                </p>
            </div>

            <div className="scroll-hint">
                ← Swipe to see more columns →
            </div>

            <div className="table-wrapper">
                <table className="points-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Team</th>
                            <th className="center">
                                <span className="column-abbr" title="Matches Played">M</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="Matches Won">W</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="Matches Lost">L</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="Tied Matches">T</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="No Result">NR</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="Points">PTS</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="Net Run Rate">NRR</span>
                                <span className="info-tooltip" data-tooltip="(Runs Scored/Overs Faced) - (Runs Conceded/Overs Bowled)">ℹ️</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="For - Runs/Overs">For</span>
                            </th>
                            <th className="center">
                                <span className="column-abbr" title="Against - Runs/Overs">Against</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((team, index) => (
                            <tr key={team.team_id} className={getQualificationZone(team.position)}>
                                <td>
                                    <span className={`position-badge ${getPositionClass(team.position)}`}>
                                        {team.position}
                                    </span>
                                </td>
                                <td>
                                    <div className="team-name-cell">
                                        <div className="team-logo">
                                            {getTeamInitials(team.team_name)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{team.team_name}</div>
                                            {getQualificationBadge(team.position)}
                                        </div>
                                    </div>
                                </td>
                                <td className="center stat-cell">{team.matches_played}</td>
                                <td className="center win-count">{team.matches_won}</td>
                                <td className="center loss-count">{team.matches_lost}</td>
                                <td className="center stat-cell">{team.matches_tied}</td>
                                <td className="center stat-cell">{team.matches_nr}</td>
                                <td className="center points-cell">{team.points}</td>
                                <td className={`center nrr-cell ${getNRRClass(team.nrr)}`}>
                                    {formatNRR(team.nrr)}
                                </td>
                                <td className="center">
                                    <div>{team.runs_scored}/{team.overs_faced}</div>
                                    <div className="match-stats-detail">
                                        RR: {team.run_rate_for}
                                    </div>
                                </td>
                                <td className="center">
                                    <div>{team.runs_conceded}/{team.overs_bowled}</div>
                                    <div className="match-stats-detail">
                                        RR: {team.run_rate_against}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="table-legend">
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}></div>
                        <span className="legend-label">1st - Direct to Final (Qualifier 1 Winner)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}></div>
                        <span className="legend-label">2nd - Qualifier 1</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}></div>
                        <span className="legend-label">3rd-4th - Eliminator</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-label"><strong>Playoff Format:</strong> 1st vs 2nd (Q1) → Winner to Final | 3rd vs 4th (Eliminator) → Winner vs Q1 Loser (Q2) → Winner to Final</span>
                    </div>
                </div>
            </div>

            {/* Sponsors Carousel Section */}
            <section className="sponsors-carousel-section">
                <h2 className="sponsors-title">Our Sponsors</h2>
                <div className="sponsors-slideshow">
                    {sponsors.map((sponsor, index) => (
                        <div 
                            key={index} 
                            className={`sponsor-slide ${index === currentSponsor ? 'active' : ''}`}
                        >
                            <img src={sponsor.image} alt={sponsor.name} />
                            <p className="sponsor-name">{sponsor.name}</p>
                        </div>
                    ))}
                </div>
                <div className="sponsor-dots">
                    {sponsors.map((_, index) => (
                        <button
                            key={index}
                            className={`sponsor-dot ${index === currentSponsor ? 'active' : ''}`}
                            onClick={() => setCurrentSponsor(index)}
                            aria-label={`Go to sponsor ${index + 1}`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default PointsTable;
