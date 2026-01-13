# SPL Auction PHP Backend - Setup Guide

## Requirements

1. **PHP 7.4 or higher** with PDO MySQL extension
2. **MySQL 5.7 or higher**
3. **IIS with PHP** or **Apache with mod_rewrite**

## Database Setup

### Step 1: Create Database

1. Open **MySQL Command Line** or **phpMyAdmin**
2. Run the SQL script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   
   OR copy and paste the contents of `database/schema.sql` into phpMyAdmin

### Step 2: Verify Database

```sql
USE spl_auction;
SHOW TABLES;
-- Should show: players, teams
```

## IIS Configuration

### Install PHP on IIS

1. Download PHP from: https://windows.php.net/download/
2. Extract to: `C:\PHP`
3. Install **IIS URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite
4. Configure PHP in IIS:
   - Open IIS Manager
   - Click on your server → Handler Mappings
   - Add Module Mapping:
     - Request path: `*.php`
     - Module: `FastCgiModule`
     - Executable: `C:\PHP\php-cgi.exe`
     - Name: `PHP_via_FastCGI`

### Create IIS Site

1. Open IIS Manager
2. Right-click Sites → Add Website
   - Site name: `SPL-Auction-Backend-PHP`
   - Physical path: `C:\spl\spl-auction-official\backend`
   - Port: `8084`
3. Click OK

### Enable PHP Extensions

Edit `C:\PHP\php.ini`:
```ini
extension=pdo_mysql
extension=mysqli
extension=mbstring
```

Restart IIS:
```powershell
iisreset
```

## Testing

### Test Database Connection
```bash
# Create a test file: test-db.php
<?php
try {
    $pdo = new PDO("mysql:host=localhost;port=3306;dbname=spl_auction", "root", "");
    echo "Database connected successfully!";
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>
```

### Test API Endpoints

1. **Root endpoint:**
   ```
   http://localhost:8084
   ```
   Expected: `{"message":"SPL Auction API is running"}`

2. **Get all players:**
   ```
   http://localhost:8084/api/players
   ```

3. **Get all teams:**
   ```
   http://localhost:8084/api/teams
   ```

## Frontend Configuration

Update frontend `.env` file:
```
REACT_APP_API_URL=http://localhost:8084
PORT=8085
```

Rebuild frontend:
```powershell
cd C:\spl\spl-auction-official\frontend
npm run build
```

## API Endpoints

### Players
- `POST /api/players` - Register new player
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `DELETE /api/players/truncate` - Delete all players

### Teams
- `POST /api/teams/initialize` - Initialize teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:name` - Get team by name
- `POST /api/teams/auction` - Auction player to team
- `PUT /api/teams/:teamName/reset` - Reset team budget
- `DELETE /api/teams/truncate` - Reset all teams

## Database Configuration

Edit `config/database.php` if needed:
```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'spl_auction');
define('DB_USER', 'root');
define('DB_PASS', '');
```

## Troubleshooting

### 500 Internal Server Error
- Check PHP error logs: `C:\PHP\logs\php_errors.log`
- Enable error display in `php.ini`:
  ```ini
  display_errors = On
  error_reporting = E_ALL
  ```

### Database Connection Failed
- Verify MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Verify credentials in `config/database.php`

### CORS Errors
- Check `Access-Control-Allow-Origin` headers in `index.php`
- For specific origin, change:
  ```php
  header('Access-Control-Allow-Origin: http://localhost:8085');
  ```

## File Structure

```
backend/
├── config/
│   └── database.php          # Database configuration
├── controllers/
│   ├── PlayerController.php  # Player endpoints logic
│   └── TeamController.php    # Team endpoints logic
├── models/
│   ├── Player.php           # Player model & queries
│   └── Team.php             # Team model & queries
├── database/
│   └── schema.sql           # MySQL database schema
├── index.php                # Main router/entry point
└── web.config              # IIS configuration
```

## Success Checklist

- [ ] MySQL installed and running
- [ ] Database `spl_auction` created
- [ ] PHP installed and configured in IIS
- [ ] PDO MySQL extension enabled
- [ ] IIS site created on port 8084
- [ ] URL Rewrite module installed
- [ ] API root endpoint works
- [ ] Frontend can connect to backend

---

Your PHP backend is now ready to use with MySQL!
