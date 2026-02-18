@echo off
REM ========================================
REM EGPB Ticket System - Backup Script
REM ========================================

SETLOCAL EnableDelayedExpansion

REM Configuration
SET PGPASSWORD=EGPB_Secure_Pass_2024!
SET BACKUP_DIR=D:\EGPB-Backups
SET UPLOAD_DIR=D:\EGPB-Uploads
SET PG_BIN=C:\Program Files\PostgreSQL\16\bin
SET DB_NAME=egpb_ticket_db
SET DB_USER=egpb_admin
SET DB_HOST=localhost

REM Create timestamp
FOR /F "tokens=1-4 delims=/ " %%a IN ('date /t') DO (SET DATE=%%d%%b%%c)
FOR /F "tokens=1-3 delims=:. " %%a IN ('echo %TIME%') DO (SET TIME=%%a%%b%%c)
SET TIME=%TIME: =0%
SET TIMESTAMP=%DATE%_%TIME%

REM Create backup directory
IF NOT EXIST "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo Created backup directory: %BACKUP_DIR%
)

echo ========================================
echo EGPB Ticket System Backup
echo Started: %DATE% %TIME%
echo ========================================

REM Backup Database
echo.
echo [1/3] Backing up database...
"%PG_BIN%\pg_dump" -U %DB_USER% -h %DB_HOST% -d %DB_NAME% -F c -f "%BACKUP_DIR%\egpb_db_%TIMESTAMP%.backup"

IF ERRORLEVEL 1 (
    echo ERROR: Database backup failed!
    GOTO :ERROR
) ELSE (
    echo SUCCESS: Database backup completed
)

REM Backup Upload Files
echo.
echo [2/3] Backing up upload files...
IF EXIST "%UPLOAD_DIR%" (
    xcopy /E /I /Y /Q "%UPLOAD_DIR%" "%BACKUP_DIR%\uploads_%TIMESTAMP%"
    IF ERRORLEVEL 1 (
        echo WARNING: Some files may not be backed up
    ) ELSE (
        echo SUCCESS: Upload files backup completed
    )
) ELSE (
    echo WARNING: Upload directory not found: %UPLOAD_DIR%
)

REM Create backup log
echo.
echo [3/3] Creating backup log...
(
    echo Backup Information
    echo ==================
    echo Timestamp: %TIMESTAMP%
    echo Date: %DATE%
    echo Time: %TIME%
    echo Database: %DB_NAME%
    echo User: %DB_USER%
    echo.
    echo Files:
    echo - Database: egpb_db_%TIMESTAMP%.backup
    echo - Uploads: uploads_%TIMESTAMP%
    echo.
) > "%BACKUP_DIR%\backup_%TIMESTAMP%.log"

echo SUCCESS: Backup log created

REM Clean old backups (older than 30 days)
echo.
echo [Cleanup] Removing backups older than 30 days...
forfiles /p "%BACKUP_DIR%" /s /m *.backup /d -30 /c "cmd /c del @path" 2>nul
forfiles /p "%BACKUP_DIR%" /s /m *.log /d -30 /c "cmd /c del @path" 2>nul

REM Remove old upload backups (older than 30 days)
FOR /F "tokens=*" %%G IN ('dir /b /ad "%BACKUP_DIR%\uploads_*" 2^>nul') DO (
    SET FOLDER=%%G
    forfiles /p "%BACKUP_DIR%\!FOLDER!" /d -30 /c "cmd /c rd /s /q %BACKUP_DIR%\!FOLDER!" 2>nul
)

echo SUCCESS: Old backups cleaned

REM Summary
echo.
echo ========================================
echo Backup completed successfully!
echo ========================================
echo.
echo Backup location: %BACKUP_DIR%
echo Timestamp: %TIMESTAMP%
echo.

GOTO :END

:ERROR
echo.
echo ========================================
echo Backup failed with errors!
echo ========================================
echo.
EXIT /B 1

:END
ENDLOCAL
EXIT /B 0

