# 🏏 SPL Cricket Auction System - Complete Guide

## ✅ Complete System Features

### 1. **Player Management**
- ✅ Player registration with complete cricket profiles
- ✅ View all registered players with search and filters
- ✅ Player avatars with initials
- ✅ Batting/Bowling details with icons

### 2. **Team Management (NEW!)**
- ✅ 4 Teams: Software, Marketing, Technical, Accounts
- ✅ Each team has LKR 10,000 budget
- ✅ Real-time budget tracking
- ✅ Team-wise player roster view

### 3. **Auction System (NEW!)**
- ✅ Search and select players for auction
- ✅ Set sold value and select team
- ✅ Mark as Sold or Unsold
- ✅ Budget validation (prevents overspending)
- ✅ Beautiful popup confirmation with player avatar
- ✅ Automatic budget deduction
- ✅ Real-time team budget display

### 4. **Teams Page (NEW!)**
- ✅ Premier League style team display
- ✅ View all teams with their squads
- ✅ Team logos and colors
- ✅ Budget breakdown (Spent vs Remaining)
- ✅ Player cards with sold values
- ✅ Tournament summary section

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start
```
Backend runs on: http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on: http://localhost:3000

## 🔑 Login Credentials
- **Username:** Sarasa
- **Password:** Sarasa@123

## 📱 Pages Overview

### 1. Login Page (`/login`)
- Secure authentication
- Local storage session management
- Premier League styled design

### 2. Home Page (`/`)
- Welcome section with tournament branding
- Quick access to Auction and Teams
- Feature showcase
- Navigation to all sections

### 3. Player Registration (`/register-player`)
- Complete player profile form
- All cricket-related fields
- Form validation
- Success feedback

### 4. View Players (`/view-players`)
- Grid view of all registered players
- Search by name
- Filter by bowling style
- Player statistics display

### 5. Auction Page (`/auction`) **NEW!**
- **Search Panel:** Search and select available players
- **Team Budgets:** Real-time budget display for all teams
- **Auction Form:**
  - Select player from list
  - Choose Sold/Unsold status
  - Select team (if sold)
  - Enter sold value (if sold)
  - Budget validation
- **Success Popup:**
  - Beautiful animated popup
  - Player avatar display
  - Team and value information
  - Auto-closes after 3 seconds

### 6. Teams Page (`/teams`) **NEW!**
- **Team Navigation:** Switch between 4 teams
- **Team Header:** 
  - Team logo and name
  - Total players count
  - Total amount spent
  - Remaining budget
- **Player Cards:**
  - Player avatar with initials
  - Complete player details
  - Sold value display
  - Player number
- **Tournament Summary:** Quick overview of all teams

## 💰 Auction Workflow

1. **Navigate to Auction Page** (`/auction`)
2. **View Team Budgets** - See available budget for each team
3. **Search Player** - Type player name in search box
4. **Select Player** - Click on player from the list
5. **Choose Status:**
   - **Sold:** Select team and enter amount
   - **Unsold:** Mark player as unsold
6. **Submit** - Click confirm button
7. **View Popup** - See beautiful confirmation with player avatar
8. **Automatic Updates:**
   - Player removed from available list
   - Team budget automatically reduced
   - Team roster updated

## 🎨 Team Colors

| Team | Primary Color | Gradient |
|------|--------------|----------|
| **Software** | Purple | #667eea → #764ba2 |
| **Marketing** | Pink | #f093fb → #f5576c |
| **Technical** | Blue | #4facfe → #00f2fe |
| **Accounts** | Green | #43e97b → #38f9d7 |

## 🔌 API Endpoints

### Player Endpoints
- `POST /api/players` - Register player
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID

### Team Endpoints (NEW)
- `POST /api/teams/initialize` - Initialize teams
- `GET /api/teams` - Get all teams with players
- `GET /api/teams/:name` - Get specific team
- `POST /api/teams/auction` - Auction a player
- `PUT /api/teams/:teamName/reset` - Reset team budget

## 📊 Database Schema

### Player Model
```javascript
{
  playerName: String,
  battingSide: String (RHB/LHB),
  age: Number (10-60),
  bowlingSide: String (RHB/LHB),
  bowlingStyle: String (Fast/Medium/Off Spin/Leg Spin),
  soldStatus: String (Sold/Unsold/Available),
  soldValue: Number,
  soldTeam: String (Software/Marketing/Technical/Accounts),
  registeredAt: Date
}
```

### Team Model (NEW)
```javascript
{
  teamName: String (Software/Marketing/Technical/Accounts),
  initialBudget: Number (10000),
  remainingBudget: Number,
  players: [Player IDs],
  createdAt: Date
}
```

## 🎯 Business Logic

### Budget Management
- Initial Budget: LKR 10,000 per team
- When player sold:
  - Sold value deducted from team budget
  - Player added to team roster
  - Player marked as "Sold"
  - Player removed from available pool

### Validation Rules
- Cannot sell player for more than team's remaining budget
- Cannot sell already sold player
- Must enter sold value when marking as sold
- Must select team when marking as sold

## 🌟 Key Features

### Auction Page
- ✅ Live player search
- ✅ Visual player selection
- ✅ Real-time budget display
- ✅ Budget validation
- ✅ Animated success popup
- ✅ Player avatar generation
- ✅ Auto-refresh after auction

### Teams Page
- ✅ Premier League style design
- ✅ Team switching with buttons
- ✅ Comprehensive team stats
- ✅ Beautiful player cards
- ✅ Color-coded teams
- ✅ Tournament summary

### Popup Success Message
- ✅ Animated entrance
- ✅ Player avatar with initials
- ✅ Team name and color
- ✅ Sold value display
- ✅ Success message
- ✅ Auto-close (3 seconds)
- ✅ Click to close

## 📱 Responsive Design
- ✅ Desktop optimized
- ✅ Tablet friendly
- ✅ Mobile responsive
- ✅ Touch-friendly buttons
- ✅ Adaptive layouts

## 🎨 Design Highlights
- Modern gradient backgrounds
- Smooth animations and transitions
- Premier League inspired color scheme
- Cricket-themed icons and imagery
- Professional card layouts
- Intuitive user interface

## 🔄 Workflow Summary

```
1. Register Players → 2. View Players → 3. Auction → 4. View Teams
       ↓                    ↓                ↓             ↓
   Add player         Browse & Filter   Bid & Sell   See Rosters
   profiles           available         players      & Budgets
                      players
