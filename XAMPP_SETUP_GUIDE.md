# 🏏 SPL Auction System - XAMPP Setup Guide

## 📋 Overview
This application uses:
- **Backend:** PHP with MySQL (via XAMPP)
- **Frontend:** React.js
- **Database:** MySQL (spl_auction)

## ✅ Step-by-Step Setup Instructions

### 1. XAMPP Setup

#### Install XAMPP
1. Download XAMPP from: https://www.apachefriends.org/
2. Install XAMPP (default location: `C:\xampp`)
3. During installation, select **Apache** and **MySQL**

#### Start XAMPP Services
1. Open **XAMPP Control Panel**
2. Start **Apache** (should run on port 80 or 8081)
3. Start **MySQL** (should run on port 3306)

### 2. Backend Setup (PHP)

#### Copy Backend to htdocs
Your backend folder should be located at:
```
C:\xampp\htdocs\backend\
```

**Important:** Copy the entire `backend` folder from your project to `C:\xampp\htdocs\`

#### Verify Backend Files
Make sure these files exist:
```
C:\xampp\htdocs\backend\
├── index.php
├── web.config
├── config\database.php
├── controllers\
├── models\
├── api\
└── database\schema.sql
```

### 3. Database Setup (MySQL)

#### Method 1: Using phpMyAdmin (Recommended)

1. Open **phpMyAdmin**: http://localhost/phpmyadmin
2. Click **"Import"** tab
3. Choose file: `C:\xampp\htdocs\backend\database\schema.sql`
4. Click **"Go"** to execute

#### Method 2: Using MySQL Command Line

1. Open **Command Prompt** or **PowerShell**
2. Navigate to MySQL bin folder:
   ```powershell
   cd C:\xampp\mysql\bin
   ```
3. Run MySQL:
   ```powershell
   .\mysql.exe -u root -p
   ```
4. When prompted for password, press **Enter** (default: no password)
5. Create and setup database:
   ```sql
   CREATE DATABASE IF NOT EXISTS spl_auction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE spl_auction;
   SOURCE C:/xampp/htdocs/backend/database/schema.sql;
   ```
6. Verify tables:
   ```sql
   SHOW TABLES;
   SELECT * FROM teams;
   ```

#### Method 3: Direct SQL Execution

Copy and paste this into phpMyAdmin SQL tab:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS spl_auction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spl_auction;

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    batting_side ENUM('RHB', 'LHB') NOT NULL,
    age INT NOT NULL CHECK (age >= 10 AND age <= 60),
    bowling_side ENUM('RHB', 'LHB') NOT NULL,
    bowling_style ENUM('Fast Bowling', 'Medium Fast', 'Off Spin', 'Leg Spin') NOT NULL,
    sold_status ENUM('Sold', 'Unsold', 'Available') DEFAULT 'Available',
    sold_value DECIMAL(10, 2) DEFAULT 0.00,
    sold_team ENUM('Software', 'Marketing', 'Technical', 'Accounts', '') DEFAULT '',
    player_role ENUM('Captain', 'Manager', 'Regular', '') DEFAULT '',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sold_status (sold_status),
    INDEX idx_sold_team (sold_team),
    INDEX idx_registered_at (registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name ENUM('Software', 'Marketing', 'Technical', 'Accounts') NOT NULL UNIQUE,
    initial_budget DECIMAL(10, 2) DEFAULT 10000.00,
    remaining_budget DECIMAL(10, 2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team_name (team_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default teams
INSERT INTO teams (team_name, initial_budget, remaining_budget) VALUES
('Software', 10000.00, 10000.00),
('Marketing', 10000.00, 10000.00),
('Technical', 10000.00, 10000.00),
('Accounts', 10000.00, 10000.00)
ON DUPLICATE KEY UPDATE team_name = VALUES(team_name);
```

### 4. Test Backend API

Open your browser and test these URLs:

