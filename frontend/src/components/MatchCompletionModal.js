import React, { useEffect } from 'react';
import './MatchCompletionModal.css';

const MatchCompletionModal = ({ winner, margin, onClose }) => {
  useEffect(() => {
    // Play celebration music
    const audio = new Audio('/celebration.mp3');
    audio.loop = false;
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Audio play failed:', err));
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

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
        </div>
        
        <button className="close-celebration-btn" onClick={onClose}>
          View Scorecard
        </button>
      </div>
    </div>
  );
};

export default MatchCompletionModal;
