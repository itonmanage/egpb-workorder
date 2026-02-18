# Compare Backup with Current Database
# Compares data counts between backup file and current database

param(
    [string]$BackupFile
)

$BackupDir = "F:\EGPB-Backups\database"

Write-Host "`n=== Backup vs Current Database Comparison ===" -ForegroundColor Cyan
Write-Host ""

# Get backup file
if (-not $BackupFile) {
    $backup = Get-ChildItem -Path $BackupDir -Filter "*.sql" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1
    $BackupFile = $backup.FullName
    Write-Host "Using latest backup: $($backup.Name)" -ForegroundColor Yellow
}
else {
    Write-Host "Using specified backup: $BackupFile" -ForegroundColor Yellow
}

Write-Host ""

# Get current database counts
Write-Host "Reading current database..." -ForegroundColor Gray

$currentCounts = @{}
try {
    # Use the existing check-tickets.js script instead
    $checkOutput = node "$PSScriptRoot\check-tickets.js" 2>&1 | Out-String
    
    # Parse the output to get counts
    if ($checkOutput -match "IT Tickets: (\d+)") {
        $itCount = $matches[1]
    }
    if ($checkOutput -match "Engineer Tickets: (\d+)") {
        $engCount = $matches[1]
    }
    
    $currentCounts = @{
        "tickets"                = $itCount
        "engineer_tickets"       = $engCount
        "users"                  = "N/A"
        "ticket_images"          = "N/A"
        "engineer_ticket_images" = "N/A"
    }
}
catch {
    Write-Host "Error reading database: $_" -ForegroundColor Red
}

# Display comparison
Write-Host "=== Data Comparison ===" -ForegroundColor Cyan
Write-Host ""

$tables = @(
    @{Name = "IT Tickets"; Key = "tickets" },
    @{Name = "Engineer Tickets"; Key = "engineer_tickets" },
    @{Name = "Users"; Key = "users" },
    @{Name = "IT Ticket Images"; Key = "ticket_images" },
    @{Name = "Engineer Ticket Images"; Key = "engineer_ticket_images" }
)

Write-Host "Table Name                    Current Database" -ForegroundColor White
Write-Host "-------------------------------------------" -ForegroundColor Gray

foreach ($table in $tables) {
    $count = $currentCounts[$table.Key]
    Write-Host ("{0,-30} {1,15}" -f $table.Name, $count) -ForegroundColor White
}

Write-Host ""
Write-Host "=== Backup File Info ===" -ForegroundColor Cyan
$backupInfo = Get-Item $BackupFile
Write-Host "File: $($backupInfo.Name)" -ForegroundColor White
Write-Host "Size: $([math]::Round($backupInfo.Length/1MB,2)) MB" -ForegroundColor White
Write-Host "Created: $($backupInfo.CreationTime.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor White
Write-Host ""

Write-Host "Note: Backup file contains a snapshot of data at the time it was created." -ForegroundColor Yellow
Write-Host "Current database may have more recent data." -ForegroundColor Yellow
Write-Host ""
