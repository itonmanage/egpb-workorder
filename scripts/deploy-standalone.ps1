# ========================================
# Deploy Standalone Package Script
# ========================================
# Run this script on the PRODUCTION server after copying the package

param(
    [string]$PackagePath = ".\standalone-package",
    [string]$DeployPath = "C:\apps\ticket-app",
    [bool]$Backup = $true,
    [bool]$RestartService = $true
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Standalone Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if package exists
if (-not (Test-Path $PackagePath)) {
    Write-Host "Error: Package not found at $PackagePath" -ForegroundColor Red
    exit 1
}

# Step 1: Backup existing deployment (if exists)
if ($Backup -and (Test-Path $DeployPath)) {
    Write-Host "[1/7] Creating backup of existing deployment..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$DeployPath-backup-$timestamp"
    Copy-Item -Recurse -Force $DeployPath $backupPath
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Stop existing service (if running)
if ($RestartService) {
    Write-Host "[2/7] Stopping existing service..." -ForegroundColor Yellow
    try {
        pm2 stop ticket-app 2>$null
        Write-Host "✓ Service stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "! No existing service found (this is OK for first deployment)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Step 3: Create/Clear deployment directory
Write-Host "[3/7] Preparing deployment directory..." -ForegroundColor Yellow
if (Test-Path $DeployPath) {
    # Preserve .env if it exists
    $envBackup = $null
    if (Test-Path "$DeployPath\.env") {
        $envBackup = Get-Content "$DeployPath\.env"
    }
    
    Remove-Item -Recurse -Force $DeployPath
    New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
    
    # Restore .env
    if ($envBackup) {
        $envBackup | Out-File -FilePath "$DeployPath\.env" -Encoding UTF8
        Write-Host "✓ Preserved existing .env file" -ForegroundColor Green
    }
}
else {
    New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
}
Write-Host "✓ Deployment directory ready" -ForegroundColor Green
Write-Host ""

# Step 4: Copy new package
Write-Host "[4/7] Copying new package..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "$PackagePath\*" "$DeployPath\"
Write-Host "✓ Package copied" -ForegroundColor Green
Write-Host ""

# Step 5: Check environment configuration
Write-Host "[5/7] Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path "$DeployPath\.env")) {
    Write-Host "! Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "  Creating from template..." -ForegroundColor Yellow
    Copy-Item "$DeployPath\.env.example" "$DeployPath\.env"
    Write-Host "  ⚠ IMPORTANT: Edit .env file with production values!" -ForegroundColor Red
    $needsEnvConfig = $true
}
else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    $needsEnvConfig = $false
}
Write-Host ""

# Step 6: Setup database
Write-Host "[6/7] Setting up database..." -ForegroundColor Yellow
Push-Location $DeployPath
try {
    Write-Host "  Running migrations..." -ForegroundColor Cyan
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "! Migration failed - check database connection" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "  Generating Prisma client..." -ForegroundColor Cyan
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "! Prisma generate failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "✓ Database setup complete" -ForegroundColor Green
}
catch {
    Write-Host "! Database setup failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Step 7: Start service
if ($RestartService -and -not $needsEnvConfig) {
    Write-Host "[7/7] Starting service..." -ForegroundColor Yellow
    Push-Location $DeployPath
    try {
        pm2 start server.js --name ticket-app
        pm2 save
        Write-Host "✓ Service started" -ForegroundColor Green
    }
    catch {
        Write-Host "! Failed to start with PM2, trying direct node..." -ForegroundColor Yellow
        Write-Host "  Run manually: node server.js" -ForegroundColor Cyan
    }
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment location: $DeployPath" -ForegroundColor White
Write-Host ""

if ($needsEnvConfig) {
    Write-Host "⚠ NEXT STEPS REQUIRED:" -ForegroundColor Red
    Write-Host "1. Edit $DeployPath\.env with production values" -ForegroundColor Yellow
    Write-Host "2. Run: cd $DeployPath" -ForegroundColor Yellow
    Write-Host "3. Run: pm2 start server.js --name ticket-app" -ForegroundColor Yellow
    Write-Host ""
}
else {
    Write-Host "✓ Application is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  pm2 status          - Check status" -ForegroundColor White
    Write-Host "  pm2 logs ticket-app - View logs" -ForegroundColor White
    Write-Host "  pm2 restart ticket-app - Restart app" -ForegroundColor White
    Write-Host "  pm2 stop ticket-app - Stop app" -ForegroundColor White
    Write-Host ""
}

if ($Backup -and (Test-Path "$DeployPath-backup-*")) {
    Write-Host "Backup available at: $backupPath" -ForegroundColor Cyan
    Write-Host "To rollback: Copy-Item -Recurse -Force '$backupPath\*' '$DeployPath\'" -ForegroundColor Cyan
}
