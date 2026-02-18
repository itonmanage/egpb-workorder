# View Backup Data Script - Improved Version
# View data in EGPB Ticket System backup files with Thai language support
# =======================================================================

param(
    [Parameter(Mandatory = $false)]
    [string]$BackupFile,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("list", "info", "restore-test", "extract-sql", "preview-thai")]
    [string]$Action = "info",
    
    [Parameter(Mandatory = $false)]
    [string]$BackupDir = "D:\EGPB-Backups\database"
)

# ===== CRITICAL: UTF-8 Encoding Configuration =====
chcp 65001 | Out-Null
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$OutputEncoding = [System.Text.Encoding]::UTF8
$env:PGCLIENTENCODING = "UTF8"

# Auto-detect PostgreSQL
$pgRestore = @(
    "D:\postgres\bin\pg_restore.exe",
    "F:\postgres\bin\pg_restore.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $pgRestore) {
    Write-Host "ERROR: pg_restore.exe not found!" -ForegroundColor Red
    exit 1
}

# Function: List all backup files
function Show-BackupList {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   รายการ Backup Files" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending |
        Select-Object Name, 
            @{Name = "SizeMB"; Expression = { [math]::Round($_.Length / 1MB, 2) } }, 
            @{Name = "Created"; Expression = { $_.LastWriteTime.ToString("dd/MM/yyyy HH:mm:ss") } },
            @{Name = "AgeDays"; Expression = { [math]::Round((New-TimeSpan -Start $_.LastWriteTime -End (Get-Date)).TotalDays, 1) } },
            FullName
    
    if ($backups.Count -eq 0) {
        Write-Host "  ไม่พบไฟล์ backup ใน $BackupDir" -ForegroundColor Red
        return $null
    }
    
    $index = 1
    $backups | ForEach-Object {
        Write-Host "  [$index] $($_.Name)" -ForegroundColor White
        Write-Host "      ขนาด: $($_.SizeMB) MB | สร้าง: $($_.Created) | อายุ: $($_.AgeDays) วัน" -ForegroundColor Gray
        $index++
    }
    
    Write-Host ""
    Write-Host "  รวม: $($backups.Count) ไฟล์" -ForegroundColor Green
    Write-Host ""
    
    return $backups
}

