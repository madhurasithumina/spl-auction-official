import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import PlayerRegistration from './pages/PlayerRegistration';
import ViewPlayers from './pages/ViewPlayers';
import Auction from './pages/Auction';
import Teams from './pages/Teams';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import './App.css';

function App() {
  const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/register-player" 
            element={
              <PrivateRoute>
                <PlayerRegistration />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/view-players" 
            element={
              <PrivateRoute>
                <ViewPlayers />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/auction" 
            element={
              <PrivateRoute>
                <Auction />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teams" 
            element={
              <PrivateRoute>
                <Teams />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
