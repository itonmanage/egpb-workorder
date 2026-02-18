# Investigate Data Loss
# Analyzes all backup files to find when and how tickets were deleted

$BackupDir = "F:\EGPB-Backups\database"

Write-Host "`n=== Data Loss Investigation ===" -ForegroundColor Cyan
Write-Host "Analyzing all backup files to find when tickets were deleted..." -ForegroundColor Yellow
Write-Host ""

# Get all backup files
$backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | 
Sort-Object LastWriteTime

if ($backups.Count -eq 0) {
    Write-Host "No backup files found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($backups.Count) backup files to analyze" -ForegroundColor Green
Write-Host ""

$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"

$results = @()

foreach ($backup in $backups) {
    Write-Host "Analyzing: $($backup.Name)..." -ForegroundColor Gray
    
    # Create temporary database
    $tempDb = "egpb_temp_$(Get-Date -Format 'HHmmss')"
    
    try {
        # Create temp database
        $null = & "F:\postgres\bin\createdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
        
        # Restore backup
        $null = & "F:\postgres\bin\pg_restore.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb $backup.FullName 2>&1
        
        # Count tickets
        $itCountQuery = "SELECT COUNT(*) FROM tickets;"
        $itCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $itCountQuery 2>&1
        $itCount = if ($itCount -is [array]) { [int]$itCount[0].Trim() } else { [int]$itCount.Trim() }
        
        $engCountQuery = "SELECT COUNT(*) FROM engineer_tickets;"
        $engCount = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $engCountQuery 2>&1
        $engCount = if ($engCount -is [array]) { [int]$engCount[0].Trim() } else { [int]$engCount.Trim() }
        
        # Get ticket number ranges
        $itMinQuery = "SELECT MIN(ticket_number) FROM tickets;"
        $itMin = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $itMinQuery 2>&1
        $itMin = $itMin.Trim()
        
        $itMaxQuery = "SELECT MAX(ticket_number) FROM tickets;"
        $itMax = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $itMaxQuery 2>&1
        $itMax = $itMax.Trim()
        
        $engMinQuery = "SELECT MIN(ticket_number) FROM engineer_tickets;"
        $engMin = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $engMinQuery 2>&1
        $engMin = $engMin.Trim()
        
        $engMaxQuery = "SELECT MAX(ticket_number) FROM engineer_tickets;"
        $engMax = & "F:\postgres\bin\psql.exe" -h localhost -p 5432 -U egpb_admin -d $tempDb -t -c $engMaxQuery 2>&1
        $engMax = $engMax.Trim()
        
        $results += [PSCustomObject]@{
            FileName = $backup.Name
            Date     = $backup.CreationTime
            ITCount  = $itCount
            ITRange  = "$itMin to $itMax"
            EngCount = $engCount
            EngRange = "$engMin to $engMax"
            Total    = $itCount + $engCount
        }
        
        # Cleanup
        $null = & "F:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
    }
    catch {
        Write-Host "  Error analyzing $($backup.Name): $_" -ForegroundColor Red
        # Try to cleanup
        if ($tempDb) {
            $null = & "F:\postgres\bin\dropdb.exe" -h localhost -p 5432 -U egpb_admin $tempDb 2>&1
        }
    }
}

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# Display results
Write-Host ""
Write-Host "=== Analysis Results ===" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -Property @{
    Name       = "Date"
    Expression = { $_.Date.ToString("dd/MM/yyyy HH:mm") }
}, @{
    Name       = "IT"
    Expression = { $_.ITCount }
}, @{
    Name       = "Engineer"
    Expression = { $_.EngCount }
}, @{
    Name       = "Total"
    Expression = { $_.Total }
}, @{
    Name       = "IT Range"
    Expression = { $_.ITRange }
} -AutoSize

Write-Host ""
Write-Host "=== Timeline Analysis ===" -ForegroundColor Cyan

# Find when the drop occurred
for ($i = 0; $i -lt $results.Count - 1; $i++) {
    $current = $results[$i]
    $next = $results[$i + 1]
    
    $itDiff = $next.ITCount - $current.ITCount
    $engDiff = $next.EngCount - $current.EngCount
    $totalDiff = $next.Total - $current.Total
    
    if ($totalDiff -ne 0) {
        Write-Host ""
        Write-Host "Change detected between:" -ForegroundColor Yellow
        Write-Host "  $($current.Date.ToString('dd/MM/yyyy HH:mm')) -> $($next.Date.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor White
        
        if ($itDiff -lt 0) {
            Write-Host "  IT Tickets: $itDiff (DECREASED)" -ForegroundColor Red
        }
        elseif ($itDiff -gt 0) {
            Write-Host "  IT Tickets: +$itDiff (increased)" -ForegroundColor Green
        }
        
        if ($engDiff -lt 0) {
            Write-Host "  Engineer Tickets: $engDiff (DECREASED)" -ForegroundColor Red
        }
        elseif ($engDiff -gt 0) {
            Write-Host "  Engineer Tickets: +$engDiff (increased)" -ForegroundColor Green
        }
        
        Write-Host "  Total Change: $(if($totalDiff -gt 0){"+$totalDiff"}else{$totalDiff})" -ForegroundColor $(if ($totalDiff -lt 0) { "Red" }else { "Green" })
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$earliest = $results | Sort-Object Total -Descending | Select-Object -First 1
$latest = $results | Sort-Object Date -Descending | Select-Object -First 1

Write-Host "Highest ticket count: $($earliest.Total) on $($earliest.Date.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Green
Write-Host "Current ticket count: $($latest.Total) on $($latest.Date.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Yellow
Write-Host "Total loss: $($latest.Total - $earliest.Total) tickets" -ForegroundColor Red
Write-Host ""

# Save results to file
$reportFile = "F:\ticket-form-app\data-loss-investigation-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$results | Format-Table -AutoSize | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "Full report saved to: $reportFile" -ForegroundColor Cyan
Write-Host ""
