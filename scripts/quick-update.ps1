# ========================================
# Quick Update Script for Production
# ========================================
# Run this to quickly build and update production

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Production Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build and package
Write-Host "Building standalone package..." -ForegroundColor Yellow
.\scripts\create-standalone-package.ps1 -Compress

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create package!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Package Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the .zip file to production server" -ForegroundColor White
Write-Host "2. Extract on production server" -ForegroundColor White
Write-Host "3. Run: .\scripts\deploy-standalone.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or for local testing:" -ForegroundColor Yellow
Write-Host "  cd standalone-package" -ForegroundColor White
Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
Write-Host "  # Edit .env" -ForegroundColor White
Write-Host "  npx prisma migrate deploy" -ForegroundColor White
Write-Host "  npx prisma generate" -ForegroundColor White
Write-Host "  node server.js" -ForegroundColor White
