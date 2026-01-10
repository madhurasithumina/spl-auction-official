# 🏏 SPL Cricket Auction System - Quick Start Guide

## Overview
This is a complete MERN stack application for managing cricket tournament player auctions with an attractive Premier League themed interface.

## 🚀 Quick Start (Easiest Way)

### Option 1: Using PowerShell Scripts

1. **Install Dependencies:**
   ```powershell
   .\setup.ps1
   ```

2. **Start the Application:**
   ```powershell
   .\start.ps1
   ```

This will automatically:
- Start the backend server on http://localhost:5000
- Start the frontend server on http://localhost:3000
- Open the app in your browser

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

## 🔐 Login Credentials

- **Username:** `Sarasa`
- **Password:** `Sarasa@123`

## 📋 Features

### ✅ Implemented Features

1. **Authentication System**
   - Login page with hardcoded credentials
   - Local storage for session management
   - Protected routes

2. **Home Page**
   - Premier League themed design
   - Navigation header with logout
   - Hero section with tournament branding
   - Statistics display
   - Feature cards
   - Fully responsive design

3. **Player Registration**
   - Complete registration form with:
     - Player Name
     - Age (10-60)
     - Batting Side (RHB/LHB)
     - Bowling Side (Right Arm/Left Arm)
     - Bowling Style (Fast/Medium Fast/Off Spin/Leg Spin)
   - Form validation
   - Success/error messages
   - MongoDB integration

4. **Backend API**
   - RESTful API endpoints
   - MongoDB Atlas integration
   - Player CRUD operations
   - CORS enabled

## 🎨 Design Features

- Modern gradient backgrounds
- Cricket-themed animations
- Premium Premier League aesthetics
- High-quality cricket imagery
- Responsive for all devices
- Smooth transitions and hover effects

## 📁 Project Structure

```
spl-auction-official/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── .env               # Environment variables
│   └── server.js          # Entry point
│
├── frontend/               # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── pages/         # Page components
│       │   ├── Login.js
│       │   ├── Home.js
│       │   └── PlayerRegistration.js
│       └── App.js         # Main app component
│
├── setup.ps1              # Setup script
├── start.ps1              # Start script
└── README.md              # Documentation
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/players` | Register new player |
| GET | `/api/players` | Get all players |
| GET | `/api/players/:id` | Get player by ID |

## 🛠️ Technology Stack

**Frontend:**
- React 18.2
- React Router DOM 6.15
- Axios 1.5
- Custom CSS with animations

**Backend:**
- Node.js
- Express 4.18
- MongoDB with Mongoose 7.5
- CORS enabled

**Database:**
- MongoDB Atlas (Cloud)

## 📱 Pages

1. **Login Page** (`/login`)
   - Modern gradient design
   - Animated cricket ball logo
   - Form validation
   - Error handling

2. **Home Page** (`/`)
   - Hero section with call-to-action
   - Tournament statistics
   - Feature showcase
   - Navigation header

3. **Player Registration** (`/register-player`)
   - Comprehensive form
   - Real-time validation
   - Success feedback
   - Info panel with guidelines

## 🎯 User Flow

1. Open the app → Redirects to Login
2. Enter credentials (Sarasa/Sarasa@123)
3. View Home page with tournament info
4. Click "Player Registration" button
5. Fill out player form
6. Submit → Player saved to MongoDB
7. Auto-redirect to home page

## 💡 Tips

- Make sure both backend and frontend are running
- Backend must start before frontend for API calls
- Check MongoDB connection in backend console
- Clear browser cache if authentication issues occur

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 5000 is available
- Verify MongoDB URI in .env file
- Run `npm install` in backend folder

**Frontend won't start:**
- Check if port 3000 is available
- Run `npm install` in frontend folder
- Clear node_modules and reinstall

**Can't login:**
- Use exact credentials: Sarasa / Sarasa@123
- Check browser console for errors
- Clear local storage

**Player registration fails:**
- Ensure backend is running
- Check backend console for errors
- Verify MongoDB connection

## 📝 Next Steps / Future Enhancements

- [ ] View all registered players
- [ ] Player search and filter
- [ ] Live auction bidding system
- [ ] Team management
- [ ] Auction history
- [ ] Admin dashboard
- [ ] Player statistics
- [ ] Match scheduling

## 🤝 Support

For issues or questions, check:
1. README.md in root folder
2. Backend README.md
3. Frontend README.md
4. Console logs in both terminals

## 📄 License

Internal company use only.

---

**Enjoy your SPL Cricket Auction System! 🏏🎉**
