# List All Backup Files
# Shows all backup files with details

$BackupDir = "F:\EGPB-Backups\database"

Write-Host "`n=== All Backup Files ===" -ForegroundColor Cyan
Write-Host ""

$backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | 
Sort-Object LastWriteTime -Descending

if ($backups.Count -eq 0) {
    Write-Host "No backup files found!" -ForegroundColor Red
    exit 1
}

# Display table
$backups | Select-Object `
@{Name = "No."; Expression = { $backups.IndexOf($_) + 1 } },
Name,
@{Name = "Size(MB)"; Expression = { [math]::Round($_.Length / 1MB, 2) } },
@{Name = "Created"; Expression = { $_.LastWriteTime.ToString("dd/MM/yyyy HH:mm") } },
@{Name = "Age(Days)"; Expression = { [math]::Round((New-TimeSpan -Start $_.LastWriteTime -End (Get-Date)).TotalDays, 1) } } |
Format-Table -AutoSize

Write-Host "Total: $($backups.Count) backup files" -ForegroundColor Green
Write-Host "Total size: $([math]::Round(($backups | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB" -ForegroundColor Green
Write-Host ""

# Show retention info
$oldBackups = $backups | Where-Object { 
    (New-TimeSpan -Start $_.LastWriteTime -End (Get-Date)).TotalDays -gt 7 
}

if ($oldBackups.Count -gt 0) {
    Write-Host "=== Files older than 7 days ===" -ForegroundColor Yellow
    Write-Host "These files will be deleted on next backup:" -ForegroundColor Yellow
    $oldBackups | ForEach-Object {
        Write-Host "  - $($_.Name) ($(([math]::Round((New-TimeSpan -Start $_.LastWriteTime -End (Get-Date)).TotalDays,1))) days old)" -ForegroundColor Red
    }
}
else {
    Write-Host "All backup files are within 7-day retention period" -ForegroundColor Green
}

Write-Host ""
