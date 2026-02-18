# Rollback Script สำหรับ Next.js Standalone Deployment (Windows)
# ใช้สำหรับ rollback ไปยัง version ก่อนหน้า

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

$AppDir = Get-Location
$BackupDir = Join-Path $AppDir "backups"
$LogDir = Join-Path $AppDir "logs"
$LogFile = Join-Path $LogDir "rollback.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-ColorOutput "`n=========================================" -Color Cyan
Write-ColorOutput "  Next.js Standalone Rollback Script" -Color Cyan
Write-ColorOutput "=========================================" -Color Cyan
Write-ColorOutput ""

###############################################################################
# แสดงรายการ backup ที่มี
###############################################################################
Write-Log "📋 รายการ backup ที่มีอยู่:"
Write-ColorOutput ""

if (-not (Test-Path $BackupDir) -or (Get-ChildItem $BackupDir).Count -eq 0) {
    Write-Error-Log "ไม่พบ backup ใดๆ ใน $BackupDir"
    exit 1
}

# แสดงรายการ backup พร้อมหมายเลข
$backups = Get-ChildItem -Path $BackupDir -Directory | Sort-Object CreationTime -Descending
$count = 1

foreach ($backup in $backups) {
    $backupName = $backup.Name -replace "backup_", "" -replace "_", " "
    $backupSize = "{0:N2} MB" -f ((Get-ChildItem -Path $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)
    Write-ColorOutput "[$count] $backupName (Size: $backupSize)" -Color Blue
    $count++
}

Write-ColorOutput ""

###############################################################################
# เลือก backup ที่จะ rollback
###############################################################################
$choice = Read-Host "เลือกหมายเลข backup ที่ต้องการ rollback (1-$($backups.Count))"

if (-not ($choice -match '^\d+$') -or [int]$choice -lt 1 -or [int]$choice -gt $backups.Count) {
    Write-Error-Log "หมายเลขไม่ถูกต้อง"
    exit 1
}

$selectedBackup = $backups[[int]$choice - 1]
$backupPath = $selectedBackup.FullName

Write-Log "📦 เลือก backup: $($selectedBackup.Name)"

###############################################################################
# ยืนยันการ rollback
###############################################################################
Write-ColorOutput ""
Write-Warning-Log "⚠️  คำเตือน: การ rollback จะเปลี่ยน application code กลับไปยัง version เก่า"
Write-Warning-Log "    Database จะไม่ถูกแตะต้อง"
Write-ColorOutput ""

$confirm = Read-Host "ยืนยันการ rollback? (yes/no)"

if ($confirm -ne "yes") {
    Write-Log "ยกเลิกการ rollback"
    exit 0
}

###############################################################################
# ตรวจสอบ database migration
###############################################################################
Write-Log "🔍 ตรวจสอบ database migration..."

$migrateStatus = npx prisma migrate status 2>&1 | Out-String
if ($migrateStatus -match "pending") {
    Write-Warning-Log "⚠️  พบ database migration ที่ยังไม่ได้ apply!"
    Write-Warning-Log "    Version เก่าอาจไม่รองรับ database schema ปัจจุบัน"
    Write-Warning-Log "    คุณอาจต้อง rollback database migration ด้วยตนเอง"
    Write-ColorOutput ""
    
    $continueConfirm = Read-Host "ต้องการดำเนินการต่อไหม? (yes/no)"
    
    if ($continueConfirm -ne "yes") {
        Write-Log "ยกเลิกการ rollback"
        exit 0
    }
}

###############################################################################
# Backup version ปัจจุบันก่อน rollback
###############################################################################
Write-Log "💾 สำรองข้อมูล version ปัจจุบันก่อน rollback..."

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$currentBackup = Join-Path $BackupDir "before_rollback_$timestamp"

if (Test-Path ".next") {
    New-Item -ItemType Directory -Force -Path $currentBackup | Out-Null
    Copy-Item -Path ".next" -Destination $currentBackup -Recurse -Force
    
    if (Test-Path "ecosystem.config.js") {
        Copy-Item -Path "ecosystem.config.js" -Destination $currentBackup -Force
    }
    
    Write-Success "สำรองข้อมูล version ปัจจุบันไปที่: $currentBackup"
}

###############################################################################
# ทำการ rollback
###############################################################################
Write-Log "🔄 กำลัง rollback..."

# ลบ .next directory ปัจจุบัน
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Success "ลบ .next directory เก่า"
}

# คัดลอก backup กลับมา
$backupNextPath = Join-Path $backupPath ".next"
if (Test-Path $backupNextPath) {
    Copy-Item -Path $backupNextPath -Destination "." -Recurse -Force
    Write-Success "คัดลอก .next จาก backup"
}
else {
    Write-Error-Log "ไม่พบ .next directory ใน backup"
    exit 1
}

# คัดลอก ecosystem.config.js ถ้ามี
$backupConfigPath = Join-Path $backupPath "ecosystem.config.js"
if (Test-Path $backupConfigPath) {
    Copy-Item -Path $backupConfigPath -Destination "." -Force
    Write-Success "คัดลอก ecosystem.config.js จาก backup"
}

###############################################################################
# Reload PM2
###############################################################################
Write-Log "🔄 Reloading PM2..."

$pm2List = pm2 list 2>&1 | Out-String
if ($pm2List -match "ticket-app") {
    pm2 reload ecosystem.config.js --update-env
    Write-Success "PM2 reload สำเร็จ"
}
else {
    Write-Warning-Log "ไม่พบ PM2 process กำลัง start ใหม่..."
    pm2 start ecosystem.config.js
}

pm2 save

###############################################################################
# ตรวจสอบสถานะ
###############################################################################
Write-Log "🔍 ตรวจสอบสถานะ application..."

Start-Sleep -Seconds 3

$pm2Status = pm2 list 2>&1 | Out-String
if ($pm2Status -match "online") {
    Write-Success "✅ Rollback สำเร็จ!"
    pm2 list
}
else {
    Write-Error-Log "❌ Application ไม่สามารถ start ได้หลัง rollback"
    Write-Error-Log "กรุณาตรวจสอบ logs: pm2 logs ticket-app"
    exit 1
}

###############################################################################
# เสร็จสิ้น
###############################################################################
Write-ColorOutput "`n=========================================" -Color Green
Write-ColorOutput "🎉 Rollback สำเร็จ!" -Color Green
Write-ColorOutput "=========================================" -Color Green
Write-ColorOutput ""

Write-Log "📊 ตรวจสอบ application:"
Write-Log "   - PM2 status: pm2 status"
Write-Log "   - PM2 logs: pm2 logs ticket-app"
Write-Log "   - Application URL: http://localhost:3000"
Write-ColorOutput ""

Write-Log "💾 Version ปัจจุบันถูกสำรองไว้ที่: $currentBackup"
Write-ColorOutput ""
