import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import './MatchCompletionModal.css';

const MatchCompletionModal = ({ winner, margin, onClose, matchId }) => {
  const [pointsUpdated, setPointsUpdated] = useState(false);

  useEffect(() => {
    // Update points table
    updatePointsTable();

    // Play celebration music
    const audio = new Audio('/celebration.mp3');
    audio.loop = false;
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Audio play failed:', err));
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePointsTable = async () => {
    if (!matchId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/backend/api/tournament/points.php?path=update-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId })
      });

      const data = await response.json();
      if (data.success) {
        setPointsUpdated(true);
        console.log('Points table updated successfully');
      }
    } catch (err) {
      console.error('Error updating points table:', err);
    }
  };

  return (
    <div className="match-completion-overlay">
      <div className="match-completion-modal">
        <div className="fireworks">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
        
        <div className="trophy-icon">🏆</div>
        
        <h1 className="congratulations-text">CONGRATULATIONS!</h1>
        
        <div className="winner-section">
          <h2 className="winner-name">{winner}</h2>
          <p className="win-margin">{margin}</p>
        </div>
        
        <div className="celebration-emoji">
          🎉 🎊 🎈 🎆 🎇
        </div>
        
        <div className="match-complete-text">
          <p>Match Completed Successfully!</p>
          {pointsUpdated && (
            <p style={{ fontSize: '14px', color: '#27ae60', marginTop: '10px' }}>
              ✓ Points Table Updated
            </p>
          )}
        </div>
        
        <button className="close-celebration-btn" onClick={onClose}>
          View Scorecard
        </button>
      </div>
    </div>
  );
};

export default MatchCompletionModal;
