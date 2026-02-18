# Deployment Script สำหรับ Next.js Standalone Build (Windows)
# ใช้สำหรับ deploy บน Windows Server/VM

param(
    [switch]$SkipBackup = $false,
    [switch]$Force = $false
)

# สี สำหรับ output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-ColorOutput $logMessage -Color Cyan
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-Success {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] ✓ $Message"
    Write-ColorOutput $logMessage -Color Green
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-Error-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] ✗ $Message"
    Write-ColorOutput $logMessage -Color Red
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-Warning-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] ⚠ $Message"
    Write-ColorOutput $logMessage -Color Yellow
    Add-Content -Path $LogFile -Value $logMessage
}

# ตัวแปร configuration
$AppName = "ticket-form-app"
$AppDir = Get-Location
$BackupDir = Join-Path $AppDir "backups"
$LogDir = Join-Path $AppDir "logs"
$LogFile = Join-Path $LogDir "deployment.log"

# สร้าง directories ที่จำเป็น
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-ColorOutput "`n=========================================" -Color Cyan
Write-ColorOutput "  Next.js Standalone Deployment Script" -Color Cyan
Write-ColorOutput "=========================================" -Color Cyan
Write-ColorOutput ""

###############################################################################
# ขั้นตอนที่ 1: ตรวจสอบ prerequisites
###############################################################################
Write-Log "🔍 ตรวจสอบ prerequisites..."

# ตรวจสอบ Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
}
catch {
    Write-Error-Log "Node.js ไม่ได้ติดตั้ง กรุณาติดตั้ง Node.js ก่อน"
    exit 1
}

# ตรวจสอบ npm
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
}
catch {
    Write-Error-Log "npm ไม่ได้ติดตั้ง"
    exit 1
}

# ตรวจสอบ PM2
try {
    $pm2Version = pm2 --version
    Write-Success "PM2 version: $pm2Version"
}
catch {
    Write-Warning-Log "PM2 ไม่ได้ติดตั้ง กำลังติดตั้ง PM2..."
    npm install -g pm2
    Write-Success "ติดตั้ง PM2 สำเร็จ"
}

###############################################################################
# ขั้นตอนที่ 2: ตรวจสอบ database migration
###############################################################################
Write-Log "🔍 ตรวจสอบ database migration..."

$migrateStatus = npx prisma migrate status 2>&1 | Out-String
if ($migrateStatus -match "pending") {
    Write-Warning-Log "⚠️  พบ database migration ที่ยังไม่ได้ apply!"
    Write-Warning-Log "    ถ้า rollback อาจต้อง rollback database ด้วย"
    
    if (-not $Force) {
        $continue = Read-Host "ต้องการดำเนินการต่อไหม? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Log "ยกเลิกการ deploy"
            exit 0
        }
    }
}

###############################################################################
# ขั้นตอนที่ 3: Backup version เก่า
###############################################################################
if (-not $SkipBackup) {
    Write-Log "💾 สำรองข้อมูล version เก่า..."

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = Join-Path $BackupDir "backup_$timestamp"

    if (Test-Path ".next") {
        New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
        Copy-Item -Path ".next" -Destination $backupPath -Recurse -Force
        
        if (Test-Path "ecosystem.config.js") {
            Copy-Item -Path "ecosystem.config.js" -Destination $backupPath -Force
        }
        
        Write-Success "สำรองข้อมูลไปที่: $backupPath"
    }
    else {
        Write-Warning-Log "ไม่พบ .next directory (อาจเป็นการ deploy ครั้งแรก)"
    }
}

###############################################################################
# ขั้นตอนที่ 4: Install dependencies
###############################################################################
Write-Log "📦 ติดตั้ง dependencies..."

npm ci --production=false
if ($LASTEXITCODE -ne 0) {
    Write-Error-Log "ติดตั้ง dependencies ล้มเหลว"
    exit 1
}
Write-Success "ติดตั้ง dependencies สำเร็จ"

###############################################################################
# ขั้นตอนที่ 5: Build standalone
###############################################################################
Write-Log "🔨 Building Next.js standalone..."

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error-Log "Build ล้มเหลว"
    exit 1
}

if (-not (Test-Path ".next\standalone")) {
    Write-Error-Log "Build ล้มเหลว: ไม่พบ .next\standalone directory"
    Write-Error-Log "กรุณาตรวจสอบว่า next.config.ts มี output: 'standalone'"
    exit 1
}

Write-Success "Build standalone สำเร็จ"

###############################################################################
# ขั้นตอนที่ 6: Copy static files และ public
###############################################################################
Write-Log "📁 คัดลอก static files..."

