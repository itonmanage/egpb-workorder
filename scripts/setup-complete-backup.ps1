# Setup Complete Backup Task
# Creates Windows Task Scheduler task for complete system backup

Write-Host "Setting up complete backup task..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$scriptPath = "F:\ticket-form-app\scripts\backup-complete.ps1"
$backupTime = "2:00AM"  # เปลี่ยนเวลาได้

# Create scheduled task action
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

# Create trigger (daily)
$trigger = New-ScheduledTaskTrigger -Daily -At $backupTime

# Create principal (run as SYSTEM)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

try {
    # Register the task
    Register-ScheduledTask `
        -TaskName "EGPB Complete Backup - Daily" `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Daily complete backup (database + files + config) at $backupTime" `
        -Force | Out-Null
    
    Write-Host "✓ Complete backup task created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Schedule: Daily at $backupTime" -ForegroundColor Yellow
    Write-Host "Backup includes:" -ForegroundColor Yellow
    Write-Host "  - Database (PostgreSQL)" -ForegroundColor White
    Write-Host "  - Uploaded files (images/attachments)" -ForegroundColor White
    Write-Host "  - Configuration files" -ForegroundColor White
    Write-Host ""
    Write-Host "Backup location: F:\EGPB-Backups\full\" -ForegroundColor Yellow
    Write-Host "Retention: 7 backups" -ForegroundColor Yellow
    Write-Host ""
    
    # Test the task
    Write-Host "Testing backup now..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName "EGPB Complete Backup - Daily"
    Start-Sleep -Seconds 3
    
    # Check task status
    $task = Get-ScheduledTask -TaskName "EGPB Complete Backup - Daily"
    Write-Host "Task Status: $($task.State)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Setup completed! ✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "To manually run backup:" -ForegroundColor Yellow
    Write-Host "  Start-ScheduledTask -TaskName 'EGPB Complete Backup - Daily'" -ForegroundColor White
    Write-Host ""
    Write-Host "To view backup logs:" -ForegroundColor Yellow
    Write-Host "  Get-Content F:\EGPB-Backups\backup_log.txt -Tail 10" -ForegroundColor White
}
catch {
    Write-Host "✗ Failed to create backup task: $_" -ForegroundColor Red
    exit 1
}
