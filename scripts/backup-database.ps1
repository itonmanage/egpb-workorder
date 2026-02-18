# Database Backup Script - Improved Version
# Backs up PostgreSQL database with 100% correct UTF-8 encoding for Thai characters
# ==================================================================================

param(
    [string]$BackupDir = "D:\EGPB-Backups\database"
)

# ===== CRITICAL: UTF-8 Encoding Configuration for Thai Language =====
# Set console to UTF-8 (Windows code page 65001)
chcp 65001 | Out-Null

# Configure PowerShell to use UTF-8 everywhere
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'
$OutputEncoding = [System.Text.Encoding]::UTF8

# Set PostgreSQL client encoding to UTF-8
$env:PGCLIENTENCODING = "UTF8"
$env:LC_ALL = "en_US.UTF-8"

# ===== Script Configuration =====
# Auto-detect PostgreSQL path
$pgDumpPaths = @(
    "D:\postgres\bin\pg_dump.exe",
    "F:\postgres\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
)

$pgDump = $null
foreach ($path in $pgDumpPaths) {
    if (Test-Path $path) {
        $pgDump = $path
        break
    }
}

if (-not $pgDump) {
    Write-Host "ERROR: pg_dump.exe not found!" -ForegroundColor Red
    Write-Host "Searched paths:" -ForegroundColor Yellow
    $pgDumpPaths | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    exit 1
}

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $BackupDir "egpb_ticket_backup_$timestamp.sql"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "สร้างโฟลเดอร์ backup: $BackupDir" -ForegroundColor Green
}

# Database connection details
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "egpb_ticket_db"
$dbUser = "egpb_admin"

# Set PostgreSQL password environment variable
$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   EGPB Database Backup (UTF-8/Thai)   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "การตั้งค่า:" -ForegroundColor Yellow
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  Backup file: $backupFile" -ForegroundColor White
Write-Host "  pg_dump: $pgDump" -ForegroundColor White
Write-Host "  Encoding: UTF-8" -ForegroundColor White
Write-Host ""

try {
    Write-Host "กำลัง backup database ด้วย UTF-8 encoding..." -ForegroundColor Cyan
    
    # Run pg_dump with explicit UTF-8 encoding
    # Using custom format (-F c) which preserves encoding best
    & $pgDump `
        -h $dbHost `
        -p $dbPort `
        -U $dbUser `
        -d $dbName `
        -F c `
        --encoding=UTF8 `
        --no-privileges `
        --no-owner `
        -b `
        -v `
        -f $backupFile `
        2>&1 | ForEach-Object {
            if ($_ -match "^pg_dump:") {
                Write-Host "  $_" -ForegroundColor Gray
            }
        }

    if ($LASTEXITCODE -eq 0) {
        $fileInfo = Get-Item $backupFile
        $fileSize = $fileInfo.Length / 1MB
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   Backup สำเร็จ!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "รายละเอียด:" -ForegroundColor Yellow
        Write-Host "  ไฟล์: $backupFile" -ForegroundColor White
        Write-Host "  ขนาด: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
        Write-Host "  เวลา: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
        Write-Host ""
        
        # Log backup with UTF-8 encoding
        $logFile = Join-Path $BackupDir "backup_log.txt"
        $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - สำเร็จ: $backupFile ($([math]::Round($fileSize, 2)) MB)"
        
        # Write log with UTF-8 BOM
        if (-not (Test-Path $logFile)) {
            # Create new file with UTF-8 BOM
            [System.IO.File]::WriteAllText($logFile, "$logEntry`r`n", [System.Text.UTF8Encoding]::new($true))
        } else {
            # Append to existing file
            Add-Content -Path $logFile -Value $logEntry -Encoding UTF8
        }
        
        # Show recent backups
        Write-Host "Backup ล่าสุด:" -ForegroundColor Yellow
        Get-ChildItem -Path $BackupDir -Filter "egpb_ticket_backup_*.sql" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 5 | 
            ForEach-Object {
                $size = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor Gray
            }
        
        Write-Host ""
        Write-Host "หมายเหตุ: การลบ backup อัตโนมัติถูกปิดไว้" -ForegroundColor Yellow
        Write-Host "กรุณาลบ backup เก่าด้วยตนเองหากต้องการประหยัดพื้นที่" -ForegroundColor Yellow
        Write-Host ""
        
        exit 0
    }
    else {
        throw "pg_dump ล้มเหลว (exit code: $LASTEXITCODE)"
    }
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   Backup ล้มเหลว!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Log error
    $logFile = Join-Path $BackupDir "backup_log.txt"
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - ล้มเหลว: $_"
    
    if (Test-Path $logFile) {
        Add-Content -Path $logFile -Value $logEntry -Encoding UTF8
    }
    
    exit 1
}
finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
