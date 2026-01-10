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
