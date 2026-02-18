# Setup Automated Database Backup Tasks
# Creates Windows Task Scheduler tasks for 10:00 AM and 8:00 PM daily backups

Write-Host "Setting up automated database backup tasks..." -ForegroundColor Cyan
Write-Host ""

# Task 1: Morning Backup (10:00 AM)
Write-Host "Creating Morning Backup task (10:00 AM)..." -ForegroundColor Yellow

$action1 = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"F:\ticket-form-app\scripts\backup-database.ps1`""

$trigger1 = New-ScheduledTaskTrigger -Daily -At "10:00AM"

$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

try {
    Register-ScheduledTask `
        -TaskName "EGPB Database Backup - Morning" `
        -Action $action1 `
        -Trigger $trigger1 `
        -Principal $principal `
        -Settings $settings `
        -Description "Daily database backup at 10:00 AM" `
        -Force | Out-Null
    
    Write-Host "✓ Morning backup task created successfully" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create morning backup task: $_" -ForegroundColor Red
}

Write-Host ""

# Task 2: Evening Backup (8:00 PM)
Write-Host "Creating Evening Backup task (8:00 PM)..." -ForegroundColor Yellow

$action2 = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"F:\ticket-form-app\scripts\backup-database.ps1`""

$trigger2 = New-ScheduledTaskTrigger -Daily -At "8:00PM"

try {
    Register-ScheduledTask `
        -TaskName "EGPB Database Backup - Evening" `
        -Action $action2 `
        -Trigger $trigger2 `
        -Principal $principal `
        -Settings $settings `
        -Description "Daily database backup at 8:00 PM" `
        -Force | Out-Null
    
    Write-Host "✓ Evening backup task created successfully" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create evening backup task: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verifying scheduled tasks..." -ForegroundColor Cyan

$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*EGPB Database Backup*" }

if ($tasks) {
    Write-Host ""
    Write-Host "Scheduled Tasks:" -ForegroundColor Green
    $tasks | ForEach-Object {
        Write-Host "  - $($_.TaskName)" -ForegroundColor White
        Write-Host "    State: $($_.State)" -ForegroundColor Gray
        $trigger = $_.Triggers[0]
        if ($trigger.StartBoundary) {
            $time = ([DateTime]$trigger.StartBoundary).ToString("HH:mm")
            Write-Host "    Schedule: Daily at $time" -ForegroundColor Gray
        }
    }
}
else {
    Write-Host "No tasks found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "To test the tasks manually, run:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName 'EGPB Database Backup - Morning'" -ForegroundColor White
Write-Host "  Start-ScheduledTask -TaskName 'EGPB Database Backup - Evening'" -ForegroundColor White
