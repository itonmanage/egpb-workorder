param(
    [string]$OutputPath = ".\standalone-package"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Standalone Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/5] Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 2: Create output directory
Write-Host "[2/5] Creating output directory..." -ForegroundColor Yellow
if (Test-Path $OutputPath) {
    Remove-Item -Recurse -Force $OutputPath
}
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 3: Copy standalone server
Write-Host "[3/5] Copying standalone server..." -ForegroundColor Yellow
Copy-Item -Recurse -Force ".\.next\standalone\*" "$OutputPath\"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 4: Copy static files
Write-Host "[4/5] Copying static and public files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$OutputPath\.next\static" -Force | Out-Null
Copy-Item -Recurse -Force ".\.next\static\*" "$OutputPath\.next\static\"
Copy-Item -Recurse -Force ".\public" "$OutputPath\public"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 5: Copy other files
Write-Host "[5/5] Copying configuration files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$OutputPath\prisma" -Force | Out-Null
Copy-Item ".\prisma\schema.prisma" "$OutputPath\prisma\"
Copy-Item ".env.example" "$OutputPath\.env.example"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Package Creation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package location: $OutputPath" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd $OutputPath" -ForegroundColor White
Write-Host "2. Copy-Item .env.example .env" -ForegroundColor White
Write-Host "3. Edit .env file" -ForegroundColor White
Write-Host "4. npx prisma migrate deploy" -ForegroundColor White
Write-Host "5. npx prisma generate" -ForegroundColor White
Write-Host "6. node server.js" -ForegroundColor White
