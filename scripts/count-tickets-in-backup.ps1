# Count Tickets in Backup File
# Restores backup to a temporary database and counts tickets

param(
    [Parameter(Mandatory = $false)]
    [string]$FileName = "egpb_ticket_backup_2025-12-18_154612.sql"
)

$BackupDir = "F:\EGPB-Backups\database"
$BackupFile = Join-Path $BackupDir $FileName

# Check if file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "File not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Counting Tickets in Backup ===" -ForegroundColor Cyan
Write-Host "File: $FileName" -ForegroundColor Yellow
Write-Host ""

$fileInfo = Get-Item $BackupFile
Write-Host "Backup Date: $($fileInfo.CreationTime.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor White
Write-Host "Age: $([math]::Round((New-TimeSpan -Start $fileInfo.LastWriteTime -End (Get-Date)).TotalDays,1)) days" -ForegroundColor White
Write-Host ""

# Create temporary database name
$tempDb = "egpb_temp_restore_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Creating temporary database: $tempDb" -ForegroundColor Gray

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"

try {
    # Create temporary database
    $createDb = & "F:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create temporary database"
    }
    
    Write-Host "Restoring backup to temporary database..." -ForegroundColor Gray
    
    # Restore backup to temp database
    $restore = & "F:\postgres\bin\pg_restore.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb $BackupFile 2>&1
    
    Write-Host "Counting tickets..." -ForegroundColor Gray
    Write-Host ""
    
    # Count IT tickets
    $itCountQuery = "SELECT COUNT(*) FROM tickets;"
    $itCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $itCountQuery 2>&1
    $itCount = $itCount.Trim()
    
    # Count Engineer tickets
    $engCountQuery = "SELECT COUNT(*) FROM engineer_tickets;"
    $engCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $engCountQuery 2>&1
    $engCount = $engCount.Trim()
    
    # Get ticket number ranges
    $itRangeQuery = "SELECT MIN(ticket_number), MAX(ticket_number) FROM tickets;"
    $itRange = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $itRangeQuery 2>&1
    
    $engRangeQuery = "SELECT MIN(ticket_number), MAX(ticket_number) FROM engineer_tickets;"
    $engRange = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $engRangeQuery 2>&1
    
    # Display results
    Write-Host "=== Ticket Counts on $($fileInfo.CreationTime.ToString('dd/MM/yyyy')) ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IT Tickets:       $itCount" -ForegroundColor Green
    if ($itRange -and $itRange.Trim() -ne "|") {
        $ranges = $itRange.Trim() -split '\|'
        if ($ranges.Count -eq 2) {
            Write-Host "  Range:          $($ranges[0].Trim()) to $($ranges[1].Trim())" -ForegroundColor Gray
        }
    }
    Write-Host ""
    Write-Host "Engineer Tickets: $engCount" -ForegroundColor Green
    if ($engRange -and $engRange.Trim() -ne "|") {
        $ranges = $engRange.Trim() -split '\|'
        if ($ranges.Count -eq 2) {
            Write-Host "  Range:          $($ranges[0].Trim()) to $($ranges[1].Trim())" -ForegroundColor Gray
        }
    }
    Write-Host ""
    
    # Calculate total safely
    $itCountNum = if ($itCount -is [array]) { [int]$itCount[0] } else { [int]$itCount }
    $engCountNum = if ($engCount -is [array]) { [int]$engCount[0] } else { [int]$engCount }
    $totalCount = $itCountNum + $engCountNum
    
    Write-Host "Total Tickets:    $totalCount" -ForegroundColor Yellow
    Write-Host ""
    
    # Compare with current
    Write-Host "=== Comparison with Current Database ===" -ForegroundColor Cyan
    
    $currentItQuery = "SELECT COUNT(*) FROM tickets;"
    $currentIt = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c $currentItQuery 2>&1
    $currentIt = $currentIt.Trim()
    
    $currentEngQuery = "SELECT COUNT(*) FROM engineer_tickets;"
    $currentEng = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d egpb_ticket_db -t -c $currentEngQuery 2>&1
    $currentEng = $currentEng.Trim()
    
    # Handle potential arrays
    $currentItNum = if ($currentIt -is [array]) { [int]$currentIt[0] } else { [int]$currentIt }
    $currentEngNum = if ($currentEng -is [array]) { [int]$currentEng[0] } else { [int]$currentEng }
    
    $itDiff = $currentItNum - $itCountNum
    $engDiff = $currentEngNum - $engCountNum
    
    Write-Host "IT Tickets:       $currentIt ($(if($itDiff -gt 0){"+$itDiff"}else{"$itDiff"}) since backup)" -ForegroundColor White
    Write-Host "Engineer Tickets: $currentEng ($(if($engDiff -gt 0){"+$engDiff"}else{"$engDiff"}) since backup)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Cleanup: Drop temporary database
    if ($tempDb) {
        Write-Host "Cleaning up temporary database..." -ForegroundColor Gray
        $dropDb = & "F:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    }
    
    # Clear password
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Done!" -ForegroundColor Green
Write-Host ""
