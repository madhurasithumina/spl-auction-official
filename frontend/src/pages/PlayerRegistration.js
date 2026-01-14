import React, { useState, useEffect } from 'react';
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
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [players, setPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Fetch all players on component mount
  useEffect(() => {
    fetchPlayers();
    
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.autocomplete-wrapper')) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('https://spl.sarasagroup.lk/backend/api/players.php');
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Handle player name search
    if (name === 'playerName') {
      if (value.length >= 2) {
        const filtered = players.filter(player =>
          player.player_name.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
      // If user is typing, switch back to create mode
      if (isUpdateMode && value !== formData.playerName) {
        setIsUpdateMode(false);
        setSelectedPlayerId(null);
      }
    }
  };

  const handlePlayerSelect = (player) => {
    // Load player data into form
    setFormData({
      playerName: player.player_name,
      battingSide: player.batting_side,
      age: player.age.toString(),
      bowlingSide: player.bowling_side,
      bowlingStyle: player.bowling_style
    });
    setSelectedPlayerId(player.id);
    setIsUpdateMode(true);
    setShowSuggestions(false);
    setSearchResults([]);
    
    // Load existing profile picture if exists
    // const imageUrl = `https://spl.sarasagroup.lk/assets/Images/players/${player.id}.png`;
    const imageUrl = `https://spl.sarasagroup.lk/assets/Images/players/${player.id}.png`;
    setImagePreview(imageUrl);
    setProfileImage(null); // Reset file input
    
    setMessage({ type: 'info', text: `Loaded player: ${player.player_name}. You can now update the details.` });
  };

  const handleNewPlayer = () => {
    setFormData({
      playerName: '',
      battingSide: 'RHB',
      age: '',
      bowlingSide: 'RHB',
      bowlingStyle: 'Fast Bowling'
    });
    setSelectedPlayerId(null);
    setIsUpdateMode(false);
    setProfileImage(null);
    setImagePreview(null);
    setSearchResults([]);
    setShowSuggestions(false);
    setMessage({ type: '', text: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('playerName', formData.playerName);
      submitData.append('battingSide', formData.battingSide);
      submitData.append('age', formData.age);
      submitData.append('bowlingSide', formData.bowlingSide);
      submitData.append('bowlingStyle', formData.bowlingStyle);
      
      // Add profile image if selected
      if (profileImage) {
        submitData.append('profileImage', profileImage);
      }

      if (isUpdateMode && selectedPlayerId) {
        // Update existing player
        submitData.append('_method', 'PUT');
        submitData.append('playerId', selectedPlayerId);
        
        await axios.post('https://spl.sarasagroup.lk/backend/api/players.php', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setMessage({ 
          type: 'success', 
          text: 'Player updated successfully!' 
        });
      } else {
        // Register new player
        await axios.post('https://spl.sarasagroup.lk/backend/api/players.php', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setMessage({ 
          type: 'success', 
          text: 'Player registered successfully!' 
        });
      }
      
      // Refresh players list
      await fetchPlayers();
      
      // Reset form
      setTimeout(() => {
        handleNewPlayer();
      }, 1500);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || `Failed to ${isUpdateMode ? 'update' : 'register'} player. Please try again.` 
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
            <h2>{isUpdateMode ? 'Update Player' : 'Player Registration'}</h2>
            <p>{isUpdateMode ? 'Update player details' : 'Register new players for the tournament'}</p>
            {isUpdateMode && (
              <button type="button" className="new-player-btn" onClick={handleNewPlayer}>
                + Register New Player
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="registration-form">
            {/* Player Name */}
            <div className="form-field">
              <label htmlFor="playerName">
                <span className="label-icon">👤</span>
                Player Name {isUpdateMode && <span className="update-badge">Updating</span>}
              </label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  id="playerName"
                  name="playerName"
                  value={formData.playerName}
                  onChange={handleChange}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Enter player name or search existing player"
                  required
                />
                {showSuggestions && searchResults.length > 0 && (
                  <div className="suggestions-dropdown">
                    {searchResults.slice(0, 10).map(player => (
                      <div
                        key={player.id}
                        className="suggestion-item"
                        onClick={() => handlePlayerSelect(player)}
                      >
                        <div className="suggestion-info">
                          <span className="suggestion-name">{player.player_name}</span>
                          <span className="suggestion-details">
                            {player.age} years • {player.batting_side} • {player.bowling_style}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

            {/* Profile Picture */}
            <div className="form-field">
              <label htmlFor="profileImage">
                <span className="label-icon">📷</span>
                Profile Picture (Optional)
              </label>
              <input
                type="file"
                id="profileImage"
                name="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => {
                      setProfileImage(null);
                      setImagePreview(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
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
                {loading 
                  ? (isUpdateMode ? 'Updating...' : 'Registering...') 
                  : (isUpdateMode ? 'Update Player' : 'Register Player')
                }
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="info-panel">
          <div className="info-card">
            <h3>{isUpdateMode ? 'Update Guidelines' : 'Registration Guidelines'}</h3>
            <ul>
              {isUpdateMode && (
                <li>
                  <span className="check-icon">✓</span>
                  Updating player: {formData.playerName}
                </li>
              )}
              <li>
                <span className="check-icon">✓</span>
                {isUpdateMode ? 'Modify any field as needed' : 'Player name must be complete and accurate'}
              </li>
              <li>
                <span className="check-icon">✓</span>
                {isUpdateMode ? 'Upload new photo to replace existing' : 'Age should be between 10 and 60 years'}
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
