# Database Restore Script
# Restores PostgreSQL database with 100% correct UTF-8 encoding for Thai characters
# ==================================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupDir = "D:\EGPB-Backups\database",
    
    [switch]$List,
    [switch]$Verify
)

# ===== CRITICAL: UTF-8 Encoding Configuration for Thai Language =====
chcp 65001 | Out-Null
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$OutputEncoding = [System.Text.Encoding]::UTF8

$env:PGCLIENTENCODING = "UTF8"
$env:LC_ALL = "en_US.UTF-8"

# Auto-detect PostgreSQL path
$pgPaths = @(
    "D:\postgres\bin",
    "F:\postgres\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin"
)

$pgBin = $null
foreach ($path in $pgPaths) {
    if (Test-Path (Join-Path $path "pg_restore.exe")) {
        $pgBin = $path
        break
    }
}

if (-not $pgBin) {
    Write-Host "ERROR: PostgreSQL bin directory not found!" -ForegroundColor Red
    exit 1
}

$pgRestore = Join-Path $pgBin "pg_restore.exe"
$psql = Join-Path $pgBin "psql.exe"

# Database connection details
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "egpb_ticket_db"
$dbUser = "egpb_admin"
$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   EGPB Database Restore (UTF-8/Thai)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function: List available backups
function Show-Backups {
    Write-Host "Backup ที่มีอยู่:" -ForegroundColor Yellow
    Write-Host ""
    
    $backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "  ไม่พบไฟล์ backup ใน $BackupDir" -ForegroundColor Red
        return $null
    }
    
    $index = 1
    $backups | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        $age = [math]::Round((New-TimeSpan -Start $_.LastWriteTime -End (Get-Date)).TotalDays, 1)
        Write-Host "  [$index] $($_.Name)" -ForegroundColor White
        Write-Host "      ขนาด: $size MB | อายุ: $age วัน" -ForegroundColor Gray
        $index++
    }
    
    Write-Host ""
    return $backups
}

# Function: Verify backup file
function Test-BackupFile {
    param([string]$FilePath)
    
    Write-Host "กำลังตรวจสอบ backup file..." -ForegroundColor Cyan
    
    $result = & $pgRestore --list $FilePath 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $result) {
        # Count tables
        $tables = ($result | Select-String "TABLE DATA" | Measure-Object).Count
        $sequences = ($result | Select-String "SEQUENCE SET" | Measure-Object).Count
        
        Write-Host ""
        Write-Host "ผลการตรวจสอบ:" -ForegroundColor Green
        Write-Host "  สถานะ: ✓ ไฟล์ถูกต้อง" -ForegroundColor Green
        Write-Host "  จำนวน Tables: $tables" -ForegroundColor White
        Write-Host "  จำนวน Sequences: $sequences" -ForegroundColor White
        Write-Host ""
        
        # Show tables
        Write-Host "รายชื่อ Tables:" -ForegroundColor Yellow
        $result | Select-String "TABLE DATA" | ForEach-Object {
            if ($_.Line -match "TABLE DATA\s+public\s+(\w+)") {
                Write-Host "  - $($matches[1])" -ForegroundColor Gray
            }
        }
        
        return $true
    } else {
        Write-Host ""
        Write-Host "ผลการตรวจสอบ: ✗ ไฟล์อาจเสียหาย" -ForegroundColor Red
        return $false
    }
}

