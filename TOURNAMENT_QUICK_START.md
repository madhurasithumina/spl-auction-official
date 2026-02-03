# Quick Start: Tournament System

## Setup (One-time)

### 1. Database Setup
```bash
# Run the tournament schema
mysql -u root -p spl_auction < backend/database/tournament_schema.sql
```

This creates:
- `tournaments` table
- `points_table` table with NRR tracking
- `match_stages` table for league/playoff tracking
- `team_match_stats` table for detailed stats
- `playoff_bracket` table for knockout progression

### 2. Start Backend
```bash
cd backend
php -S localhost:8000
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

## Using the Tournament System

### Phase 1: League Stage (6 Matches)

#### Match Schedule:
1. Team A vs Team B
2. Team D vs Team C
3. Team B vs Team D
4. Team C vs Team A
5. Team B vs Team C
6. Team A vs Team D

#### For Each Match:
1. Go to **Match Setup** (/match-setup)
2. Create match as normal
3. Play the match in **Scoring** page
4. Complete the match
5. **Points table automatically updates!** ✓

#### View Standings:
- Go to **Points Table** (/points-table)
- See real-time standings with NRR
- Top 4 teams qualify (all teams in this case)

### Phase 2: Initialize Playoffs

After all 6 league matches:
1. Go to **Tournament** page (/tournament)
2. Click **"Initialize Playoffs"** button
3. System automatically:
   - Ranks teams by points & NRR
   - Creates playoff bracket
   - Sets up Qualifier 1 (1st vs 2nd)
   - Sets up Eliminator (3rd vs 4th)

### Phase 3: Playoff Matches

#### Match 1: Qualifier 1 (1st vs 2nd)
```bash
# Create match via API or Match Setup
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-qualifier-1 \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-15", "venue": "SPL Stadium"}'
```
- Play match
- Winner → Goes to Final
- Loser → Goes to Qualifier 2

#### Match 2: Eliminator (3rd vs 4th)
```bash
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-eliminator \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-16", "venue": "SPL Stadium"}'
```
- Play match
- Winner → Goes to Qualifier 2
- Loser → Eliminated

#### Match 3: Qualifier 2 (Q1 Loser vs Eliminator Winner)
```bash
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-qualifier-2 \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-18", "venue": "SPL Stadium"}'
```
- Play match
- Winner → Goes to Final
- Loser → Eliminated

#### Match 4: Final
```bash
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-final \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-20", "venue": "SPL Stadium"}'
```
- Play match
- Winner → **CHAMPION!** 🏆

## Key URLs

- **Points Table:** http://localhost:3000/#/points-table
- **Tournament Bracket:** http://localhost:3000/#/tournament
- **Match Setup:** http://localhost:3000/#/match-setup
- **Live Scoreboard:** http://localhost:3000/#/live-scoreboard

## Automatic Features

✅ **Points Table Updates Automatically** after each league match
✅ **NRR Calculated Automatically** with international standards
✅ **Playoff Bracket Updates** as matches complete
✅ **Real-time Refresh** every 15-30 seconds
✅ **Professional Design** like IPL/ICC tournaments

## Points System

- **Win:** 2 points
- **Loss:** 0 points
- **Tie/NR:** 1 point

## NRR Formula

```
NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
```

## Qualification

Top 4 teams qualify for playoffs (in your case, all 4 teams)

**Ranking Order:**
1. Points
2. NRR (if points equal)
3. Wins (if NRR equal)

## Navigation Menu

Add these to your navigation:

```jsx
<NavLink to="/points-table">
  📊 Points Table
</NavLink>
<NavLink to="/tournament">
  🏆 Tournament
</NavLink>
```

## Example: Complete Workflow

### Day 1-5: League Matches
```
Match 1: Software vs Marketing → Software wins
  → Points: Software: 2, Marketing: 0
  → NRR updated

Match 2: Technical vs Accounts → Technical wins
  → Points updated, NRR calculated

... continue for all 6 matches
```

### After Match 6: View Standings
```
Points Table:
1. Software     - 6 pts, +0.856 NRR ✓ Qualified
2. Technical    - 4 pts, +0.423 NRR ✓ Qualified
3. Marketing    - 2 pts, -0.234 NRR ✓ Qualified
4. Accounts     - 0 pts, -1.045 NRR ✓ Qualified
```

### Day 6: Initialize Playoffs
Click button → Bracket created:
- **Q1:** Software vs Technical
- **Eliminator:** Marketing vs Accounts

### Day 7-9: Playoff Matches
```
Q1: Software beats Technical
  → Software → Final
  → Technical → Q2

Eliminator: Marketing beats Accounts
  → Marketing → Q2
  → Accounts eliminated

Q2: Technical beats Marketing
  → Technical → Final
  → Marketing eliminated

Final: Software beats Technical
  → Software = CHAMPION! 🏆
```

## Troubleshooting

**Points not updating?**
- Check match is in 'completed' status
- Verify innings data exists

**Can't initialize playoffs?**
- Complete all league matches first
- Ensure 4+ teams have played

**NRR showing 0.000?**
- Match needs innings data with overs
- Check team_match_stats table

## Commands Reference

### Check Points Table
```bash
curl http://localhost:8000/api/tournament/points.php/points-table
```

### Manual Points Update
```bash
curl -X POST http://localhost:8000/api/tournament/points.php/update-points \
  -H "Content-Type: application/json" \
  -d '{"match_id": 1}'
```

### Check Tournament Status
```bash
curl http://localhost:8000/api/tournament/playoffs.php/status
```

### Get Playoff Bracket
```bash
curl http://localhost:8000/api/tournament/points.php/playoff-bracket
```

## Done! 🎉

You now have a complete professional cricket tournament system with:
- ✅ Points table with NRR
- ✅ Automatic calculations
- ✅ Playoff bracket system
- ✅ Champion declaration
- ✅ International-level design

Enjoy your tournament! 🏏🏆
