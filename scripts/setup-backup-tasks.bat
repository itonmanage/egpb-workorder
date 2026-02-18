@echo off
echo Creating EGPB Database Backup Scheduled Tasks...
echo.

REM Morning Backup Task (10:00 AM)
schtasks /create /tn "EGPB Database Backup - Morning" /tr "PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File \"F:\ticket-form-app\scripts\backup-database.ps1\"" /sc daily /st 10:00 /ru SYSTEM /rl HIGHEST /f

if %errorlevel% equ 0 (
    echo [SUCCESS] Morning backup task created
) else (
    echo [FAILED] Morning backup task creation failed
)

echo.

REM Evening Backup Task (8:00 PM)
schtasks /create /tn "EGPB Database Backup - Evening" /tr "PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File \"F:\ticket-form-app\scripts\backup-database.ps1\"" /sc daily /st 20:00 /ru SYSTEM /rl HIGHEST /f

if %errorlevel% equ 0 (
    echo [SUCCESS] Evening backup task created
) else (
    echo [FAILED] Evening backup task creation failed
)

echo.
echo Verifying tasks...
echo.

schtasks /query /tn "EGPB Database Backup - Morning" /fo LIST
echo.
schtasks /query /tn "EGPB Database Backup - Evening" /fo LIST

echo.
echo Setup completed!
pause