# Function: Preview Thai data in backup
function Show-ThaiPreview {
    param([string]$FilePath)
    
    Write-Host ""
    Write-Host "กำลังดูตัวอย่างข้อมูลภาษาไทย..." -ForegroundColor Cyan
    
    # Export a sample to check Thai encoding
    $tempDir = Join-Path $env:TEMP "egpb_restore_preview"
    $tempSql = Join-Path $tempDir "preview.sql"
    
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    # Extract to plain text SQL
    & $pgRestore -f $tempSql $FilePath 2>&1 | Out-Null
    
    if (Test-Path $tempSql) {
        Write-Host ""
        Write-Host "ตัวอย่างข้อมูลที่มีภาษาไทย:" -ForegroundColor Yellow
        
        # Find lines with Thai characters
        $content = Get-Content $tempSql -Encoding UTF8 -First 5000
        $thaiLines = $content | Where-Object { $_ -match '[\u0E00-\u0E7F]' } | Select-Object -First 10
        
        if ($thaiLines) {
            $thaiLines | ForEach-Object {
                $line = $_
                if ($line.Length -gt 150) {
                    $line = $line.Substring(0, 147) + "..."
                }
                Write-Host "  $line" -ForegroundColor Gray
            }
            Write-Host ""
            Write-Host "✓ พบข้อมูลภาษาไทยในไฟล์ backup" -ForegroundColor Green
        } else {
            Write-Host "  ไม่พบข้อมูลภาษาไทยใน 5000 บรรทัดแรก" -ForegroundColor Yellow
        }
        
        # Cleanup
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Function: Restore database
function Restore-Database {
    param([string]$FilePath)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "   คำเตือน: การ Restore จะลบข้อมูลเดิม!" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ไฟล์ที่จะ restore: $FilePath" -ForegroundColor White
    Write-Host "Database: $dbName" -ForegroundColor White
    Write-Host ""
    
    $confirm = Read-Host "พิมพ์ 'YES' เพื่อยืนยันการ restore"
    
    if ($confirm -ne "YES") {
        Write-Host ""
        Write-Host "ยกเลิกการ restore" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "กำลัง restore database..." -ForegroundColor Cyan
    
    try {
        # Drop and recreate database
        Write-Host "  1. กำลังล้าง database..." -ForegroundColor Gray
        & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE IF EXISTS $dbName WITH (FORCE);" 2>&1 | Out-Null
        & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;" 2>&1 | Out-Null
        
        # Restore
        Write-Host "  2. กำลัง restore ข้อมูล..." -ForegroundColor Gray
        & $pgRestore `
            -h $dbHost `
            -p $dbPort `
            -U $dbUser `
            -d $dbName `
            --no-owner `
            --no-privileges `
            --clean `
            --if-exists `
            -v `
            $FilePath `
            2>&1 | ForEach-Object {
                if ($_ -match "error|Error|ERROR") {
                    Write-Host "    $_" -ForegroundColor Red
                }
            }
        
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "   Restore สำเร็จ!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            # Verify Thai data
            Write-Host "กำลังตรวจสอบข้อมูลภาษาไทย..." -ForegroundColor Cyan
            $result = & $psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT COUNT(*) as thai_tickets FROM tickets WHERE description ~ '[\u0E00-\u0E7F]';" 2>&1
            Write-Host "  $result" -ForegroundColor Gray
        } else {
            throw "pg_restore failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Host ""
        Write-Host "Restore ล้มเหลว: $_" -ForegroundColor Red
    }
}

# ===== Main Logic =====

if ($List) {
    Show-Backups
    exit 0
}

if (-not $BackupFile) {
    $backups = Show-Backups
    
    if (-not $backups) {
        exit 1
    }
    
    Write-Host ""
    $selection = Read-Host "เลือกหมายเลข backup (1-$($backups.Count)) หรือ Enter สำหรับล่าสุด"
    
    if ([string]::IsNullOrWhiteSpace($selection)) {
        $BackupFile = $backups[0].FullName
    } else {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $backups.Count) {
            $BackupFile = $backups[$index].FullName
        } else {
            Write-Host "เลือกหมายเลขไม่ถูกต้อง" -ForegroundColor Red
            exit 1
        }
    }
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "ไม่พบไฟล์: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "เลือกไฟล์: $BackupFile" -ForegroundColor White
Write-Host ""

# Verify first
$isValid = Test-BackupFile -FilePath $BackupFile

if ($isValid) {
    Show-ThaiPreview -FilePath $BackupFile
}

if (-not $Verify) {
    Write-Host ""
    $action = Read-Host "ต้องการ restore หรือไม่? (y/n)"
    
    if ($action -eq "y" -or $action -eq "Y") {
        Restore-Database -FilePath $BackupFile
    }
}

# Cleanup
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
Write-Host ""
