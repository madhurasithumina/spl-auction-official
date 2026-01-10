# SPL Auction - Start Both Servers

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  STARTING SPL CRICKET AUCTION SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Green
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start"

Write-Host "Both servers are starting in separate windows..." -ForegroundColor Green
Write-Host "Frontend will open in your browser automatically" -ForegroundColor Cyan
