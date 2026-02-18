# View Specific Backup File
# Shows detailed information about a specific backup file

param(
    [Parameter(Mandatory = $true)]
    [string]$FileName
)

$BackupDir = "F:\EGPB-Backups\database"
$BackupFile = Join-Path $BackupDir $FileName

# Check if file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "File not found: $BackupFile" -ForegroundColor Red
    Write-Host "Please check the filename and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== Backup File Details ===" -ForegroundColor Cyan
Write-Host ""

# File information
$fileInfo = Get-Item $BackupFile
Write-Host "File Name: $($fileInfo.Name)" -ForegroundColor Yellow
Write-Host "Full Path: $($fileInfo.FullName)" -ForegroundColor Gray
Write-Host "Size: $([math]::Round($fileInfo.Length/1MB,2)) MB" -ForegroundColor White
Write-Host "Created: $($fileInfo.CreationTime.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor White
Write-Host "Age: $([math]::Round((New-TimeSpan -Start $fileInfo.LastWriteTime -End (Get-Date)).TotalDays,1)) days" -ForegroundColor White
Write-Host ""

# Read backup structure
Write-Host "=== Backup Structure ===" -ForegroundColor Cyan
Write-Host "Reading backup contents..." -ForegroundColor Gray
Write-Host ""

try {
    $output = & "F:\postgres\bin\pg_restore.exe" --list $BackupFile 2>&1
    
    if ($output) {
        # Parse archive info
        $archiveInfo = $output | Select-String "Archive created at" | Select-Object -First 1
        if ($archiveInfo) {
            Write-Host "Backup Created: $($archiveInfo.Line -replace ';\s*Archive created at\s*', '')" -ForegroundColor Green
        }
        
        $dbName = $output | Select-String "dbname:" | Select-Object -First 1
        if ($dbName) {
            Write-Host "Database: $($dbName.Line -replace ';\s*dbname:\s*', '')" -ForegroundColor Green
        }
        
        $pgVersion = $output | Select-String "Dumped from database version:" | Select-Object -First 1
        if ($pgVersion) {
            Write-Host "PostgreSQL Version: $($pgVersion.Line -replace ';\s*Dumped from database version:\s*', '')" -ForegroundColor Green
        }
        
        Write-Host ""
        
        # Extract tables
        Write-Host "=== Tables in Backup ===" -ForegroundColor Cyan
        $tables = $output | Select-String "TABLE DATA\s+public\s+(\w+)" | ForEach-Object {
            if ($_.Line -match "TABLE DATA\s+public\s+(\w+)") {
                $matches[1]
            }
        }
        
        if ($tables) {
            Write-Host "Total Tables: $($tables.Count)" -ForegroundColor White
            Write-Host ""
            
            # Categorize tables
            $ticketTables = @()
            $userTables = @()
            $systemTables = @()
            
            foreach ($table in $tables) {
                if ($table -like "*ticket*") {
                    $ticketTables += $table
                }
                elseif ($table -like "*user*" -or $table -like "*session*") {
                    $userTables += $table
                }
                else {
                    $systemTables += $table
                }
            }
            
            if ($ticketTables.Count -gt 0) {
                Write-Host "Ticket-Related Tables:" -ForegroundColor Yellow
                $ticketTables | ForEach-Object {
                    Write-Host "  - $_" -ForegroundColor White
                }
                Write-Host ""
            }
            
            if ($userTables.Count -gt 0) {
                Write-Host "User-Related Tables:" -ForegroundColor Yellow
                $userTables | ForEach-Object {
                    Write-Host "  - $_" -ForegroundColor White
                }
                Write-Host ""
            }
            
            if ($systemTables.Count -gt 0) {
                Write-Host "System Tables:" -ForegroundColor Yellow
                $systemTables | ForEach-Object {
                    Write-Host "  - $_" -ForegroundColor White
                }
                Write-Host ""
            }
        }
        
        # Count other objects
        $constraints = ($output | Select-String "CONSTRAINT").Count
        $indexes = ($output | Select-String "INDEX").Count
        $foreignKeys = ($output | Select-String "FK CONSTRAINT").Count
        
        Write-Host "=== Database Objects ===" -ForegroundColor Cyan
        Write-Host "Constraints: $constraints" -ForegroundColor White
        Write-Host "Indexes: $indexes" -ForegroundColor White
        Write-Host "Foreign Keys: $foreignKeys" -ForegroundColor White
        Write-Host ""
        
        # Show restore command
        Write-Host "=== How to Restore ===" -ForegroundColor Cyan
        Write-Host "To restore this backup to the database:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Set password:" -ForegroundColor Gray
        Write-Host '   $env:PGPASSWORD = "EGPB_Secure_Pass_2024!"' -ForegroundColor White
        Write-Host ""
        Write-Host "2. Restore database:" -ForegroundColor Gray
        Write-Host "   F:\postgres\bin\pg_restore.exe -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c `"$BackupFile`"" -ForegroundColor White
        Write-Host ""
        Write-Host "WARNING: This will replace current database data!" -ForegroundColor Red
        Write-Host ""
    }
    else {
        Write-Host "Could not read backup file" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error reading backup: $_" -ForegroundColor Red
}
