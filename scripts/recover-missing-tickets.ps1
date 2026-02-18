# Recover Missing Tickets from Backup
# Safely merges missing tickets from backup into current database

param(
    [Parameter(Mandatory = $false)]
    [string]$BackupFile = "F:\EGPB-Backups\database\egpb_ticket_backup_2025-12-24_100000.sql",
    [Parameter(Mandatory = $false)]
    [switch]$PreviewOnly = $false
)

Write-Host "`n=== Missing Tickets Recovery ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $BackupFile)) {
    Write-Host "Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "Using backup: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
$tempDb = "egpb_recovery_temp"

try {
    # Step 1: Create temporary database and restore backup
    Write-Host "[1/5] Creating temporary database..." -ForegroundColor Cyan
    $null = & "F:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    
    Write-Host "[2/5] Restoring backup to temporary database..." -ForegroundColor Cyan
    $null = & "F:\postgres\bin\pg_restore.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb $BackupFile 2>&1
    
    # Step 2: Find missing tickets
    Write-Host "[3/5] Identifying missing tickets..." -ForegroundColor Cyan
    Write-Host ""
    
    # Export missing IT tickets (00001-00100)
    $exportItQuery = @"
\copy (
    SELECT * FROM tickets 
    WHERE ticket_number >= 'EGPB-IT25-00001' 
    AND ticket_number <= 'EGPB-IT25-00100'
    ORDER BY ticket_number
) TO 'F:\ticket-form-app\data\missing_it_tickets.csv' WITH CSV HEADER;
"@
    
    $null = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -c $exportItQuery 2>&1
    
    # Export missing Engineer tickets (00001-00562)
    $exportEngQuery = @"
\copy (
    SELECT * FROM engineer_tickets 
    WHERE ticket_number >= 'EGPB-EN25-00001' 
    AND ticket_number <= 'EGPB-EN25-00562'
    ORDER BY ticket_number
) TO 'F:\ticket-form-app\data\missing_eng_tickets.csv' WITH CSV HEADER;
"@
    
    $null = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -c $exportEngQuery 2>&1
    
    # Count exported tickets
    $itCsv = Import-Csv "F:\ticket-form-app\data\missing_it_tickets.csv"
    $engCsv = Import-Csv "F:\ticket-form-app\data\missing_eng_tickets.csv"
    
    Write-Host "Found missing tickets:" -ForegroundColor Green
    Write-Host "  IT Tickets: $($itCsv.Count)" -ForegroundColor White
    Write-Host "  Engineer Tickets: $($engCsv.Count)" -ForegroundColor White
    Write-Host "  Total: $($itCsv.Count + $engCsv.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($PreviewOnly) {
        Write-Host "=== Preview Mode - Showing First 10 Tickets ===" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "IT Tickets:" -ForegroundColor Yellow
        $itCsv | Select-Object -First 10 | ForEach-Object {
            Write-Host "  $($_.ticket_number) | $($_.title) | $($_.status) | $($_.created_at)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Engineer Tickets:" -ForegroundColor Yellow
        $engCsv | Select-Object -First 10 | ForEach-Object {
            Write-Host "  $($_.ticket_number) | $($_.title) | $($_.status) | $($_.created_at)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Preview complete. Run without -PreviewOnly to import." -ForegroundColor Cyan
        return
    }
    
    # Step 3: Import missing tickets
    Write-Host "[4/5] Importing missing tickets to current database..." -ForegroundColor Cyan
    
    # Import IT tickets
    $importItQuery = @"
\copy tickets FROM 'F:\ticket-form-app\data\missing_it_tickets.csv' WITH CSV HEADER;
"@
    
    $itImport = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $importItQuery 2>&1
    
    # Import Engineer tickets
    $importEngQuery = @"
\copy engineer_tickets FROM 'F:\ticket-form-app\data\missing_eng_tickets.csv' WITH CSV HEADER;
"@
    
    $engImport = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $importEngQuery 2>&1
    
    Write-Host "  IT Tickets imported: $($itCsv.Count)" -ForegroundColor Green
    Write-Host "  Engineer Tickets imported: $($engCsv.Count)" -ForegroundColor Green
    Write-Host ""
    
    # Step 4: Verify
    Write-Host "[5/5] Verifying recovery..." -ForegroundColor Cyan
    
    $verifyItQuery = "SELECT COUNT(*) FROM tickets;"
    $finalItCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c $verifyItQuery 2>&1
    $finalItCount = $finalItCount.Trim()
    
    $verifyEngQuery = "SELECT COUNT(*) FROM engineer_tickets;"
    $finalEngCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c $verifyEngQuery 2>&1
    $finalEngCount = $finalEngCount.Trim()
    
    Write-Host ""
    Write-Host "=== Recovery Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Final ticket counts:" -ForegroundColor Cyan
    Write-Host "  IT Tickets: $finalItCount" -ForegroundColor White
    Write-Host "  Engineer Tickets: $finalEngCount" -ForegroundColor White
    Write-Host "  Total: $([int]$finalItCount + [int]$finalEngCount)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✓ Missing tickets have been recovered!" -ForegroundColor Green
    Write-Host ""
    
}
catch {
    Write-Host ""
    Write-Host "Error during recovery: $_" -ForegroundColor Red
    Write-Host ""
}
finally {
    # Cleanup
    if ($tempDb) {
        Write-Host "Cleaning up temporary database..." -ForegroundColor Gray
        $null = & "F:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    }
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Done!" -ForegroundColor Cyan
Write-Host ""