# Copy static files
if (Test-Path ".next\static") {
    $staticDest = ".next\standalone\.next\static"
    New-Item -ItemType Directory -Force -Path $staticDest | Out-Null
    Copy-Item -Path ".next\static\*" -Destination $staticDest -Recurse -Force
    Write-Success "คัดลอก static files สำเร็จ"
}

# Copy public folder
if (Test-Path "public") {
    $publicDest = ".next\standalone\public"
    New-Item -ItemType Directory -Force -Path $publicDest | Out-Null
    Copy-Item -Path "public\*" -Destination $publicDest -Recurse -Force
    Write-Success "คัดลอก public folder สำเร็จ"
}

###############################################################################
# ขั้นตอนที่ 7: อัพเดท PM2 config
###############################################################################
Write-Log "⚙️  อัพเดท PM2 configuration..."

$pm2Config = @"
module.exports = {
  apps: [
    {
      name: 'ticket-app',
      script: '.next/standalone/server.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
"@

Set-Content -Path "ecosystem.config.js" -Value $pm2Config -Encoding UTF8
Write-Success "อัพเดท PM2 config สำเร็จ"

###############################################################################
# ขั้นตอนที่ 8: Reload PM2 (Zero Downtime)
###############################################################################
Write-Log "🔄 Reloading PM2 (zero downtime)..."

# ตรวจสอบว่า PM2 มี process รันอยู่หรือไม่
$pm2List = pm2 list 2>&1 | Out-String
if ($pm2List -match "ticket-app") {
    Write-Log "พบ process เก่า กำลัง reload..."
    pm2 reload ecosystem.config.js --update-env
}
else {
    Write-Log "ไม่พบ process เก่า กำลัง start ใหม่..."
    pm2 start ecosystem.config.js
}

if ($LASTEXITCODE -ne 0) {
    Write-Error-Log "PM2 reload ล้มเหลว"
    exit 1
}

# Save PM2 configuration
pm2 save
Write-Success "PM2 reload สำเร็จ"

###############################################################################
# ขั้นตอนที่ 9: ตรวจสอบสถานะ
###############################################################################
Write-Log "🔍 ตรวจสอบสถานะ application..."

Start-Sleep -Seconds 3

$pm2Status = pm2 list 2>&1 | Out-String
if ($pm2Status -match "online") {
    Write-Success "✅ Application รันสำเร็จ!"
    pm2 list
}
else {
    Write-Error-Log "❌ Application ไม่สามารถ start ได้"
    Write-Error-Log "กำลัง rollback..."
    
    # Rollback
    if ($timestamp -and (Test-Path $backupPath)) {
        if (Test-Path ".next") {
            Remove-Item -Path ".next" -Recurse -Force
        }
        Copy-Item -Path "$backupPath\.next" -Destination "." -Recurse -Force
        pm2 reload ecosystem.config.js
        Write-Warning-Log "Rollback สำเร็จ กลับไปใช้ version เก่า"
    }
    
    exit 1
}

###############################################################################
# ขั้นตอนที่ 10: ทำความสะอาด backup เก่า (เก็บไว้แค่ 5 versions)
###############################################################################
Write-Log "🧹 ทำความสะอาด backup เก่า..."

$backups = Get-ChildItem -Path $BackupDir -Directory | Sort-Object CreationTime -Descending
if ($backups.Count -gt 5) {
    $backups | Select-Object -Skip 5 | Remove-Item -Recurse -Force
}

Write-Success "เก็บ backup ไว้ล่าสุด 5 versions"

###############################################################################
# เสร็จสิ้น
###############################################################################
Write-ColorOutput "`n=========================================" -Color Green
Write-ColorOutput "🎉 Deployment สำเร็จ!" -Color Green
Write-ColorOutput "=========================================" -Color Green
Write-ColorOutput ""

Write-Log "📊 ตรวจสอบ logs:"
Write-Log "   - PM2 logs: pm2 logs ticket-app"
Write-Log "   - Error logs: Get-Content logs\pm2-error.log -Tail 50"
Write-Log "   - Output logs: Get-Content logs\pm2-out.log -Tail 50"
Write-ColorOutput ""

Write-Log "🔧 คำสั่งที่เป็นประโยชน์:"
Write-Log "   - ดู status: pm2 status"
Write-Log "   - ดู monitoring: pm2 monit"
Write-Log "   - Restart: pm2 restart ticket-app"
Write-Log "   - Stop: pm2 stop ticket-app"
Write-ColorOutput ""

if (-not $SkipBackup -and $backupPath) {
    Write-Log "💾 Backup location: $backupPath"
    Write-ColorOutput ""
}
