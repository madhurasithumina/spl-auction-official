@echo off
echo ================================================
echo SPL Tournament System - Database Setup
echo ================================================
echo.

REM Get MySQL credentials
set /p MYSQL_USER="Enter MySQL username (default: root): " || set MYSQL_USER=root
set /p MYSQL_PASS="Enter MySQL password: "
set DB_NAME=spl_auction

echo.
echo Creating tournament tables...
echo.

REM Run tournament schema
mysql -u %MYSQL_USER% -p%MYSQL_PASS% %DB_NAME% < tournament_schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo SUCCESS! Tournament system installed.
    echo ================================================
    echo.
    echo Created tables:
    echo   - tournaments
    echo   - points_table
    echo   - match_stages
    echo   - team_match_stats
    echo   - playoff_bracket
    echo.
    echo Views created:
    echo   - v_points_table
    echo   - v_match_results
    echo.
    echo Default tournament initialized:
    echo   - SPL Championship 2026
    echo   - All teams added to points table
    echo.
    echo Next steps:
    echo 1. Start backend: cd .. ^& php -S localhost:8000
    echo 2. Start frontend: cd ../../frontend ^& npm start
    echo 3. Go to http://localhost:3000/#/points-table
    echo.
) else (
    echo.
    echo ================================================
    echo ERROR: Failed to create tournament tables
    echo ================================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Username and password are correct
    echo 3. Database 'spl_auction' exists
    echo.
)

pause
