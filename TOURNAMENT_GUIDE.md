# SPL Tournament System - Setup Guide

## Overview
This document explains the complete tournament system with points table, NRR calculation, and playoff structure for the SPL Championship.

## Features

### 1. **Points Table with Net Run Rate (NRR)**
- Professional international-level design (IPL/ICC style)
- Real-time NRR calculation
- Automatic position tracking
- Qualification indicators for playoffs
- Mobile responsive design

### 2. **Tournament Structure**

#### **League Stage (First Round)**
- All 4 teams play against each other
- 6 matches total in round-robin format
- Points system:
  - Win = 2 points
  - Loss = 0 points
  - Tie/No Result = 1 point
- Top 4 teams qualify for playoffs (all teams in this case)

#### **Playoff Stage (Second Round)**
Three matches with elimination format:

1. **Qualifier 1** (Match 1)
   - 1st place vs 2nd place
   - Winner → Direct entry to Final
   - Loser → Goes to Qualifier 2

2. **Eliminator** (Match 2)
   - 3rd place vs 4th place
   - Winner → Goes to Qualifier 2
   - Loser → Eliminated

3. **Qualifier 2** (Match 3)
   - Loser of Qualifier 1 vs Winner of Eliminator
   - Winner → Goes to Final
   - Loser → Eliminated

#### **Final**
- Winner of Qualifier 1 vs Winner of Qualifier 2
- Winner = Tournament Champion 🏆

### 3. **NRR (Net Run Rate) Calculation**
```
NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
```

**Example:**
- Team scored 600 runs in 60 overs, conceded 550 runs in 60 overs
- Run Rate For = 600/60 = 10.00
- Run Rate Against = 550/60 = 9.17
- NRR = 10.00 - 9.17 = +0.833

## Database Setup

### Step 1: Run Schema Files
Execute these SQL files in order:

```bash
# 1. Basic schema (if not already done)
mysql -u root -p spl_auction < backend/database/schema.sql

# 2. Matches schema (if not already done)
mysql -u root -p spl_auction < backend/database/matches_schema.sql

# 3. Tournament schema (NEW)
mysql -u root -p spl_auction < backend/database/tournament_schema.sql
```

### Step 2: Initialize Tournament
The tournament is automatically initialized with:
- Tournament ID: 1
- Season: 2026
- Status: league_stage
- All 4 teams in points table

## Backend APIs

### Points Table API
**Endpoint:** `/api/tournament/points.php`

#### Get Points Table
```javascript
GET /api/tournament/points.php/points-table
Response: {
  "success": true,
  "data": [
    {
      "position": 1,
      "team_name": "Software",
      "matches_played": 3,
      "matches_won": 3,
      "points": 6,
      "nrr": "+0.856",
      ...
    }
  ]
}
```

#### Update Points After Match
```javascript
POST /api/tournament/points.php/update-points
Body: { "match_id": 1 }
Response: { "success": true, "message": "Points table updated successfully" }
```

#### Initialize Playoffs
```javascript
POST /api/tournament/points.php/initialize-playoffs
Body: { "tournament_id": 1 }
Response: {
  "success": true,
  "data": {
    "qualifier_1": { "team1": {...}, "team2": {...} },
    "eliminator": { "team1": {...}, "team2": {...} }
  }
}
```

### Playoff Management API
**Endpoint:** `/api/tournament/playoffs.php`

#### Create Playoff Matches
```javascript
// Qualifier 1
POST /api/tournament/playoffs.php/create-qualifier-1
Body: {
  "tournament_id": 1,
  "match_date": "2026-02-15",
  "venue": "SPL Stadium"
}

// Eliminator
POST /api/tournament/playoffs.php/create-eliminator
Body: { "tournament_id": 1, "match_date": "2026-02-16", "venue": "SPL Stadium" }

// Qualifier 2
POST /api/tournament/playoffs.php/create-qualifier-2
Body: { "tournament_id": 1, "match_date": "2026-02-18", "venue": "SPL Stadium" }

// Final
POST /api/tournament/playoffs.php/create-final
Body: { "tournament_id": 1, "match_date": "2026-02-20", "venue": "SPL Stadium" }
```

#### Update Match Results
```javascript
// After each playoff match completion
POST /api/tournament/playoffs.php/update-qualifier-1
Body: { "tournament_id": 1, "match_id": 7, "winner_id": 1 }

POST /api/tournament/playoffs.php/update-eliminator
Body: { "tournament_id": 1, "match_id": 8, "winner_id": 3 }

POST /api/tournament/playoffs.php/update-qualifier-2
Body: { "tournament_id": 1, "match_id": 9, "winner_id": 2 }

POST /api/tournament/playoffs.php/update-final
Body: { "tournament_id": 1, "match_id": 10, "winner_id": 1 }
```

## Frontend Components

### 1. Points Table Page
**Route:** `/points-table`

Features:
- Real-time points table with auto-refresh (30 seconds)
- Color-coded positions with qualification zones
- NRR display with positive/negative indicators
- Detailed run rates (For/Against)
- Professional ICC/IPL-style design
- Fully responsive
- Qualification badges for playoff teams

