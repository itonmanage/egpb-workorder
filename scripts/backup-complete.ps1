# Complete Backup Script - Improved Version
# Backs up database, uploaded files, and configuration with 100% UTF-8 Thai support
# ===================================================================================

param(
    [string]$BackupDir = "D:\EGPB-Backups"
)

# ===== CRITICAL: UTF-8 Encoding Configuration for Thai Language =====
chcp 65001 | Out-Null
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'
$OutputEncoding = [System.Text.Encoding]::UTF8

$env:PGCLIENTENCODING = "UTF8"
$env:LC_ALL = "en_US.UTF-8"

# Auto-detect paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Auto-detect PostgreSQL
$pgDump = @(
    "D:\postgres\bin\pg_dump.exe",
    "F:\postgres\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $pgDump) {
    Write-Host "ERROR: pg_dump.exe not found!" -ForegroundColor Red
    exit 1
}

# Timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$fullBackupDir = Join-Path $BackupDir "full\backup_$timestamp"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   EGPB Complete Backup (UTF-8/Thai Support)   " -ForegroundColor Cyan
Write-Host "   การ Backup ระบบ Ticket อย่างสมบูรณ์         " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "เวลา: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "โฟลเดอร์: $fullBackupDir" -ForegroundColor Gray
Write-Host ""

# Create backup directories
New-Item -ItemType Directory -Path $fullBackupDir -Force | Out-Null

# Track success/failure
$results = @{
    Database = $false
    Files = $false
    Config = $false
}
$totalSize = 0

# ===== 1. Backup Database =====
Write-Host "[1/3] กำลัง backup database ด้วย UTF-8 encoding..." -ForegroundColor Yellow
$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
$dbBackupFile = Join-Path $fullBackupDir "database.sql"

