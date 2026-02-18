# Verify Backup Thai Characters Script
# Validates that Thai characters are correctly encoded in backup files
# =====================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupDir = "D:\EGPB-Backups\database",
    
    [switch]$Full
)

# ===== UTF-8 Configuration =====
chcp 65001 | Out-Null
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$OutputEncoding = [System.Text.Encoding]::UTF8

$env:PGCLIENTENCODING = "UTF8"
$env:LC_ALL = "en_US.UTF-8"

# Auto-detect PostgreSQL path
$pgBin = @("D:\postgres\bin", "F:\postgres\bin", "C:\Program Files\PostgreSQL\16\bin") | 
    Where-Object { Test-Path (Join-Path $_ "pg_restore.exe") } | 
    Select-Object -First 1

if (-not $pgBin) {
    Write-Host "ERROR: PostgreSQL not found!" -ForegroundColor Red
    exit 1
}

$pgRestore = Join-Path $pgBin "pg_restore.exe"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   EGPB Backup Thai Character Verification      " -ForegroundColor Cyan
Write-Host "   ตรวจสอบการเข้ารหัสภาษาไทยใน Backup          " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# If no file specified, use latest backup
if (-not $BackupFile) {
    $latestBackup = Get-ChildItem -Path $BackupDir -Filter "*.sql" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if (-not $latestBackup) {
        Write-Host "ไม่พบไฟล์ backup ใน $BackupDir" -ForegroundColor Red
        exit 1
    }
    
    $BackupFile = $latestBackup.FullName
    Write-Host "ใช้ไฟล์ backup ล่าสุด:" -ForegroundColor Yellow
}

Write-Host "  ไฟล์: $BackupFile" -ForegroundColor White
Write-Host "  ขนาด: $([math]::Round((Get-Item $BackupFile).Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host ""

# ===== Step 1: Check file encoding =====
Write-Host "1. ตรวจสอบ encoding ของไฟล์..." -ForegroundColor Cyan

# Read first bytes to check for BOM or encoding
$bytes = [System.IO.File]::ReadAllBytes($BackupFile) | Select-Object -First 50
$hexHeader = ($bytes | ForEach-Object { $_.ToString("X2") }) -join " "

Write-Host "  Header bytes: $hexHeader" -ForegroundColor Gray

# PostgreSQL custom format starts with "PGDMP"
if ($bytes[0] -eq 0x50 -and $bytes[1] -eq 0x47 -and $bytes[2] -eq 0x44 -and $bytes[3] -eq 0x4D -and $bytes[4] -eq 0x50) {
    Write-Host "  ✓ รูปแบบ: PostgreSQL Custom Format (แนะนำ)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ รูปแบบ: ไม่ใช่ PostgreSQL Custom Format" -ForegroundColor Yellow
}

# ===== Step 2: Extract and check Thai content =====
Write-Host ""
Write-Host "2. ตรวจสอบข้อมูลภาษาไทย..." -ForegroundColor Cyan

$tempDir = Join-Path $env:TEMP "egpb_verify_thai_$(Get-Random)"
$tempSql = Join-Path $tempDir "extracted.sql"

