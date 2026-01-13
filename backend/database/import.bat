@echo off
echo Importing database schema...
echo.
echo Please run this SQL in MySQL Workbench or phpMyAdmin:
echo.
echo USE spl_auction;
echo.
type "%~dp0schema.sql"
echo.
echo.
echo === OR Copy the schema.sql content and paste in MySQL Workbench ===
echo.
pause
