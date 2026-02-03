# 🏏 SPL Tournament System

## Professional Cricket Tournament Management with Points Table & Playoffs

A complete tournament system featuring:
- 📊 **Real-time Points Table** with Net Run Rate (NRR)
- 🏆 **Playoff Bracket System** (Qualifier 1, Eliminator, Qualifier 2, Final)
- 🎯 **Automatic Calculations** for points, NRR, and rankings
- 💎 **International-level Design** inspired by IPL/ICC tournaments
- 📱 **Fully Responsive** for all devices

---

## 🎯 Tournament Format

### **League Stage (Round Robin)**
- 4 teams play against each other
- 6 matches total
- Win = 2 points, Tie/NR = 1 point, Loss = 0 points
- Top 4 teams qualify for playoffs

### **Playoff Stage (Knockout)**
```
┌─────────────────────────────────────────────────────────┐
│                    LEAGUE STAGE                          │
│  (6 matches - all teams play each other once)           │
│                 Points Table Rankings                    │
│          1st | 2nd | 3rd | 4th                          │
└─────┬─────────┴─────┴─────┴────────────────┬───────────┘
      │                                        │
      ▼                                        ▼
┌──────────────┐                        ┌──────────────┐
│ QUALIFIER 1  │                        │  ELIMINATOR  │
│  1st vs 2nd  │                        │  3rd vs 4th  │
└──────┬───────┘                        └───────┬──────┘
       │                                        │
    Winner ──────────┐              Winner ─────┤
       │             │                 │        │
    Loser ───────┐   │              Loser       │
                 │   │           (Eliminated)   │
                 ▼   │                          │
           ┌──────────────┐                     │
           │ QUALIFIER 2  │◄────────────────────┘
           │ Q1 Loser vs  │
           │ Elim Winner  │
           └──────┬───────┘
                  │
               Winner ────┐
                  │       │
               Loser      │
           (Eliminated)   │
                          ▼
                   ┌──────────────┐
                   │    FINAL     │
                   │ Q1 Winner vs │
                   │ Q2 Winner    │
                   └──────┬───────┘
                          │
                       CHAMPION 🏆
```

---

## 🚀 Quick Setup

### 1. Database Setup (One-time)
```bash
cd backend/database
# Run the import script
import_tournament.bat

# Or manually:
mysql -u root -p spl_auction < tournament_schema.sql
```

### 2. Start Backend
```bash
cd backend
php -S localhost:8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Access the System
- **Points Table:** http://localhost:3000/#/points-table
- **Tournament Bracket:** http://localhost:3000/#/tournament
- **Match Setup:** http://localhost:3000/#/match-setup

---

## 📊 Points Table Features

### Real-time Display
- Live standings with automatic updates
- Color-coded qualification zones
- Team positions with badges
- Matches played, won, lost statistics

### Net Run Rate (NRR)
```
NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
```

**Example:**
```
Team A:
  Scored: 600 runs in 60 overs (RR: 10.00)
  Conceded: 550 runs in 60 overs (RR: 9.17)
  NRR = 10.00 - 9.17 = +0.833 ✅
