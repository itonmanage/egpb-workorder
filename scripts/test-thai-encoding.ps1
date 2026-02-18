# Test Thai Character Encoding in Backup
# This script tests if Thai characters are properly backed up and restored

Write-Host "`n=== Testing Thai Character Encoding ===" -ForegroundColor Cyan
Write-Host ""

# Set UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$env:PGCLIENTENCODING = "UTF8"

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
$testBackup = "F:\ticket-form-app\data\test_thai_encoding.sql"

try {
    Write-Host "[1/4] Creating test backup with UTF-8 encoding..." -ForegroundColor Gray
    
    # Backup with explicit UTF-8 encoding
    & "F:\postgres\bin\pg_dump.exe" `
        -h localhost `
        -p 5432 `
        -U egpb_admin `
        -d egpb_ticket_db `
        -F c `
        --encoding=UTF8 `
        -t engineer_tickets `
        -f $testBackup
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Backup created successfully" -ForegroundColor Green
        Write-Host "  File: $testBackup" -ForegroundColor Gray
        Write-Host "  Size: $([math]::Round((Get-Item $testBackup).Length/1KB,2)) KB" -ForegroundColor Gray
    }
    else {
        throw "Backup failed with exit code: $LASTEXITCODE"
    }
    
    Write-Host ""
    Write-Host "[2/4] Creating temporary test database..." -ForegroundColor Gray
    
    $testDb = "egpb_thai_test"
    & "F:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin -E UTF8 $testDb 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Test database created with UTF-8 encoding" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "[3/4] Restoring backup to test database..." -ForegroundColor Gray
    
    & "F:\postgres\bin\pg_restore.exe" `
        -h localhost `
        -p 5432 `
        -U egpb_admin `
        -d $testDb `
        $testBackup 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Backup restored successfully" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "[4/4] Verifying Thai characters..." -ForegroundColor Gray
    Write-Host ""
    
    # Query Thai text
    $query = "SELECT ticket_number, title, description FROM engineer_tickets WHERE ticket_number IN ('EGPB-EN25-00564', 'EGPB-EN25-00565') ORDER BY ticket_number;"
    
    $result = & "F:\postgres\bin\psql.exe" `
        -h localhost `
        -p 5432 `
        -U egpb_admin `
        -d $testDb `
        -c $query `
        --set=client_encoding=UTF8 2>&1
    
    Write-Host "Sample Thai text from restored backup:" -ForegroundColor Yellow
    Write-Host $result
    Write-Host ""
    
    # Cleanup
    Write-Host "Cleaning up test database..." -ForegroundColor Gray
    & "F:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $testDb 2>&1 | Out-Null
    
    Write-Host ""
    Write-Host "=== Test Complete ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If Thai characters appear correctly above, encoding is working!" -ForegroundColor Green
    Write-Host "If you see garbled text, there may still be encoding issues." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: PowerShell console may not display Thai correctly," -ForegroundColor Gray
    Write-Host "but the data in the database should be correct." -ForegroundColor Gray
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
