# Quick build and restart
Write-Host "Building..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restarting PM2..." -ForegroundColor Yellow
    pm2 restart ticket-app
    Write-Host "Done!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