```

### Ranking System
1. **Points** (primary)
2. **NRR** (if points equal)
3. **Wins** (if NRR equal)

### Visual Indicators
- 🥇 **1st Place:** Pink/Red gradient - Direct to Final (Q1 Winner)
- 🥈 **2nd Place:** Blue gradient - Qualifier 1
- 🥉 **3rd-4th Place:** Orange gradient - Eliminator
- ✓ **Qualified Badge:** For all playoff teams

---

## 🏆 Tournament Bracket Features

### Visual Playoff Tracker
- Live match cards with status indicators
- Team progression through rounds
- Winner highlights
- Real-time updates

### Match Statuses
- 🔴 **Live:** Match in progress (blinking indicator)
- ✅ **Completed:** Match finished (green border)
- ⏳ **Upcoming:** Match scheduled (gray)

### Champion Celebration
- Animated trophy display
- Winner announcement with fireworks
- Runner-up recognition
- Tournament completion status

---

## 🎮 Usage Guide

### Phase 1: League Matches

#### Create Matches (6 total)
1. Team A vs Team B
2. Team D vs Team C
3. Team B vs Team D
4. Team C vs Team A
5. Team B vs Team C
6. Team A vs Team D

#### For Each Match:
1. Go to **Match Setup**
2. Select teams, set date/venue
3. Choose playing XI
4. Start match in **Scoring** page
5. Complete match
6. **Points table updates automatically!** ✅

#### Monitor Progress:
- Check **/points-table** after each match
- View real-time NRR calculations
- Track qualification positions

### Phase 2: Playoff Initialization

After completing all 6 league matches:

1. Go to **/tournament** page
2. Click **"Initialize Playoffs"** button
3. System automatically:
   - Ranks teams by points & NRR
   - Creates playoff bracket
   - Sets Qualifier 1 teams (1st vs 2nd)
   - Sets Eliminator teams (3rd vs 4th)

### Phase 3: Playoff Matches

#### Method 1: Via UI (Recommended)
Use the Match Setup interface to create playoff matches

#### Method 2: Via API
```bash
# Qualifier 1
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-qualifier-1 \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-15", "venue": "SPL Stadium"}'

# Eliminator
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-eliminator \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-16", "venue": "SPL Stadium"}'

# Qualifier 2 (after Q1 and Eliminator complete)
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-qualifier-2 \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-18", "venue": "SPL Stadium"}'

# Final (after Q2 completes)
curl -X POST http://localhost:8000/api/tournament/playoffs.php/create-final \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": 1, "match_date": "2026-02-20", "venue": "SPL Stadium"}'
```

---

## 🔧 Technical Details

### Database Tables

#### `tournaments`
- Tournament metadata (name, season, status)
- Current stage tracking
- Date range

#### `points_table`
- Team standings
- Match statistics (played, won, lost, tied)
- Points and NRR
- Position tracking

#### `match_stages`
- Match type classification (league/playoff)
- Stage identification
- Knockout flags

#### `team_match_stats`
- Detailed per-match statistics
- Runs scored/conceded
- Overs faced/bowled
- Win/loss tracking

#### `playoff_bracket`
- Playoff progression tracking
- Match IDs for each stage
- Team IDs through rounds
- Champion and runner-up

### Backend APIs

#### Points Table API
**Base:** `/api/tournament/points.php`

- `GET /points-table` - Get current standings
- `POST /update-points` - Update after match (automatic)
- `POST /initialize-playoffs` - Start playoff stage
- `GET /playoff-bracket` - Get bracket status

#### Playoff API
**Base:** `/api/tournament/playoffs.php`

- `POST /create-qualifier-1` - Create Q1 match
- `POST /create-eliminator` - Create Eliminator match
- `POST /create-qualifier-2` - Create Q2 match
- `POST /create-final` - Create Final match
- `POST /update-qualifier-1` - Update Q1 result
- `POST /update-eliminator` - Update Eliminator result
- `POST /update-qualifier-2` - Update Q2 result
- `POST /update-final` - Update Final & declare champion
- `GET /status` - Get tournament status

### Frontend Components

#### `PointsTable.js` & `PointsTable.css`
- Professional standings display
- Real-time updates (30s refresh)
- NRR color coding
- Qualification indicators
- Responsive design

#### `Tournament.js` & `Tournament.css`
- Visual playoff bracket
- Match cards with status
- Team progression
- Champion celebration
- Playoff initialization

#### `MatchCompletionModal.js`
- Automatic points update on match completion
- Integration with tournament system
- Success confirmation

---

## 🎨 Design Philosophy

### Color Scheme
- **Primary:** Purple gradient (#667eea → #764ba2)
- **Success:** Green (#27ae60)
- **Warning:** Orange (#f39c12)
- **Danger:** Red (#e74c3c)
- **Info:** Blue (#3498db)

### Inspiration
- IPL (Indian Premier League)
- ICC Cricket World Cup
- International cricket broadcasts
- Modern sports analytics platforms

### UI/UX Features
- Smooth animations and transitions
- Hover effects for interactivity
- Loading states with spinners
- Empty states with helpful messages
- Real-time data refresh
- Mobile-first responsive design

---

## 📱 Screenshots

### Points Table
```
┌─────────────────────────────────────────────────────────┐
│  SPL Championship - Points Table                        │
│  Season 2026 • Last Updated: 14:30:25                   │
├─────────────────────────────────────────────────────────┤
│ # │ Team      │ M │ W │ L │ T │ PTS │ NRR     │ For   │
├───┼───────────┼───┼───┼───┼───┼─────┼─────────┼───────┤
│ 1 │ Software  │ 3 │ 3 │ 0 │ 0 │  6  │ +0.856  │ 450/45│
│ 2 │ Technical │ 3 │ 2 │ 1 │ 0 │  4  │ +0.423  │ 380/45│
│ 3 │ Marketing │ 3 │ 1 │ 2 │ 0 │  2  │ -0.234  │ 320/45│
│ 4 │ Accounts  │ 3 │ 0 │ 3 │ 0 │  0  │ -1.045  │ 280/45│
└───┴───────────┴───┴───┴───┴───┴─────┴─────────┴───────┘
```

### Tournament Bracket
```
        QUALIFIER 1              ELIMINATOR
      ┌─────────────┐          ┌─────────────┐
      │ Software    │          │ Marketing   │
      │     vs      │          │     vs      │
      │ Technical   │          │ Accounts    │
      └──────┬──────┘          └──────┬──────┘
             │                        │
          Winner                   Winner
             │                        │
             └────────┐      ┌────────┘
                      │      │
                  QUALIFIER 2
                ┌─────────────┐
                │ Q1 Loser vs │
                │ Elim Winner │
                └──────┬──────┘
                       │
                    Winner
                       │
                    FINAL
              ┌─────────────────┐
              │ Q1 Winner  vs   │
              │ Q2 Winner       │
              └────────┬────────┘
                       │
                  🏆 CHAMPION
