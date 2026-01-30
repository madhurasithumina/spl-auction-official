// API Configuration
// Change this URL to switch between local and production environments

// Local development
export const API_BASE_URL = 'http://localhost:8081';

// Production
// export const API_BASE_URL = 'https://spl.sarasagroup.lk';

// API endpoints
export const API_ENDPOINTS = {
  // Players
  players: `${API_BASE_URL}/backend/api/players.php`,
  playersTruncate: `${API_BASE_URL}/backend/api/players/truncate.php`,
  
  // Teams
  teams: `${API_BASE_URL}/backend/api/teams.php`,
  teamsInitialize: `${API_BASE_URL}/backend/api/teams/initialize.php`,
  teamsAuction: `${API_BASE_URL}/backend/api/teams/auction.php`,
  teamsTruncate: `${API_BASE_URL}/backend/api/teams/truncate.php`,
  
  // Matches
  matches: `${API_BASE_URL}/backend/api/matches/index.php`,
  matchesPlayingXI: `${API_BASE_URL}/backend/api/matches/playing_xi.php`,
  matchesLive: `${API_BASE_URL}/backend/api/matches/live.php`,
  
  // Innings
  innings: `${API_BASE_URL}/backend/api/innings/index.php`,
  inningsScore: `${API_BASE_URL}/backend/api/innings/score.php`,
};

// Assets URL
export const ASSETS_URL = `${API_BASE_URL}/assets/Images/players`;

// Helper function to get player image URL
export const getPlayerImageUrl = (playerId) => `${ASSETS_URL}/${playerId}.png`;
