# Quick View Latest Backup
# Shows information about the most recent backup file

$BackupDir = "F:\EGPB-Backups\database"

Write-Host "`n=== Latest Backup File Info ===" -ForegroundColor Cyan
Write-Host ""

# Get latest backup file
$latestBackup = Get-ChildItem -Path $BackupDir -Filter "*.sql" | 
Sort-Object LastWriteTime -Descending | 
Select-Object -First 1

if (-not $latestBackup) {
    Write-Host "No backup files found!" -ForegroundColor Red
    exit 1
}

Write-Host "File: $($latestBackup.Name)" -ForegroundColor Yellow
Write-Host "Path: $($latestBackup.FullName)" -ForegroundColor Gray
Write-Host "Size: $([math]::Round($latestBackup.Length/1MB,2)) MB" -ForegroundColor White
Write-Host "Created: $($latestBackup.CreationTime.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor White
Write-Host "Age: $([math]::Round((New-TimeSpan -Start $latestBackup.LastWriteTime -End (Get-Date)).TotalDays,1)) days" -ForegroundColor White
Write-Host ""

# Read backup contents
Write-Host "=== Backup Contents ===" -ForegroundColor Cyan
Write-Host "Reading backup structure..." -ForegroundColor Gray
Write-Host ""

try {
    $output = & "F:\postgres\bin\pg_restore.exe" --list $latestBackup.FullName 2>&1
    
    if ($output) {
        # Extract table names
        $tables = $output | Select-String "TABLE DATA\s+public\s+(\w+)" | ForEach-Object {
            if ($_.Line -match "TABLE DATA\s+public\s+(\w+)") {
                $matches[1]
            }
        }
        
        Write-Host "Tables in backup ($($tables.Count)):" -ForegroundColor Green
        $tables | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "=== Key Tables ===" -ForegroundColor Cyan
        
        # Highlight important tables
        $importantTables = @{
            "tickets"                  = "IT Tickets"
            "engineer_tickets"         = "Engineer Tickets"
            "users"                    = "Users"
            "ticket_images"            = "IT Ticket Images"
            "engineer_ticket_images"   = "Engineer Ticket Images"
            "ticket_comments"          = "IT Ticket Comments"
            "engineer_ticket_comments" = "Engineer Ticket Comments"
        }
        
        foreach ($table in $tables) {
            if ($importantTables.ContainsKey($table)) {
                Write-Host "  $table - $($importantTables[$table])" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "Could not read backup file" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error reading backup: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "To restore this backup:" -ForegroundColor White
Write-Host "  pg_restore -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db `"$($latestBackup.FullName)`"" -ForegroundColor Gray
Write-Host ""