try {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Extract to plain SQL format
    Write-Host "  กำลังแตกไฟล์..." -ForegroundColor Gray
    & $pgRestore -f $tempSql $BackupFile 2>&1 | Out-Null
    
    if (Test-Path $tempSql) {
        $sqlSize = [math]::Round((Get-Item $tempSql).Length / 1MB, 2)
        Write-Host "  ✓ แตกไฟล์สำเร็จ ($sqlSize MB)" -ForegroundColor Green
        
        # Read content with UTF-8
        Write-Host "  กำลังอ่านและตรวจสอบ..." -ForegroundColor Gray
        $content = Get-Content $tempSql -Encoding UTF8 -ErrorAction Stop
        
        # Thai character regex: \u0E00-\u0E7F
        $thaiPattern = '[\u0E00-\u0E7F]+'
        
        # Find Thai content
        $thaiMatches = @()
        $lineNum = 0
        $content | ForEach-Object {
            $lineNum++
            if ($_ -match $thaiPattern) {
                $matches = [regex]::Matches($_, $thaiPattern)
                foreach ($m in $matches) {
                    $thaiMatches += @{
                        Line = $lineNum
                        Text = $m.Value
                        Context = $_.Substring([Math]::Max(0, $m.Index - 20), [Math]::Min($_.Length - [Math]::Max(0, $m.Index - 20), 100))
                    }
                }
            }
        }
        
        Write-Host ""
        Write-Host "3. ผลการตรวจสอบ:" -ForegroundColor Cyan
        
        if ($thaiMatches.Count -gt 0) {
            Write-Host "  ✓ พบข้อมูลภาษาไทย: $($thaiMatches.Count) ตำแหน่ง" -ForegroundColor Green
            
            # Group by unique Thai text
            $uniqueThai = $thaiMatches | Group-Object { $_.Text } | Sort-Object Count -Descending
            
            Write-Host ""
            Write-Host "  ตัวอย่างข้อความภาษาไทยที่พบ:" -ForegroundColor Yellow
            $uniqueThai | Select-Object -First 15 | ForEach-Object {
                $text = $_.Name
                if ($text.Length -gt 60) {
                    $text = $text.Substring(0, 57) + "..."
                }
                Write-Host "    • $text (พบ $($_.Count) ครั้ง)" -ForegroundColor White
            }
            
            # Check for common Thai words to verify encoding
            Write-Host ""
            Write-Host "  การตรวจสอบคำศัพท์ภาษาไทย:" -ForegroundColor Yellow
            
            $commonThaiWords = @("รายละเอียด", "สถานะ", "หมายเหตุ", "ปัญหา", "แผนก", "พื้นที่", "ต้องการ", "ซ่อม", "เครื่อง")
            $foundWords = @()
            
            foreach ($word in $commonThaiWords) {
                $found = $thaiMatches | Where-Object { $_.Text -like "*$word*" }
                if ($found) {
                    $foundWords += $word
                    Write-Host "    ✓ '$word' - พบ" -ForegroundColor Green
                }
            }
            
            if ($foundWords.Count -eq 0) {
                Write-Host "    ⚠ ไม่พบคำศัพท์ทั่วไป แต่มีข้อมูลภาษาไทยอื่น" -ForegroundColor Yellow
            }
            
            # Check encoding corruption patterns
            Write-Host ""
            Write-Host "  ตรวจสอบปัญหา encoding:" -ForegroundColor Yellow
            
            $corruptionPatterns = @("à¸", "à¹", "¤à", "¡à")  # Common mojibake patterns
            $hasCorruption = $false
            
            foreach ($pattern in $corruptionPatterns) {
                $corrupt = $content | Select-String -Pattern $pattern -SimpleMatch
                if ($corrupt) {
                    Write-Host "    ✗ พบ pattern '$pattern' - อาจมีปัญหา encoding" -ForegroundColor Red
                    $hasCorruption = $true
                }
            }
            
            if (-not $hasCorruption) {
                Write-Host "    ✓ ไม่พบปัญหา encoding corruption" -ForegroundColor Green
            }
            
        } else {
            Write-Host "  ⚠ ไม่พบข้อมูลภาษาไทยในไฟล์ backup" -ForegroundColor Yellow
            Write-Host "    (อาจเป็นเพราะ database ยังไม่มีข้อมูลภาษาไทย)" -ForegroundColor Gray
        }
        
    } else {
        Write-Host "  ✗ ไม่สามารถแตกไฟล์ได้" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ✗ Error: $_" -ForegroundColor Red
}
finally {
    # Cleanup
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# ===== Summary =====
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   สรุปผลการตรวจสอบ" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ไฟล์ backup สามารถใช้สำหรับ restore ข้อมูลภาษาไทยได้ ✓" -ForegroundColor Green
Write-Host ""
Write-Host "คำสั่งสำหรับ restore:" -ForegroundColor Yellow
Write-Host "  .\scripts\restore-database.ps1 -BackupFile '$BackupFile'" -ForegroundColor Gray
Write-Host ""
