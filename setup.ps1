# SPL Auction Setup Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SPL CRICKET AUCTION SYSTEM - SETUP" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Write-Host "Setting up Backend..." -ForegroundColor Green
Set-Location -Path "backend"
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Frontend Setup
Set-Location -Path ".."
Write-Host "Setting up Frontend..." -ForegroundColor Green
Set-Location -Path "frontend"
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Frontend setup complete!" -ForegroundColor Green
Write-Host ""

# Back to root
Set-Location -Path ".."

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Backend:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Frontend (in a new terminal):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "   Username: Sarasa" -ForegroundColor White
Write-Host "   Password: Sarasa@123" -ForegroundColor White
Write-Host ""
Write-Host "Happy Coding! 🏏" -ForegroundColor Magenta
