# Setup Health Check Monitoring Task
# Creates Windows Task Scheduler task for hourly health checks

Write-Host "Setting up health check monitoring..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$scriptPath = "F:\ticket-form-app\scripts\check-health.ps1"
$checkInterval = 60 # minutes

# Create scheduled task action
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -SendAlert"

# Create trigger (every hour)
$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes $checkInterval)

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
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

try {
    # Register the task
    Register-ScheduledTask `
        -TaskName "EGPB Health Check Monitor" `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Hourly health check for EGPB Ticket System" `
        -Force | Out-Null
    
    Write-Host "✓ Health check monitoring task created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Schedule: Every $checkInterval minutes" -ForegroundColor Yellow
    Write-Host "Health endpoint: http://localhost:3000/api/health" -ForegroundColor Yellow
    Write-Host ""
    
    # Test the health check now
    Write-Host "Testing health check now..." -ForegroundColor Cyan
    Write-Host ""
    & $scriptPath
    
    Write-Host ""
    Write-Host "Setup completed! ✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "To manually check health:" -ForegroundColor Yellow
    Write-Host "  .\scripts\check-health.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "To enable Teams alerts, set environment variable:" -ForegroundColor Yellow
    Write-Host "  `$env:TEAMS_WEBHOOK_URL = 'your-webhook-url'" -ForegroundColor White
}
catch {
    Write-Host "✗ Failed to create monitoring task: $_" -ForegroundColor Red
    exit 1
}