```

---

## 🐛 Troubleshooting

### Points not updating after match?
✅ **Check:** Match status is 'completed'  
✅ **Check:** Innings data exists  
✅ **Check:** match_stages table has correct stage

### NRR showing 0.000?
✅ **Check:** Innings have overs_faced/overs_bowled > 0  
✅ **Check:** team_match_stats table has data  
✅ **Check:** calculateNRR() is being called

### Can't initialize playoffs?
✅ **Check:** All 6 league matches completed  
✅ **Check:** Teams have different points/NRR  
✅ **Check:** Tournament status is not already 'playoffs'

### Playoff bracket not showing teams?
✅ **Check:** Initialize playoffs was clicked  
✅ **Check:** playoff_bracket table has data  
✅ **Check:** API response is successful

---

## 🔮 Future Enhancements

- [ ] Team logos upload and display
- [ ] Player of the Tournament awards
- [ ] Head-to-head records
- [ ] Match highlights integration
- [ ] Live WebSocket updates
- [ ] PDF export for standings
- [ ] Email notifications
- [ ] Mobile app version
- [ ] Multi-tournament support
- [ ] Historical tournament archive

---

## 📄 Documentation Files

- **TOURNAMENT_GUIDE.md** - Complete technical guide
- **TOURNAMENT_QUICK_START.md** - Quick setup instructions
- **README.md** - This file (overview)

---

## 🎉 Credits

**Developed for:** SPL Championship 2026  
**System:** Professional Cricket Tournament Management  
**Tech Stack:** React, PHP, MySQL, Professional UI/UX  
**Inspired by:** IPL, ICC World Cup, International Cricket

---

## 📞 Support

For issues or enhancements:
1. Check the troubleshooting section
2. Review API responses in browser console
3. Verify database schema is properly set up
4. Check network tab for API errors

---

**Enjoy your professional cricket tournament! 🏏🏆**
