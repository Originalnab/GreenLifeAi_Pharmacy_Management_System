@echo off
setlocal enabledelayedexpansion

:: Force working directory to script directory
cd /d "%~dp0"

title GreenLife AI - Super Admin Live Operations Console
color 0B

:MENU
cls
echo ================================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                 Super Admin Operations Console
echo ================================================================================
echo  Host Working Directory: %~dp0
echo.
echo  [1] View Container Status          (docker compose ps)
echo  [2] Stream Unified Live Logs       (docker compose logs -f --tail=100)
echo  [3] Stream Backend API Logs Only   (docker compose logs -f backend)
echo  [4] Stream Database Logs Only      (docker compose logs -f database)
echo  [5] Open Interactive DB Shell      (psql -U greenlife_admin)
echo  [6] Take Instant Database Backup   (pg_dump to backups\)
echo  [7] Restart Containers             (docker compose restart)
echo  [8] Open GreenLife AI in Browser   (http://localhost)
echo  [9] Exit Console
echo ================================================================================
set /p "CHOICE=Enter selection [1-9]: "

if "%CHOICE%"=="1" goto CMD_STATUS
if "%CHOICE%"=="2" goto CMD_LOGS_ALL
if "%CHOICE%"=="3" goto CMD_LOGS_BACKEND
if "%CHOICE%"=="4" goto CMD_LOGS_DB
if "%CHOICE%"=="5" goto CMD_DB_SHELL
if "%CHOICE%"=="6" goto CMD_BACKUP
if "%CHOICE%"=="7" goto CMD_RESTART
if "%CHOICE%"=="8" goto CMD_OPEN_BROWSER
if "%CHOICE%"=="9" goto CMD_EXIT

echo Invalid selection. Please enter a number between 1 and 9.
timeout /t 2 >nul
goto MENU

:CMD_STATUS
cls
echo ================================================================================
echo  GreenLife AI - Active Container Telemetry
echo ================================================================================
docker compose ps
echo.
pause
goto MENU

:CMD_LOGS_ALL
cls
echo ================================================================================
echo  Streaming Unified Docker Logs (Press Ctrl+C to stop streaming)
echo ================================================================================
docker compose logs -f --tail=100
echo.
pause
goto MENU

:CMD_LOGS_BACKEND
cls
echo ================================================================================
echo  Streaming Backend API Logs (Press Ctrl+C to stop streaming)
echo ================================================================================
docker compose logs -f backend
echo.
pause
goto MENU

:CMD_LOGS_DB
cls
echo ================================================================================
echo  Streaming Database Logs (Press Ctrl+C to stop streaming)
echo ================================================================================
docker compose logs -f database
echo.
pause
goto MENU

:CMD_DB_SHELL
cls
echo ================================================================================
echo  Launching PostgreSQL Interactive Shell (psql)
echo  Type \q and press Enter to return to the menu.
echo ================================================================================
docker compose exec database psql -U greenlife_admin -d greenlife_pharmacy_db
echo.
pause
goto MENU

:CMD_BACKUP
cls
echo ================================================================================
echo  Compiling Instant Live Database Backup Snapshot
echo ================================================================================
if not exist "backups" mkdir "backups"
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
if not defined DT set "DT=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "DT=%DT: =0%"
set "BACKUP_FILE=backups\greenlife_db_manual_%DT:~0,8%_%DT:~8,6%.sql"

docker compose exec -T database pg_dump -U greenlife_admin greenlife_pharmacy_db > "%BACKUP_FILE%" 2>nul
if exist "%BACKUP_FILE%" (
    echo [OK] Database snapshot successfully saved to:
    echo      %BACKUP_FILE%
) else (
    echo [ERROR] Failed to compile database snapshot. Ensure database container is running.
)
echo.
pause
goto MENU

:CMD_RESTART
cls
echo ================================================================================
echo  Restarting All GreenLife AI Containers (Volume Preserved)
echo ================================================================================
docker compose restart
echo.
echo [OK] Restart command executed.
echo.
pause
goto MENU

:CMD_OPEN_BROWSER
start http://localhost
goto MENU

:CMD_EXIT
exit /b 0
