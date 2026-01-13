import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const truncatePlayers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL players? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.delete('http://localhost:8081/backend/api/players/truncate.php');
      setMessage({ 
        type: 'success', 
        text: `${response.data.message} (${response.data.deletedCount} players deleted)` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete players' 
      });
    } finally {
      setLoading(false);
    }
  };

  const truncateTeams = async () => {
    if (!window.confirm('Are you sure you want to reset ALL teams? This will clear all players from teams and reset budgets!')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.delete('http://localhost:8081/backend/api/teams/truncate.php');
      setMessage({ 
        type: 'success', 
        text: response.data.message 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to reset teams' 
      });
    } finally {
      setLoading(false);
    }
  };

  const truncateAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL players AND reset all teams! Are you absolutely sure?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // First truncate teams
      await axios.delete('http://localhost:8081/backend/api/teams/truncate.php');
      
      // Then truncate players
      const playerResponse = await axios.delete('http://localhost:8081/backend/api/players/truncate.php');
      
      setMessage({ 
        type: 'success', 
        text: `All data cleared! ${playerResponse.data.deletedCount} players deleted and all teams reset.` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to clear all data' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/')}>Home</button>
            <button className="nav-button" onClick={() => navigate('/view-players')}>View Players</button>
            <button className="nav-button" onClick={() => navigate('/auction')}>Auction</button>
            <button className="nav-button" onClick={() => navigate('/teams')}>Teams</button>
            <button className="nav-button" onClick={() => navigate('/reports')}>Reports</button>
            <button className="nav-button active">Admin</button>
            <button className="nav-button" onClick={() => navigate('/register-player')}>Register Player</button>
            <div className="user-info">
              <span className="username">{localStorage.getItem('username')}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="page-title">⚙️ Admin Panel</h1>
        <p className="page-subtitle">Database Management & Data Truncation</p>
      </div>

      {/* Admin Actions */}
      <div className="admin-content">
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <strong>Warning:</strong> These actions will permanently delete data from the database. 
            Use with caution!
          </div>
        </div>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✓' : '✗'}
            </span>
            {message.text}
          </div>
        )}

        <div className="admin-cards">
          <div className="admin-card">
            <div className="card-icon players-icon">👥</div>
            <h2>Truncate Players</h2>
            <p>Delete all players from the database. Team rosters will be cleared automatically.</p>
            <button 
              className="admin-btn danger-btn" 
              onClick={truncatePlayers}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '🗑️ Delete All Players'}
            </button>
          </div>

          <div className="admin-card">
            <div className="card-icon teams-icon">🏆</div>
            <h2>Reset Teams</h2>
            <p>Clear all players from teams and reset budgets to LKR 10,000. Players remain in database.</p>
            <button 
              className="admin-btn warning-btn" 
              onClick={truncateTeams}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '🔄 Reset All Teams'}
            </button>
          </div>

          <div className="admin-card highlight-card">
            <div className="card-icon danger-icon">💥</div>
            <h2>Truncate Everything</h2>
            <p>Delete ALL players AND reset all teams. This will completely clear the database.</p>
            <button 
              className="admin-btn critical-btn" 
              onClick={truncateAll}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '💣 Clear All Data'}
            </button>
          </div>
        </div>

        <div className="info-section">
          <h3>📋 What happens when you truncate?</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Delete All Players:</strong>
              <ul>
                <li>Removes all player records from database</li>
                <li>Teams are automatically cleared</li>
                <li>Team budgets remain unchanged</li>
              </ul>
            </div>
            <div className="info-item">
              <strong>Reset All Teams:</strong>
              <ul>
                <li>Clears players from all team rosters</li>
                <li>Resets all budgets to LKR 10,000</li>
                <li>Player records remain in database</li>
                <li>Players status reset to "Available"</li>
              </ul>
            </div>
            <div className="info-item">
              <strong>Clear All Data:</strong>
              <ul>
                <li>Deletes all players</li>
                <li>Resets all teams</li>
                <li>Fresh start for the auction system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
