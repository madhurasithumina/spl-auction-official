import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import StaffDashboard from './pages/StaffDashboard';
import PlayerRegistration from './pages/PlayerRegistration';
import ViewPlayers from './pages/ViewPlayers';
import Auction from './pages/Auction';
import Teams from './pages/Teams';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import MatchSetup from './pages/MatchSetup';
import Scoring from './pages/Scoring';
import LiveScoreboard from './pages/LiveScoreboard';
import './App.css';

function App() {
  const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (userRole !== 'admin') return <Navigate to="/staff-dashboard" />;
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <AdminRoute>
                <Home />
              </AdminRoute>
            } 
          />
          <Route 
            path="/staff-dashboard" 
            element={
              <PrivateRoute>
                <StaffDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/register-player" 
            element={
              <AdminRoute>
                <PlayerRegistration />
              </AdminRoute>
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
              <AdminRoute>
                <Auction />
              </AdminRoute>
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
              <AdminRoute>
                <Reports />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
          <Route 
            path="/match-setup" 
            element={
              <AdminRoute>
                <MatchSetup />
              </AdminRoute>
            } 
          />
          <Route 
            path="/scoring/:matchId" 
            element={
              <AdminRoute>
                <Scoring />
              </AdminRoute>
            } 
          />
          <Route 
            path="/live-scoreboard" 
            element={
              <PrivateRoute>
                <LiveScoreboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