try {
    & $pgDump `
        -h localhost `
        -p 5432 `
        -U egpb_admin `
        -d egpb_ticket_db `
        -F c `
        -b `
        --encoding=UTF8 `
        --no-owner `
        --no-privileges `
        -f $dbBackupFile `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dbBackupFile)) {
        $dbSize = (Get-Item $dbBackupFile).Length / 1MB
        $totalSize += $dbSize
        Write-Host "  ✓ Database backup สำเร็จ ($([math]::Round($dbSize, 2)) MB)" -ForegroundColor Green
        $results.Database = $true
    } else {
        throw "pg_dump failed"
    }
}
catch {
    Write-Host "  ✗ Database backup ล้มเหลว: $_" -ForegroundColor Red
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# ===== 2. Backup Uploaded Files =====
Write-Host "[2/3] กำลัง backup ไฟล์ที่อัปโหลด..." -ForegroundColor Yellow

# Try multiple possible locations
$uploadsSources = @(
    (Join-Path $projectRoot "public\uploads"),
    "D:\ticket-form-app\public\uploads",
    "F:\ticket-form-app\public\uploads"
)

$uploadsSource = $uploadsSources | Where-Object { Test-Path $_ } | Select-Object -First 1
$uploadsBackup = Join-Path $fullBackupDir "uploads"

if ($uploadsSource) {
    try {
        Copy-Item -Path $uploadsSource -Destination $uploadsBackup -Recurse -Force
        $files = Get-ChildItem -Path $uploadsBackup -Recurse -File -ErrorAction SilentlyContinue
        $fileCount = ($files | Measure-Object).Count
        $filesSize = ($files | Measure-Object -Property Length -Sum).Sum / 1MB
        $totalSize += $filesSize
        Write-Host "  ✓ Files backup สำเร็จ ($fileCount ไฟล์, $([math]::Round($filesSize, 2)) MB)" -ForegroundColor Green
        $results.Files = $true
    }
    catch {
        Write-Host "  ✗ Files backup ล้มเหลว: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ ไม่พบโฟลเดอร์ uploads" -ForegroundColor Yellow
    $results.Files = $true  # Not a failure if folder doesn't exist
}

# ===== 3. Backup Configuration =====
Write-Host "[3/3] กำลัง backup ไฟล์ตั้งค่า..." -ForegroundColor Yellow
$configBackup = Join-Path $fullBackupDir "config"
New-Item -ItemType Directory -Path $configBackup -Force | Out-Null

$configFiles = @(
    (Join-Path $projectRoot ".env.local"),
    (Join-Path $projectRoot "ecosystem.config.js"),
    (Join-Path $projectRoot "package.json"),
    (Join-Path $projectRoot "prisma\schema.prisma")
)

$copiedCount = 0
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $configBackup -Force
        $copiedCount++
    }
}
Write-Host "  ✓ Config backup สำเร็จ ($copiedCount ไฟล์)" -ForegroundColor Green
$results.Config = $true

# ===== 4. Create README with UTF-8 BOM =====
$readmeContent = @"
EGPB Ticket System - Complete Backup
การ Backup ระบบ Ticket อย่างสมบูรณ์
=====================================

เวลา: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Timestamp: $timestamp

เนื้อหา:
- Database: PostgreSQL dump (custom format, UTF-8)
- Uploaded Files: รูปภาพและไฟล์แนบทั้งหมด
- Configuration: .env.local, ecosystem.config.js, package.json, schema.prisma

คำสั่ง Restore:
--------------
1. Database:
   .\scripts\restore-database.ps1 -BackupFile "$dbBackupFile"

2. Files:
   Copy-Item -Path "$uploadsBackup" -Destination "D:\ticket-form-app\public\" -Recurse -Force

3. Config:
   Copy-Item -Path "$configBackup\*" -Destination "D:\ticket-form-app\" -Force

หมายเหตุ:
- Backup นี้รองรับภาษาไทย 100%
- ใช้ UTF-8 encoding ทั้งหมด
"@

$readmePath = Join-Path $fullBackupDir "README.txt"
[System.IO.File]::WriteAllText($readmePath, $readmeContent, [System.Text.UTF8Encoding]::new($true))

# ===== Summary =====
$totalSize = [math]::Round((Get-ChildItem -Path $fullBackupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   สรุปผลการ Backup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  โฟลเดอร์: $fullBackupDir" -ForegroundColor White
Write-Host "  ขนาดรวม: $totalSize MB" -ForegroundColor White
Write-Host ""
Write-Host "  รายการ:" -ForegroundColor Yellow
Write-Host "    $(if($results.Database){'✓'}else{'✗'}) Database" -ForegroundColor $(if($results.Database){'Green'}else{'Red'})
Write-Host "    $(if($results.Files){'✓'}else{'✗'}) Uploaded Files" -ForegroundColor $(if($results.Files){'Green'}else{'Red'})
Write-Host "    $(if($results.Config){'✓'}else{'✗'}) Configuration" -ForegroundColor $(if($results.Config){'Green'}else{'Red'})
Write-Host ""

# Log backup
$logFile = Join-Path $BackupDir "backup_log.txt"
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Complete backup สำเร็จ: $totalSize MB - $fullBackupDir"

if (-not (Test-Path $logFile)) {
    [System.IO.File]::WriteAllText($logFile, "$logEntry`r`n", [System.Text.UTF8Encoding]::new($true))
} else {
    Add-Content -Path $logFile -Value $logEntry -Encoding UTF8
}

# List recent backups
$fullBackupParent = Join-Path $BackupDir "full"
if (Test-Path $fullBackupParent) {
    Write-Host "Backup ล่าสุด:" -ForegroundColor Yellow
    Get-ChildItem -Path $fullBackupParent -Directory | 
        Sort-Object CreationTime -Descending | 
        Select-Object -First 5 | 
        ForEach-Object {
            $size = [math]::Round((Get-ChildItem -Path $_.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor Gray
        }
}

Write-Host ""
Write-Host "หมายเหตุ: การลบ backup อัตโนมัติถูกปิดไว้" -ForegroundColor Yellow
Write-Host "กรุณาลบ backup เก่าด้วยตนเองหากต้องการประหยัดพื้นที่" -ForegroundColor Yellow
Write-Host ""

if ($results.Database -and $results.Config) {
    Write-Host "✓ Complete backup สำเร็จ!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠ Backup เสร็จสิ้นแต่มีบางส่วนล้มเหลว" -ForegroundColor Yellow
    exit 1
}
