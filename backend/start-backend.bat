@echo off
echo ================================================
echo Starting SPL Backend Server
echo ================================================
echo.
echo Starting PHP server on port 8081...
echo Access APIs at: http://localhost:8081/api/
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

cd /d "%~dp0"
php -S localhost:8081

pause
