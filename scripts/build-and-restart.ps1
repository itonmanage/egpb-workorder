# ========================================
# Build and Restart Script
# ========================================
# Quick script to build and restart the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build and Restart Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/2] Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "Please check the errors above." -ForegroundColor Yellow
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Restart PM2
Write-Host "[2/2] Restarting PM2 application..." -ForegroundColor Yellow
pm2 restart ticket-app

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "PM2 restart failed!" -ForegroundColor Red
    Write-Host "App might not be running in PM2." -ForegroundColor Yellow
    Write-Host "Try: pm2 start .next/standalone/server.js --name ticket-app" -ForegroundColor Cyan
    exit 1
}

Write-Host "Application restarted successfully!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application is now running with latest build." -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  pm2 status          - Check status" -ForegroundColor White
Write-Host "  pm2 logs ticket-app - View logs" -ForegroundColor White
Write-Host "  pm2 monit           - Monitor resources" -ForegroundColor White
