# SPL Cricket Auction System

A complete MERN stack application for managing cricket tournament player auction system with player registration and authentication.

## Features

- 🔐 **Secure Login System** - Hardcoded authentication with local storage
- 🏏 **Player Registration** - Complete player profile with batting/bowling details
- 🎨 **Premier League UI** - Attractive, modern interface with cricket theme
- 📱 **Responsive Design** - Works perfectly on all devices
- 💾 **MongoDB Integration** - Cloud-based database storage

## Technology Stack

- **Frontend:** React.js, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Styling:** Custom CSS with modern gradients and animations

## Project Structure

```
spl-auction-official/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── playerController.js
│   ├── models/
│   │   └── Player.js
│   ├── routes/
│   │   └── playerRoutes.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   ├── index.html
    │   └── manifest.json
    ├── src/
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Login.css
    │   │   ├── Home.js
    │   │   ├── Home.css
    │   │   ├── PlayerRegistration.js
    │   │   └── PlayerRegistration.css
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── .gitignore
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The `.env` file is already configured with MongoDB URI

4. Start the backend server:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## Login Credentials

- **Username:** Sarasa
- **Password:** Sarasa@123

## Player Registration Form Fields

- **Player Name** - Full name of the player
- **Age** - Age between 10-60 years
- **Batting Side** - RHB (Right Hand Bat) or LHB (Left Hand Bat)
- **Bowling Side** - Right Arm or Left Arm
- **Bowling Style** - Fast Bowling, Medium Fast, Off Spin, or Leg Spin

## API Endpoints

### Player Routes

- **POST** `/api/players` - Register a new player
- **GET** `/api/players` - Get all registered players
- **GET** `/api/players/:id` - Get player by ID

## Features Breakdown

### Login Page
- Modern gradient background with cricket imagery
- Animated login form
- Local storage authentication
- Error handling for invalid credentials

### Home Page
- Attractive hero section with tournament branding
- Navigation header with logout functionality
- Statistics bar showing tournament info
- Feature cards highlighting system capabilities
- Responsive design for all screen sizes

### Player Registration
- Comprehensive form with all cricket profile fields
- Radio buttons for batting/bowling sides
- Dropdown for bowling styles
- Real-time form validation
- Success/error message display
- Auto-redirect after successful registration

## Development Notes

- Backend runs on port 5000
- Frontend runs on port 3000
- CORS is enabled for cross-origin requests
- MongoDB connection uses environment variable
- All routes are protected with authentication check

## Future Enhancements

- Player list/search functionality
- Live auction bidding system
- Team management
- Player statistics dashboard
- Match scheduling
- Admin panel

## License

This project is created for internal company use.

## Support

For any issues or questions, please contact the development team.

---

## Scoring – Wicket Workflow (Scoreboard Procedure)

This guide explains how to correctly mark wickets during live scoring and what the system does behind the scenes.

### Prerequisites
- Match is started and in `live` status.
- Opening batsmen and current bowler are selected (Start Innings modal).

### Record a Wicket
1. If the ball has extras, set them first:
   - Toggle Wide, No Ball, Bye, Leg Bye, Penalty as needed.
2. Click the `🎯 WICKET` button to open the Wicket modal.
3. Choose the dismissal type: `BOWLED`, `CAUGHT`, `LBW`, `RUN OUT`, `STUMPED`, or `HIT WICKET`.
4. If `RUN OUT`, select who is out: `Striker` or `Non‑Striker`.
5. If `CAUGHT`, `RUN OUT`, or `STUMPED`, select the fielder from the bowling team XI.
6. Click `Confirm Wicket`.
7. Click `✓ Confirm Ball` to submit the ball.

### After You Confirm
- The batter’s scorecard is updated to `out` with the dismissal details.
- Fall‑of‑Wicket is recorded with runs/over at the time of dismissal.
- Current partnership is ended; a new one starts when the next batter arrives.
- Strike rotation respects cricket rules:
  - Odd total runs on the ball swap strike.
  - Penalty runs do not affect strike.
  - Over completion swaps ends.
- If the dismissal vacates an end, the system raises `need_new_batsman` and shows the New Batsman modal.

### Select the Next Batsman
1. When prompted, choose a player from the `yet_to_bat` list.
2. The system automatically fills the correct end:
   - If the striker was out, the new batter is set as `striker`.
   - If the non‑striker was run out, the new batter is set as `non‑striker`.

### New Bowler (End of Over)
- When six legal balls complete an over, you’ll see `Select Next Bowler`.
- The previous bowler cannot bowl consecutive overs.

### Undo Last Ball
- Use `↩ Undo` to revert the previous delivery. It reverses batsman/bowler/innings totals and removes the ball.

### Notes & Constraints
- On a `No Ball`, dismissals like `bowled/caught/lbw` are not valid under standard rules; prefer `run out` (and stumped only on a wide). Use the modal accordingly.
- Wides/No Balls add extras; byes/leg byes are tracked separately.
- The Live Scoreboard “This Over” shows `W` for wickets and uses `Wd/Nb` notation for wides/no‑balls.

### Technical Reference (for maintainers)
- Frontend: scoring UI in [frontend/src/pages/Scoring.js](frontend/src/pages/Scoring.js).
- Backend: ball processing in [backend/api/innings/score.php](backend/api/innings/score.php).
- Next batsman selection: `set_batsman` via [backend/api/matches/live.php](backend/api/matches/live.php).
