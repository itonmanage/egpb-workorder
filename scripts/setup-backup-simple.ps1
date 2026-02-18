# Simple Automated Database Backup Setup
# Single daily backup at 2:00 AM

Write-Host "Setting up automated database backup..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$backupTime = "2:00AM"  # เปลี่ยนเวลาได้ที่นี่
$scriptPath = "F:\ticket-form-app\scripts\backup-database.ps1"

# Create scheduled task action
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

# Create trigger (daily at specified time)
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
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

try {
    # Register the task
    Register-ScheduledTask `
        -TaskName "EGPB Database Backup - Daily" `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Daily database backup at $backupTime" `
        -Force | Out-Null
    
    Write-Host "✓ Backup task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Schedule: Daily at $backupTime" -ForegroundColor Yellow
    Write-Host "Backup location: F:\EGPB-Backups\database" -ForegroundColor Yellow
    Write-Host "Retention: 7 days" -ForegroundColor Yellow
    Write-Host ""
    
    # Test the task
    Write-Host "Testing backup now..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName "EGPB Database Backup - Daily"
    Start-Sleep -Seconds 3
    
    # Check task status
    $task = Get-ScheduledTask -TaskName "EGPB Database Backup - Daily"
    Write-Host "Task Status: $($task.State)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Setup completed! ✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "To manually run backup:" -ForegroundColor Yellow
    Write-Host "  Start-ScheduledTask -TaskName 'EGPB Database Backup - Daily'" -ForegroundColor White
    Write-Host ""
    Write-Host "To view backup logs:" -ForegroundColor Yellow
    Write-Host "  Get-Content F:\EGPB-Backups\database\backup_log.txt -Tail 10" -ForegroundColor White
}
catch {
    Write-Host "✗ Failed to create backup task: $_" -ForegroundColor Red
    exit 1
}