```

## 📝 Future Enhancements
- Player statistics dashboard
- Auction history tracking
- Export team rosters
- Print team sheets
- Player performance tracking
- ~~Match scheduling~~ ✅ Implemented
- Live bidding with multiple users
- Notification system

---

## 🏏 Live Scoring System - Complete Workflow

### Overview
The SPL Live Scoring System provides professional cricket match management with ball-by-ball scoring, live scoreboard display, and comprehensive statistics tracking.

### Pages
| Page | Route | Description |
|------|-------|-------------|
| **Match Setup** | `/match-setup` | Create and configure new matches |
| **Scoring** | `/scoring/:matchId` | Ball-by-ball live scoring interface |
| **Live Scoreboard** | `/live-scoreboard` | Professional live match display |

---

## 🎯 Match Setup Workflow (`/match-setup`)

### Step 1: Select Playing Teams
1. Navigate to **Match Setup** from Home page
2. Select **Team 1** from dropdown (e.g., Software)
3. Select **Team 2** from dropdown (e.g., Marketing)
4. Click **Next** to proceed

### Step 2: Match Configuration
1. Enter **Number of Overs** (e.g., 10, 15, 20)
2. Enter **Venue Name** (e.g., SPL Stadium)
3. Click **Next** to proceed

### Step 3: Toss Details
1. Select **Toss Winner** (Team 1 or Team 2)
2. Select **Toss Decision**:
   - **Bat First** - Winner chooses to bat
   - **Bowl First** - Winner chooses to field
3. Click **Next** to proceed

### Step 4: Select Playing XI - Team 1
1. View available players from Team 1's squad
2. Click on **11 players** to select them for the match
3. Selected players are highlighted
4. Counter shows "Selected: X/11"
5. Click **Next** when 11 players are selected

### Step 5: Select Playing XI - Team 2
1. View available players from Team 2's squad
2. Click on **11 players** to select them for the match
3. Click **Create Match** to finalize

### Match Created!
- Match is created with status: `setup`
- Redirected to Scoring page automatically

---

## ⚾ Live Scoring Workflow (`/scoring/:matchId`)

### Starting the Match
1. Click **🏏 Start Match** button
2. Match status changes to `live`
3. First innings begins automatically

### Initialize Innings
When innings starts, you'll be prompted to select:
1. **Opening Striker** - Select from batting team's XI
2. **Opening Non-Striker** - Select from batting team's XI
3. **Opening Bowler** - Select from bowling team's XI
4. Click **Start Innings** to begin scoring

### Scoring a Ball

#### Run Selection
| Button | Description |
|--------|-------------|
| **0** | Dot ball |
| **1** | Single run |
| **2** | Double run |
| **3** | Triple run |
| **4** | Boundary four |
| **5** | Five runs |
| **6** | Boundary six |

#### Extras Selection
| Extra | Description | Runs Added | Ball Counted |
|-------|-------------|------------|--------------|
| **Wide** | Ball too wide | +1 run | ❌ No |
| **No Ball** | Illegal delivery | +1 run | ❌ No |
| **Bye** | Runs without bat contact | +X runs | ✅ Yes |
| **Leg Bye** | Runs off pads | +X runs | ✅ Yes |
| **Penalty (5)** | Umpire penalty | +5 runs | ❌ No |

#### Recording a Wicket
1. Click **🎯 WICKET** button
2. Select **Dismissal Type**:
   - Bowled
   - Caught
   - LBW
   - Run Out
   - Stumped
   - Hit Wicket
3. For **Run Out**: Select which batsman is out
4. For **Caught/Run Out/Stumped**: Select fielder
5. Click **Confirm Wicket**
6. Click **✓ Confirm Ball** to record

### Action Buttons
| Button | Action |
|--------|--------|
| **✓ Confirm Ball** | Record the current ball |
| **↩ Undo** | Undo last recorded ball |
| **End Innings** | End current innings |
| **End Match** | Manually end the match |

### Over Completion
- After 6 legal deliveries (excluding wides/no balls)
- System prompts for **New Bowler** selection
- Strike automatically rotates

### Innings Completion
Innings ends when:
- All overs completed
- 10 wickets fallen
- Manual "End Innings" clicked

### Innings Break
- System shows target for second innings
- Click **Start 2nd Innings** to continue
- Select new opening batsmen and bowler

### Match Completion
- Match ends after second innings
- Winner automatically determined
- Or click **End Match** to end manually

---

## 📺 Live Scoreboard (`/live-scoreboard`)

### Features
- **Auto-refresh** every 3 seconds
- **Multiple view modes**: Scorecard, Batsmen, Bowlers
- **Professional display** with team colors

### View Modes

#### Scorecard View
- Team scores with run rate
- Current batsmen at crease
- Current bowler stats
- Partnership information
- Recent overs display

#### Batsmen View
- All batsmen statistics
- Runs, balls, 4s, 6s, strike rate
- Status (batting/out/yet to bat)
- Dismissal details

#### Bowlers View
- All bowler statistics
- Overs, maidens, runs, wickets
- Economy rate
- Best figures

### Match Selection
- Dropdown to select from active matches
- Auto-selects live match if available
- URL parameter support: `/live-scoreboard?match=123`

---

## 📊 Scoring Rules Summary

### Wide Ball
```
Runs: +1 (minimum)
Ball Count: Does NOT count
Batsman Runs: No
Extra Type: Wide
```

### No Ball
```
Runs: +1 (minimum)
Ball Count: Does NOT count
Free Hit: Next ball (future enhancement)
Extra Type: No Ball
```

### Penalty Runs
```
Runs: +5
Ball Count: Does NOT count
Awarded by: Umpire decision
Reason: Illegal fielding, time wasting, etc.
```

### Boundary
```
Four: Ball crosses boundary after bounce
Six: Ball crosses boundary without bounce
Counted as: Batsman runs
```

---

## 🔌 Scoring API Endpoints

### Match Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/index.php` | Get all matches |
| POST | `/api/matches/index.php` | Create new match |
| PUT | `/api/matches/index.php` | Update match (start/end) |