### 2. Tournament Bracket Page
**Route:** `/tournament`

Features:
- Visual playoff bracket showing all matches
- Real-time match status (Upcoming/Live/Completed)
- Team progression through rounds
- Winner indicators
- Champion celebration when tournament completes
- Initialize playoffs button (when league stage completes)

### 3. Integration with Match Completion
Server-driven updates ensure reliability:
1. Backend automatically updates the points table when any league-stage match completes (via backend-side end_match and scoring auto-complete).
2. Points aggregates and NRR are recalculated for all teams.
3. Team positions are updated and persisted.
4. Frontend points page reflects changes on refresh or next poll.

For playoff matches, points aren’t modified. Instead, bracket progression updates automatically when a playoff match completes.

## Usage Workflow

### League Stage
1. Create and complete all 6 round-robin matches
2. Points table updates automatically after each match
3. View standings at `/points-table`
4. Top 4 teams qualify for playoffs

### Transition to Playoffs
1. After 6th match completion, go to `/tournament`
2. Click "Initialize Playoffs" button
3. This creates playoff bracket with qualified teams
4. Tournament status changes to "Playoffs"

### Playoff Matches
1. **Create Qualifier 1:**
   - Use backend API or match setup interface
   - Play match between 1st and 2nd place
   - Complete match
   - Winner goes directly to Final
   - Loser waits for Qualifier 2

2. **Create Eliminator:**
   - Play match between 3rd and 4th place
   - Complete match
   - Winner goes to Qualifier 2
   - Loser is eliminated

3. **Create Qualifier 2:**
   - Automatically set up with correct teams
   - Play match
   - Complete match
   - Winner goes to Final

4. **Create Final:**
   - Two finalists are set
   - Play final match
   - Complete match
   - Champion is declared! 🏆

### Automatic Playoff Progression
After each playoff match is marked completed, the backend updates tournament progression automatically:
- Qualifier 1: Winner goes to Final; loser seeded into Qualifier 2.
- Eliminator: Winner seeded into Qualifier 2; loser eliminated.
- Qualifier 2: Winner goes to Final; loser eliminated.
- Final: Champion and runner-up are persisted; tournament status becomes completed.

These updates are triggered when the match is completed, whether via the end_match API or the scoring auto-complete flow.

## Navigation Updates

Add these links to your navigation menu:

```javascript
<NavLink to="/points-table">Points Table</NavLink>
<NavLink to="/tournament">Tournament</NavLink>
```

## Important Notes

### Match Stage Tracking
When creating matches, specify the stage in `match_stages` table:
- `group_stage` - League matches (count for points table)
- `qualifier_1`, `eliminator`, `qualifier_2`, `final` - Playoff matches (don't affect points table)

### NRR Accuracy
- Only completed overs are counted
- If a team is all out before full overs, actual overs faced are used
- NRR is recalculated after every league match

### Tiebreakers
If teams have equal points:
1. Higher NRR
2. More wins
3. Head-to-head record (can be added if needed)

## Testing

### Test Data Setup
```sql
-- Insert test tournament
INSERT INTO tournaments (tournament_name, season, start_date, status) 
VALUES ('Test Tournament', '2026', CURDATE(), 'league_stage');

-- Teams are already in the system (Software, Marketing, Technical, Accounts)

-- Initialize points table
INSERT INTO points_table (tournament_id, team_id)
SELECT 1, id FROM teams;
```

### API Testing
Use Postman or curl to test endpoints:

```bash
# Get points table
curl http://localhost/api/tournament/points.php/points-table

# Update points after match
curl -X POST http://localhost/api/tournament/points.php/update-points \
  -H "Content-Type: application/json" \
  -d '{"match_id": 1}'

# Get tournament status
curl http://localhost/api/tournament/playoffs.php/status?tournament_id=1
```

## Styling

The components use professional styling inspired by:
- IPL (Indian Premier League)
- ICC Cricket World Cup
- International cricket broadcasts

Color schemes:
- Primary: Purple gradient (#667eea to #764ba2)
- Success: Green (#27ae60)
- Warning: Orange (#f39c12)
- Danger: Red (#e74c3c)

## Troubleshooting

### Points not updating
- Check if match status is 'completed'
- Verify match_stages table has correct tournament_id
- Check if innings data exists for the match

### NRR showing 0.000
- Ensure innings data has overs_faced/overs_bowled > 0
- Check team_match_stats table for data
- Verify calculateNRR() function is being called

### Playoffs not initializing
- Ensure at least 4 teams have played matches
- Check if teams have different points/NRR values
- Verify tournament status is not already 'playoffs'

## Future Enhancements

1. **Team Logos:** Upload and display actual team logos
2. **Head-to-Head Records:** Track and display team matchups
3. **Player Awards:** Most runs, wickets, Player of Tournament
4. **Match Highlights:** Link to video/photo highlights
5. **Live Updates:** WebSocket integration for real-time updates
6. **Export Data:** PDF generation for final standings
7. **Historical Tournaments:** Archive and view past tournaments

## Support

For issues or questions:
1. Check database schema is properly set up
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Review network tab for API responses

## Credits

Developed for SPL Championship 2026
Professional cricket tournament management system
