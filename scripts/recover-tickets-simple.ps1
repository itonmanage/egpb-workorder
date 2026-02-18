# Recover Missing Tickets - Simple Version
# Safely merges missing tickets from backup into current database

param(
    [switch]$PreviewOnly = $false
)

$BackupFile = "F:\EGPB-Backups\database\egpb_ticket_backup_2025-12-24_100000.sql"

Write-Host ""
Write-Host "=== Missing Tickets Recovery ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $BackupFile)) {
    Write-Host "Backup file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Using backup: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
$tempDb = "egpb_recovery_temp"

try {
    Write-Host "[1/5] Creating temporary database..." -ForegroundColor Cyan
    $null = & "F:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    
    Write-Host "[2/5] Restoring backup..." -ForegroundColor Cyan
    $null = & "F:\postgres\bin\pg_restore.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb $BackupFile 2>&1
    
    Write-Host "[3/5] Counting missing tickets..." -ForegroundColor Cyan
    
    # Count IT tickets in backup (00001-00100)
    $itQuery = "SELECT COUNT(*) FROM tickets WHERE ticket_number >= 'EGPB-IT25-00001' AND ticket_number <= 'EGPB-IT25-00100';"
    $itCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $itQuery 2>&1
    $itCount = $itCount.Trim()
    
    # Count Engineer tickets in backup (00001-00562)
    $engQuery = "SELECT COUNT(*) FROM engineer_tickets WHERE ticket_number >= 'EGPB-EN25-00001' AND ticket_number <= 'EGPB-EN25-00562';"
    $engCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $engQuery 2>&1
    $engCount = $engCount.Trim()
    
    $itCountNum = if ($itCount -is [array]) { [int]$itCount[0] } else { [int]$itCount }
    $engCountNum = if ($engCount -is [array]) { [int]$engCount[0] } else { [int]$engCount }
    
    Write-Host ""
    Write-Host "Found missing tickets in backup:" -ForegroundColor Green
    Write-Host "  IT Tickets (00001-00100): $itCountNum" -ForegroundColor White
    Write-Host "  Engineer Tickets (00001-00562): $engCountNum" -ForegroundColor White
    Write-Host "  Total: $($itCountNum + $engCountNum)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($PreviewOnly) {
        Write-Host "Preview mode - showing sample tickets..." -ForegroundColor Cyan
        Write-Host ""
        
        $sampleIt = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -c "SELECT ticket_number, title, status FROM tickets WHERE ticket_number >= 'EGPB-IT25-00001' AND ticket_number <= 'EGPB-IT25-00010' ORDER BY ticket_number;" 2>&1
        Write-Host "Sample IT Tickets:" -ForegroundColor Yellow
        Write-Host $sampleIt
        
        Write-Host ""
        Write-Host "Run without -PreviewOnly to import these tickets." -ForegroundColor Cyan
        Write-Host ""
        return
    }
    
    Write-Host "[4/5] Importing missing tickets..." -ForegroundColor Cyan
    
    # Use pg_dump to export only missing tickets, then import
    $itDumpFile = "F:\ticket-form-app\data\missing_it.sql"
    $engDumpFile = "F:\ticket-form-app\data\missing_eng.sql"
    
    # Dump IT tickets
    $itDumpQuery = "COPY (SELECT * FROM tickets WHERE ticket_number >= 'EGPB-IT25-00001' AND ticket_number <= 'EGPB-IT25-00100') TO STDOUT"
    $null = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -c $itDumpQuery | Out-File -FilePath $itDumpFile -Encoding UTF8 2>&1
    
    # Import to current database
    $importIt = "COPY tickets FROM STDIN"
    Get-Content $itDumpFile | & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $importIt 2>&1
    
    Write-Host "  Imported $itCount IT tickets" -ForegroundColor Green
    
    # Dump Engineer tickets
    $engDumpQuery = "COPY (SELECT * FROM engineer_tickets WHERE ticket_number >= 'EGPB-EN25-00001' AND ticket_number <= 'EGPB-EN25-00562') TO STDOUT"
    $null = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -c $engDumpQuery | Out-File -FilePath $engDumpFile -Encoding UTF8 2>&1
    
    # Import to current database
    $importEng = "COPY engineer_tickets FROM STDIN"
    Get-Content $engDumpFile | & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $importEng 2>&1
    
    Write-Host "  Imported $engCount Engineer tickets" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[5/5] Verifying..." -ForegroundColor Cyan
    
    $finalIt = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM tickets;" 2>&1
    $finalEng = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM engineer_tickets;" 2>&1
    
    Write-Host ""
    Write-Host "=== Recovery Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Final counts:" -ForegroundColor Cyan
    Write-Host "  IT Tickets: $($finalIt.Trim())" -ForegroundColor White
    Write-Host "  Engineer Tickets: $($finalEng.Trim())" -ForegroundColor White
    Write-Host ""
    Write-Host "Success! Missing tickets have been recovered." -ForegroundColor Green
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