1. **Test PHP:**
   - http://localhost/backend/test-rewrite.php
   - Should display PHP version and database connection status

2. **Test API Endpoints:**
   - http://localhost/backend/api/teams.php
   - Should return JSON with 4 teams
   
   - http://localhost/backend/api/players.php
   - Should return JSON with empty array or players list

**Note:** If Apache is running on port 8081, use:
- http://localhost:8081/backend/api/teams.php
- http://localhost:8081/backend/api/players.php

### 5. Frontend Setup (React)

#### Install Node.js
1. Download Node.js from: https://nodejs.org/
2. Install LTS version (includes npm)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

#### Install Frontend Dependencies

1. Open **PowerShell** or **Command Prompt**
2. Navigate to frontend folder:
   ```powershell
   cd C:\spl\spl-auction-official\frontend
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```

#### Configure API URL

The frontend is already configured to use:
```
http://localhost:8081/backend/api/
```

If your XAMPP Apache runs on a different port (like 80), update all files in:
- `frontend/src/pages/PlayerRegistration.js`
- `frontend/src/pages/ViewPlayers.js`
- `frontend/src/pages/Teams.js`
- `frontend/src/pages/Reports.js`
- `frontend/src/pages/Auction.js`
- `frontend/src/pages/Admin.js`

Change from:
```javascript
http://localhost:8081/backend/api/
```
To:
```javascript
http://localhost/backend/api/
```

#### Start Frontend Development Server

```powershell
npm start
```

The frontend will open at: http://localhost:3000

## 🎯 Quick Test Checklist

- [ ] XAMPP Apache is running (green light in control panel)
- [ ] XAMPP MySQL is running (green light in control panel)
- [ ] Database `spl_auction` exists with `players` and `teams` tables
- [ ] Backend API responds: http://localhost/backend/api/teams.php
- [ ] Frontend is running: http://localhost:3000
- [ ] Can login with username: `Sarasa` password: `Sarasa@123`

## 🔐 Login Credentials

- **Username:** `Sarasa`
- **Password:** `Sarasa@123`

## 📱 Application Features

1. **Home** - Dashboard with statistics
2. **Player Registration** - Register new players
3. **View Players** - See all registered players
4. **Auction** - Conduct player auction
5. **Teams** - View team details and budgets
6. **Reports** - Export data to Excel/PDF
7. **Admin** - Reset database and manage data

## 🐛 Troubleshooting

### Backend Issues

**Issue:** "Database connection failed"
- **Solution:** Check MySQL is running in XAMPP
- Verify database credentials in `backend/config/database.php`
- Default: user=`root`, password=`` (empty)

**Issue:** "404 Not Found" for API calls
- **Solution:** Check Apache is running
- Verify backend folder is in `C:\xampp\htdocs\backend\`
- Check Apache port in XAMPP (80 or 8081)

**Issue:** URL Rewriting not working
- **Solution:** Enable mod_rewrite in Apache
  1. Open `C:\xampp\apache\conf\httpd.conf`
  2. Find: `#LoadModule rewrite_module modules/mod_rewrite.so`
  3. Remove `#` to uncomment
  4. Restart Apache

### Frontend Issues

**Issue:** API connection errors
- **Solution:** Verify Apache port matches URL in React files
- Check CORS headers are enabled in PHP

**Issue:** "npm install" errors
- **Solution:** Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Use Node.js LTS version

**Issue:** Port 3000 already in use
- **Solution:** Kill the process or use different port:
  ```powershell
  $env:PORT=3001; npm start
  ```

## 📞 Support

If you encounter issues:
1. Check XAMPP error logs: `C:\xampp\apache\logs\error.log`
2. Check browser console for JavaScript errors (F12)
3. Verify all services are running
4. Ensure database has data (check teams table)

## 🎉 Success!

Once everything is set up:
1. Open http://localhost:3000
2. Login with credentials
3. Start registering players
4. Initialize teams and conduct auction!

Good luck with your SPL Cricket Auction! 🏆
