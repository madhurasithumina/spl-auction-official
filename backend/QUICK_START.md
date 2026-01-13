# Quick Start Guide - PHP Backend

## Step 1: Import Database Tables

1. Open **MySQL Workbench** or **phpMyAdmin**
2. Select the `spl_auction` database
3. Click on **SQL** tab or **Query** tab
4. Copy and paste this SQL:

```sql
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

5. Click **Execute** or **Go**
6. Verify tables are created (you should see `players` and `teams` in the left panel)

## Step 2: Setup IIS for PHP Backend

### Option A: Using IIS Manager (GUI)

1. **Open IIS Manager** (press Windows key, type "IIS")

2. **Create the website:**
   - Right-click **Sites** → **Add Website**
   - Site name: `SPL-Auction-Backend`
   - Physical path: `C:\spl\spl-auction-official\backend`
   - Port: `8084`
   - Click **OK**

3. **Configure Application Pool:**
   - Click **Application Pools** in left panel
   - Right-click **DefaultAppPool** → **Basic Settings**
   - Set **.NET CLR version** to: **No Managed Code**
   - Click **OK**

4. **Start the site:**
   - Go back to **Sites**
   - Right-click **SPL-Auction-Backend**
   - Click **Start**

### Option B: Using PowerShell as Administrator

1. Right-click **PowerShell** → **Run as Administrator**
2. Run these commands:

```powershell
Import-Module WebAdministration

# Remove existing site if exists
$siteName = "SPL-Auction-Backend"
if (Test-Path "IIS:\Sites\$siteName") {
    Remove-Website -Name $siteName
}

# Create new site
New-Website -Name $siteName `
    -PhysicalPath "C:\spl\spl-auction-official\backend" `
    -Port 8084 `
    -ApplicationPool "DefaultAppPool" `
    -Force

# Set application pool
Set-ItemProperty "IIS:\AppPools\DefaultAppPool" -Name managedRuntimeVersion -Value ""

# Start the site
Start-Website -Name $siteName

Write-Host "Backend started on http://localhost:8084" -ForegroundColor Green
```

## Step 3: Test the Backend

Open your browser and test:

1. **Root endpoint:**
   ```
   http://localhost:8084
   ```
   Should show: `{"message":"SPL Auction API is running"}`

2. **Get teams:**
   ```
   http://localhost:8084/api/teams
   ```
   Should show the 4 teams

3. **Get players:**
   ```
   http://localhost:8084/api/players
   ```
   Should show empty array `[]`

## Step 4: Configure Frontend

The frontend is already configured to use port 8084. Just make sure it's built:

```powershell
cd C:\spl\spl-auction-official\frontend
npm run build
```

## Troubleshooting

### PHP Not Working
- Install PHP: https://windows.php.net/download/
- Configure PHP in IIS (see PHP_SETUP.md)

### 404 Errors
- Install URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite
- Check web.config exists in backend folder

### Database Connection Error
- Verify MySQL is running
- Check credentials in `config/database.php`
- Test connection in MySQL Workbench

---

✅ Once complete, your PHP backend will be running on port 8084!
