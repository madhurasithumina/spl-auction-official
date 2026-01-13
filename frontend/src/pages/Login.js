import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Hardcoded credentials
    if (username === 'Sarasa' && password === 'Sarasa@123') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', username);
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="cricket-overlay"></div>
      </div>
      <div className="login-box">
        <div className="login-header">
          <div className="logo-container">
            <div className="cricket-ball"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <p className="subtitle">Premier League Cricket Tournament</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">
            <span>LOGIN</span>
          </button>
        </form>
        
        <div className="login-footer">
          <p>Developed by Sarasa Group Pvt Ltd</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