### Playing XI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matches/playing_xi.php` | Set playing XI |
| GET | `/api/matches/playing_xi.php?match_id=X` | Get playing XI |

### Innings & Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/innings/index.php?match_id=X` | Get innings details |
| POST | `/api/innings/index.php` | Create/initialize innings |
| POST | `/api/innings/score.php` | Record a ball |
| DELETE | `/api/innings/score.php` | Undo last ball |

### Live Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/live.php?match_id=X` | Get live match data |

---

## 🎨 Scoring Interface Colors

| Element | Color | Meaning |
|---------|-------|---------|
| 🟢 Green | `#43e97b` | Boundary (4/6) |
| 🔴 Red | `#f5576c` | Wicket |
| 🟡 Yellow | `#f093fb` | Extras (Wide/No Ball) |
| ⚫ Gray | `#6c757d` | Dot ball |
| 🔵 Blue | `#4facfe` | Normal runs |

---

## 🔄 Complete Match Flow

```
┌─────────────────┐
│  MATCH SETUP    │
│  /match-setup   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Teams    │
│ Team 1 & Team 2 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Overs &     │
│ Venue           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Toss Winner &   │
│ Decision        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Playing  │
│ XI (Both Teams) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SCORING       │
│ /scoring/:id    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Start Match     │
│ Initialize      │
│ Innings         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Ball-by-Ball    │◄──────┐
│ Scoring         │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Wicket/Over     │───────┘
│ Changes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Innings End     │
│ Start 2nd       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Match Complete  │
│ Show Winner     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LIVE SCOREBOARD │
│ /live-scoreboard│
└─────────────────┘
```

---

## 🐛 Troubleshooting

**Teams not showing budget:**
- Run the app - teams auto-initialize on first API call
- Check backend console for MongoDB connection

**Players not appearing in auction:**
- Only "Available" status players appear
- Sold players don't show in auction list

**Budget validation error:**
- Check team's remaining budget
- Sold value cannot exceed remaining budget

**Popup not showing:**
- Check browser console for errors
- Ensure successful API response

## 🎉 Success!

Your SPL Cricket Auction System is now complete with:
- ✅ 4 Teams with budgets
- ✅ Full auction workflow
- ✅ Beautiful team rosters
- ✅ Real-time budget tracking
- ✅ Premier League design
- ✅ Complete player management

**Enjoy running your cricket tournament auction! 🏏🎊**
