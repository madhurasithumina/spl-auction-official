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
import PointsTable from './pages/PointsTable';
import Tournament from './pages/Tournament';
import './App.css';

function App() {
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
          {/* Public route - Staff Dashboard is the default landing page */}
          <Route path="/" element={<StaffDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          
          {/* Admin Login - accessible via keyboard shortcut "1234" from Staff Dashboard */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin-only routes */}
          <Route 
            path="/home" 
            element={
              <AdminRoute>
                <Home />
              </AdminRoute>
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
            path="/auction" 
            element={
              <AdminRoute>
                <Auction />
              </AdminRoute>
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
          
          {/* Public routes - accessible to everyone */}
          <Route path="/view-players" element={<ViewPlayers />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/live-scoreboard" element={<LiveScoreboard />} />
          <Route path="/points-table" element={<PointsTable />} />
          <Route path="/tournament" element={<Tournament />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
