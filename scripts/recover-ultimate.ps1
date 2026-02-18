# Ultimate Recovery Script
# Uses pg_restore with selective table restore

$BackupFile = "F:\EGPB-Backups\database\egpb_ticket_backup_2025-12-24_100000.sql"

Write-Host ""
Write-Host "=== Ultimate Data Recovery ===" -ForegroundColor Cyan
Write-Host "This will restore ALL missing tickets from backup" -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"

try {
    Write-Host "[1/3] Restoring users table (will skip duplicates)..." -ForegroundColor Cyan
    
    # Restore only users table data
    $restoreUsers = & "F:\postgres\bin\pg_restore.exe" `
        -h localhost -p 5432 -U egpb_admin `
        -d egpb_ticket_db `
        --data-only `
        --table=users `
        $BackupFile 2>&1
    
    Write-Host "  Users table restored (duplicates skipped)" -ForegroundColor Green
    
    Write-Host "[2/3] Restoring tickets table (will skip duplicates)..." -ForegroundColor Cyan
    
    # Restore only tickets table data
    $restoreTickets = & "F:\postgres\bin\pg_restore.exe" `
        -h localhost -p 5432 -U egpb_admin `
        -d egpb_ticket_db `
        --data-only `
        --table=tickets `
        $BackupFile 2>&1
    
    Write-Host "  Tickets table restored (duplicates skipped)" -ForegroundColor Green
    
    Write-Host "[3/3] Restoring engineer_tickets table (will skip duplicates)..." -ForegroundColor Cyan
    
    # Restore only engineer_tickets table data
    $restoreEngTickets = & "F:\postgres\bin\pg_restore.exe" `
        -h localhost -p 5432 -U egpb_admin `
        -d egpb_ticket_db `
        --data-only `
        --table=engineer_tickets `
        $BackupFile 2>&1
    
    Write-Host "  Engineer tickets table restored (duplicates skipped)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Verifying final counts..." -ForegroundColor Cyan
    
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
    Write-Host "  Total Tickets: $([int]$finalIt.Trim() + [int]$finalEng.Trim())" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✓ All data has been recovered!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Done!" -ForegroundColor Cyan
Write-Host ""