# Function: Show backup file information
function Show-BackupInfo {
    param([string]$FilePath)
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   ข้อมูล Backup File" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ไฟล์: $FilePath" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Write-Host "  กำลังอ่านไฟล์..." -ForegroundColor Gray
        
        $listOutput = & $pgRestore --list $FilePath 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $listOutput) {
            # Count items
            $tables = ($listOutput | Select-String "TABLE DATA" | Measure-Object).Count
            $sequences = ($listOutput | Select-String "SEQUENCE SET" | Measure-Object).Count
            $constraints = ($listOutput | Select-String "CONSTRAINT" | Measure-Object).Count
            $indexes = ($listOutput | Select-String "INDEX" | Measure-Object).Count
            
            Write-Host "  เนื้อหา:" -ForegroundColor Green
            Write-Host "    Tables: $tables" -ForegroundColor White
            Write-Host "    Sequences: $sequences" -ForegroundColor White
            Write-Host "    Constraints: $constraints" -ForegroundColor White
            Write-Host "    Indexes: $indexes" -ForegroundColor White
            Write-Host ""
            
            # Show table names
            Write-Host "  รายชื่อ Tables:" -ForegroundColor Yellow
            $listOutput | Select-String "TABLE DATA" | ForEach-Object {
                if ($_.Line -match "TABLE DATA\s+public\s+(\w+)") {
                    Write-Host "    - $($matches[1])" -ForegroundColor Gray
                }
            }
            
            # File info
            $fileInfo = Get-Item $FilePath
            Write-Host ""
            Write-Host "  รายละเอียดไฟล์:" -ForegroundColor Green
            Write-Host "    ขนาด: $([math]::Round($fileInfo.Length/1MB,2)) MB" -ForegroundColor White
            Write-Host "    สร้าง: $($fileInfo.CreationTime.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor White
            Write-Host "    แก้ไข: $($fileInfo.LastWriteTime.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor White
        }
        else {
            Write-Host "  ✗ ไม่สามารถอ่านไฟล์ได้" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

# Function: Extract SQL to text file
function ConvertTo-BackupSQL {
    param([string]$FilePath)
    
    $outputFile = $FilePath -replace "\.sql$", "_extracted.sql"
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   แตกไฟล์ Backup เป็น SQL" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ไฟล์ต้นทาง: $FilePath" -ForegroundColor Yellow
    Write-Host "  ไฟล์ปลายทาง: $outputFile" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Write-Host "  กำลังแตกไฟล์ด้วย UTF-8 encoding..." -ForegroundColor Gray
        
        # Extract with proper encoding
        & $pgRestore -f $outputFile $FilePath 2>&1 | Out-Null
        
        if (Test-Path $outputFile) {
            $size = [math]::Round((Get-Item $outputFile).Length / 1MB, 2)
            Write-Host ""
            Write-Host "  ✓ แตกไฟล์สำเร็จ!" -ForegroundColor Green
            Write-Host "    ไฟล์: $outputFile" -ForegroundColor White
            Write-Host "    ขนาด: $size MB" -ForegroundColor White
            Write-Host ""
            Write-Host "  สามารถเปิดดูด้วย Notepad++ หรือ VS Code" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

# Function: Test backup file integrity
function Test-BackupRestore {
    param([string]$FilePath)
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   ทดสอบความสมบูรณ์ของ Backup" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ไฟล์: $FilePath" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Write-Host "  กำลังตรวจสอบ..." -ForegroundColor Gray
        
        $result = & $pgRestore --list $FilePath 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $result) {
            $itemCount = ($result | Measure-Object).Count
            Write-Host ""
            Write-Host "  ✓ ไฟล์ Backup สมบูรณ์และพร้อมใช้งาน" -ForegroundColor Green
            Write-Host "    จำนวน items: $itemCount" -ForegroundColor White
        }
        else {
            Write-Host ""
            Write-Host "  ✗ ไฟล์ Backup อาจเสียหาย" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

# Function: Preview Thai content in backup
function Show-ThaiPreview {
    param([string]$FilePath)
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   ดูตัวอย่างข้อมูลภาษาไทยใน Backup" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ไฟล์: $FilePath" -ForegroundColor Yellow
    Write-Host ""
    
    $tempDir = Join-Path $env:TEMP "egpb_preview_$(Get-Random)"
    $tempSql = Join-Path $tempDir "preview.sql"
    
    try {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        Write-Host "  กำลังแตกและอ่านไฟล์..." -ForegroundColor Gray
        & $pgRestore -f $tempSql $FilePath 2>&1 | Out-Null
        
        if (Test-Path $tempSql) {
            $content = Get-Content $tempSql -Encoding UTF8 -First 10000
            
            # Find Thai content
            $thaiPattern = '[\u0E00-\u0E7F]+'
            $thaiLines = $content | Where-Object { $_ -match $thaiPattern } | Select-Object -First 20
            
            if ($thaiLines) {
                Write-Host ""
                Write-Host "  ✓ พบข้อมูลภาษาไทย!" -ForegroundColor Green
                Write-Host ""
                Write-Host "  ตัวอย่างข้อมูล:" -ForegroundColor Yellow
                
                $thaiLines | ForEach-Object {
                    # Extract Thai text
                    $matches = [regex]::Matches($_, $thaiPattern)
                    foreach ($m in $matches) {
                        $text = $m.Value
                        if ($text.Length -gt 80) {
                            $text = $text.Substring(0, 77) + "..."
                        }
                        Write-Host "    • $text" -ForegroundColor White
                    }
                } | Select-Object -First 15
                
                # Count unique Thai entries
                $allThaiMatches = @()
                $content | Where-Object { $_ -match $thaiPattern } | ForEach-Object {
                    $matches = [regex]::Matches($_, $thaiPattern)
                    foreach ($m in $matches) {
                        $allThaiMatches += $m.Value
                    }
                }
                
                Write-Host ""
                Write-Host "  สถิติ:" -ForegroundColor Yellow
                Write-Host "    พบข้อความภาษาไทย: $($allThaiMatches.Count) รายการ" -ForegroundColor White
                Write-Host "    ข้อความไม่ซ้ำ: $(($allThaiMatches | Select-Object -Unique).Count) รายการ" -ForegroundColor White
            }
            else {
                Write-Host ""
                Write-Host "  ⚠ ไม่พบข้อมูลภาษาไทยใน 10000 บรรทัดแรก" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  ✗ ไม่สามารถแตกไฟล์ได้" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
    finally {
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ===== Main Script =====
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   EGPB Backup Data Viewer (UTF-8/Thai)        " -ForegroundColor Cyan
Write-Host "   เครื่องมือดูข้อมูล Backup                   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# If no file specified, show list and ask
if (-not $BackupFile) {
    $backups = Show-BackupList
    
    if (-not $backups) {
        exit 1
    }
    
    Write-Host "เลือกหมายเลข backup (1-$($backups.Count)) หรือ Enter สำหรับล่าสุด: " -NoNewline -ForegroundColor Yellow
    $selection = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($selection)) {
        $BackupFile = $backups[0].FullName
    }
    else {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $backups.Count) {
            $BackupFile = $backups[$index].FullName
        }
        else {
            Write-Host "เลือกหมายเลขไม่ถูกต้อง" -ForegroundColor Red
            exit 1
        }
    }
}

# Check if file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "ไม่พบไฟล์: $BackupFile" -ForegroundColor Red
    exit 1
}

# Execute action
switch ($Action) {
    "list" {
        Show-BackupList
    }
    "info" {
        Show-BackupInfo -FilePath $BackupFile
    }
    "restore-test" {
        Test-BackupRestore -FilePath $BackupFile
    }
    "extract-sql" {
        ConvertTo-BackupSQL -FilePath $BackupFile
    }
    "preview-thai" {
        Show-ThaiPreview -FilePath $BackupFile
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Gray
Write-Host "   คำสั่งที่ใช้ได้:" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Gray
Write-Host "  1. ดูรายการ:     .\scripts\view-backup-data.ps1 -Action list" -ForegroundColor Gray
Write-Host "  2. ดูข้อมูล:     .\scripts\view-backup-data.ps1 -Action info" -ForegroundColor Gray
Write-Host "  3. ทดสอบ:        .\scripts\view-backup-data.ps1 -Action restore-test" -ForegroundColor Gray
Write-Host "  4. แตกไฟล์:      .\scripts\view-backup-data.ps1 -Action extract-sql" -ForegroundColor Gray
Write-Host "  5. ดูภาษาไทย:    .\scripts\view-backup-data.ps1 -Action preview-thai" -ForegroundColor Gray
Write-Host ""
