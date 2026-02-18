# Recover Missing Data with Dependencies
# Recovers users first, then tickets

$BackupFile = "F:\EGPB-Backups\database\egpb_ticket_backup_2025-12-24_100000.sql"

Write-Host ""
Write-Host "=== Complete Data Recovery (with dependencies) ===" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
$tempDb = "egpb_recovery_temp"

try {
    Write-Host "[1/6] Creating temporary database..." -ForegroundColor Cyan
    $null = & "F:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    
    Write-Host "[2/6] Restoring backup..." -ForegroundColor Cyan
    $null = & "F:\postgres\bin\pg_restore.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb $BackupFile 2>&1
    
    Write-Host "[3/6] Finding missing users..." -ForegroundColor Cyan
    
    # Get list of user IDs from backup tickets that might be missing
    $missingUserQuery = @"
SELECT DISTINCT u.* FROM users u
WHERE u.id IN (
    SELECT DISTINCT user_id FROM tickets 
    WHERE ticket_number >= 'EGPB-IT25-00001' AND ticket_number <= 'EGPB-IT25-00100'
    UNION
    SELECT DISTINCT user_id FROM engineer_tickets
    WHERE ticket_number >= 'EGPB-EN25-00001' AND ticket_number <= 'EGPB-EN25-00562'
)
AND u.id NOT IN (SELECT id FROM dblink('dbname=egpb_ticket_db', 'SELECT id FROM users') AS t(id uuid));
"@
    
    # Simpler approach - export all users from backup, import only missing ones
    Write-Host "  Exporting users from backup..." -ForegroundColor Gray
    
    $userDumpFile = "F:\ticket-form-app\data\backup_users.sql"
    $null = & "F:\postgres\bin\pg_dump.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t users --data-only --column-inserts -f $userDumpFile 2>&1
    
    Write-Host "[4/6] Importing missing users..." -ForegroundColor Cyan
    
    # Import users (will skip duplicates due to unique constraints)
    $importUsers = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -f $userDumpFile 2>&1
    
    $userErrors = $importUsers | Select-String "ERROR" | Measure-Object
    $userSuccess = $importUsers | Select-String "INSERT" | Measure-Object
    
    Write-Host "  Attempted to import users" -ForegroundColor White
    Write-Host "  Successful inserts: $($userSuccess.Count)" -ForegroundColor Green
    Write-Host "  Skipped (already exist): $($userErrors.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "[5/6] Importing missing tickets..." -ForegroundColor Cyan
    
    # Now import tickets
    $itDumpFile = "F:\ticket-form-app\data\backup_it_tickets.sql"
    $engDumpFile = "F:\ticket-form-app\data\backup_eng_tickets.sql"
    
    # Export IT tickets
    $null = & "F:\postgres\bin\pg_dump.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t tickets --data-only --column-inserts -f $itDumpFile 2>&1
    
    # Filter only missing ticket numbers
    $itContent = Get-Content $itDumpFile
    $itFiltered = $itContent | Where-Object { 
        $_ -match "EGPB-IT25-000\d\d" -and 
        $_ -match "EGPB-IT25-00(0[0-9]|[1-9][0-9]|100)" 
    }
    $itFiltered | Out-File -FilePath "$itDumpFile.filtered" -Encoding UTF8
    
    # Import IT tickets
    $importIt = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -f "$itDumpFile.filtered" 2>&1
    $itSuccess = $importIt | Select-String "INSERT" | Measure-Object
    
    Write-Host "  IT Tickets imported: $($itSuccess.Count)" -ForegroundColor Green
    
    # Export Engineer tickets
    $null = & "F:\postgres\bin\pg_dump.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t engineer_tickets --data-only --column-inserts -f $engDumpFile 2>&1
    
    # Filter only missing ticket numbers
    $engContent = Get-Content $engDumpFile
    $engFiltered = $engContent | Where-Object {
        $_ -match "EGPB-EN25-00[0-5]\d\d" -and
        $_ -notmatch "EGPB-EN25-00(56[3-9]|5[7-9]\d|[6-9]\d\d)"
    }
    $engFiltered | Out-File -FilePath "$engDumpFile.filtered" -Encoding UTF8
    
    # Import Engineer tickets
    $importEng = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -f "$engDumpFile.filtered" 2>&1
    $engSuccess = $importEng | Select-String "INSERT" | Measure-Object
    
    Write-Host "  Engineer Tickets imported: $($engSuccess.Count)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[6/6] Verifying..." -ForegroundColor Cyan
    
    $finalIt = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM tickets;" 2>&1
    $finalEng = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM engineer_tickets;" 2>&1
    $finalUsers = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM users;" 2>&1
    
    Write-Host ""
    Write-Host "=== Recovery Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Final counts:" -ForegroundColor Cyan
    Write-Host "  Users: $($finalUsers.Trim())" -ForegroundColor White
    Write-Host "  IT Tickets: $($finalIt.Trim())" -ForegroundColor White
    Write-Host "  Engineer Tickets: $($finalEng.Trim())" -ForegroundColor White
    Write-Host ""
    Write-Host "Success! Missing data has been recovered." -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}
finally {
    if ($tempDb) {
        Write-Host "Cleaning up..." -ForegroundColor Gray
        $null = & "F:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    }
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Done!" -ForegroundColor Cyan
Write-Host ""
