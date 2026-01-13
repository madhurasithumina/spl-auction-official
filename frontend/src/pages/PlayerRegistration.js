import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PlayerRegistration.css';

const PlayerRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    playerName: '',
    battingSide: 'RHB',
    age: '',
    bowlingSide: 'RHB',
    bowlingStyle: 'Fast Bowling'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('http://localhost:8081/backend/api/players.php', formData);
      
      setMessage({ 
        type: 'success', 
        text: 'Player registered successfully!' 
      });
      
      // Reset form
      setFormData({
        playerName: '',
        battingSide: 'RHB',
        age: '',
        bowlingSide: 'RHB',
        bowlingStyle: 'Fast Bowling'
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to register player. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="registration-container">
      {/* Header */}
      <header className="reg-header">
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
            <button className="nav-button" onClick={() => navigate('/admin')}>Admin</button>
            <button className="nav-button active" onClick={() => navigate('/register-player')}>Player Registration</button>
            <div className="user-info">
              <span className="username">{localStorage.getItem('username')}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Registration Form */}
      <div className="registration-content">
        <div className="form-container">
          <div className="form-header">
            <h2>Player Registration</h2>
            <p>Register new players for the tournament</p>
          </div>

          <form onSubmit={handleSubmit} className="registration-form">
            {/* Player Name */}
            <div className="form-field">
              <label htmlFor="playerName">
                <span className="label-icon">👤</span>
                Player Name
              </label>
              <input
                type="text"
                id="playerName"
                name="playerName"
                value={formData.playerName}
                onChange={handleChange}
                placeholder="Enter player full name"
                required
              />
            </div>

            {/* Age */}
            <div className="form-field">
              <label htmlFor="age">
                <span className="label-icon">🎂</span>
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age"
                min="10"
                max="60"
                required
              />
            </div>

            {/* Batting Side */}
            <div className="form-field">
              <label htmlFor="battingSide">
                <span className="label-icon">🏏</span>
                Batting Side
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="battingSide"
                    value="RHB"
                    checked={formData.battingSide === 'RHB'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom">RHB (Right Hand Bat)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="battingSide"
                    value="LHB"
                    checked={formData.battingSide === 'LHB'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom">LHB (Left Hand Bat)</span>
                </label>
              </div>
            </div>

            {/* Bowling Side */}
            <div className="form-field">
              <label htmlFor="bowlingSide">
                <span className="label-icon">⚾</span>
                Bowling Side
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="bowlingSide"
                    value="RHB"
                    checked={formData.bowlingSide === 'RHB'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom">Right Arm</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="bowlingSide"
                    value="LHB"
                    checked={formData.bowlingSide === 'LHB'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom">Left Arm</span>
                </label>
              </div>
            </div>

            {/* Bowling Style */}
            <div className="form-field">
              <label htmlFor="bowlingStyle">
                <span className="label-icon">💨</span>
                Bowling Style
              </label>
              <select
                id="bowlingStyle"
                name="bowlingStyle"
                value={formData.bowlingStyle}
                onChange={handleChange}
                required
              >
                <option value="Fast Bowling">Fast Bowling</option>
                <option value="Medium Fast">Medium Fast</option>
                <option value="Off Spin">Off Spin</option>
                <option value="Leg Spin">Leg Spin</option>
              </select>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Player'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="info-panel">
          <div className="info-card">
            <h3>Registration Guidelines</h3>
            <ul>
              <li>
                <span className="check-icon">✓</span>
                Player name must be complete and accurate
              </li>
              <li>
                <span className="check-icon">✓</span>
                Age should be between 10 and 60 years
              </li>
              <li>
                <span className="check-icon">✓</span>
                Select the correct batting and bowling sides
              </li>
              <li>
                <span className="check-icon">✓</span>
                Choose appropriate bowling style
              </li>
            </ul>
          </div>
          <div className="stats-card">
            <div className="stat-box">
              <div className="stat-icon">🏏</div>
              <div className="stat-info">
                <h4>Total Players</h4>
                <p className="stat-value">100+</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <h4>Teams</h4>
                <p className="stat-value">8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistration;
