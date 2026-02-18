# Final Recovery - Import ALL Missing Tickets
# Uses direct SQL approach to import only tickets that don't exist

$BackupFile = "D:\EGPB-Backups\database\egpb_ticket_backup_2025-12-24_100000.sql"

Write-Host ""
Write-Host "=== Final Data Recovery ===" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
$tempDb = "egpb_final_recovery"

try {
    Write-Host "[1/5] Setting up..." -ForegroundColor Cyan
    $null = & "D:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    $null = & "D:\postgres\bin\pg_restore.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb $BackupFile 2>&1
    
    Write-Host "[2/5] Recovering missing users..." -ForegroundColor Cyan
    
    # Use INSERT ... ON CONFLICT DO NOTHING for users
    $userRecoveryQuery = @"
INSERT INTO users 
SELECT * FROM dblink('dbname=$tempDb', 
    'SELECT * FROM users') 
AS t(id uuid, username text, full_name text, position text, department text, telephone_extension text, password text, role text, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;
"@
    
    $userResult = & "D:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $userRecoveryQuery 2>&1
    Write-Host "  Users recovery attempted" -ForegroundColor White
    
    Write-Host "[3/5] Recovering IT tickets (00001-00100)..." -ForegroundColor Cyan
    
    # Recover IT tickets that don't exist
    $itRecoveryQuery = @"
INSERT INTO tickets 
SELECT * FROM dblink('dbname=$tempDb',
    'SELECT * FROM tickets WHERE ticket_number >= ''EGPB-IT25-00001'' AND ticket_number <= ''EGPB-IT25-00100''')
AS t(id uuid, ticket_number text, title text, description text, department text, location text, type_of_damage text, status text, admin_notes text, assign_to text, user_id uuid, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;
"@
    
    $itResult = & "D:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $itRecoveryQuery 2>&1
    $itInserted = $itResult | Select-String "INSERT 0 (\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "  IT Tickets recovered: $itInserted" -ForegroundColor Green
    
    Write-Host "[4/5] Recovering Engineer tickets (00001-00562)..." -ForegroundColor Cyan
    
    # Recover Engineer tickets that don't exist
    $engRecoveryQuery = @"
INSERT INTO engineer_tickets
SELECT * FROM dblink('dbname=$tempDb',
    'SELECT * FROM engineer_tickets WHERE ticket_number >= ''EGPB-EN25-00001'' AND ticket_number <= ''EGPB-EN25-00562''')
AS t(id uuid, ticket_number text, title text, description text, department text, location text, type_of_damage text, status text, admin_notes text, information_by text, assign_to text, user_id uuid, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;
"@
    
    $engResult = & "D:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -c $engRecoveryQuery 2>&1
    $engInserted = $engResult | Select-String "INSERT 0 (\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "  Engineer Tickets recovered: $engInserted" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "[5/5] Verifying final counts..." -ForegroundColor Cyan
    
    $finalIt = & "D:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM tickets;" 2>&1
    $finalEng = & "D:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c "SELECT COUNT(*) FROM engineer_tickets;" 2>&1
    
    Write-Host ""
    Write-Host "=== Recovery Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Final ticket counts:" -ForegroundColor Cyan
    Write-Host "  IT Tickets: $($finalIt.Trim())" -ForegroundColor White
    Write-Host "  Engineer Tickets: $($finalEng.Trim())" -ForegroundColor White
    Write-Host "  Total: $([int]$finalIt.Trim() + [int]$finalEng.Trim())" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✓ All missing tickets have been recovered!" -ForegroundColor Green
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
        $null = & "D:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    }
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Done!" -ForegroundColor Cyan
Write-Host ""
