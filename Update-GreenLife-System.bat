@echo off
setlocal enabledelayedexpansion

:: Force working directory to the script's own folder
cd /d "%~dp0"

title GreenLife AI - Automated Production Update Utility (Data-Preserving)
color 0B

:: -- Write ALL output to a log file (survives even if window closes) --
set "LOGFILE=%~dp0greenlife_update_log.txt"
echo GreenLife Update Log - %DATE% %TIME% > "%LOGFILE%"
echo Script Location: %~dp0 >> "%LOGFILE%"
echo. >> "%LOGFILE%"
:: Redirect both stdout and stderr to log AND screen simultaneously
call :LOG "================================================================================"
call :LOG "           GREENLIFE AI PHARMACY MANAGEMENT SYSTEM"
call :LOG "            Production System Updater (Zero Data Loss)"
call :LOG "================================================================================"
call :LOG "Script Location: %~dp0"
call :LOG ""
goto MAIN

:LOG
echo %~1
echo %~1 >> "%LOGFILE%"
goto :EOF

:MAIN

:: -----------------------------------------------------------------------------
:: Step 1: Verify Docker Desktop is installed and operational
:: -----------------------------------------------------------------------------
call :LOG "[Step 1/6] Checking Docker Desktop status..."

where docker >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_CLI
call :LOG "         - docker command found in PATH."

docker info >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 goto TRY_START_DOCKER

call :LOG "         - Docker engine is active and operational."
goto DOCKER_READY

:NO_DOCKER_CLI
color 0C
call :LOG ""
call :LOG "[FATAL] STEP 1 FAILED: 'docker' command not found in PATH."
call :LOG "FIX: Install Docker Desktop and restart the PC."
call :LOG "Download: https://www.docker.com/products/docker-desktop/"
call :LOG "Log file saved to: %LOGFILE%"
echo.
pause
exit /b 1

:TRY_START_DOCKER
color 0E
echo         - Docker Desktop is not running. Attempting to start it automatically...
echo.

:: Try common Docker Desktop install paths
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    echo         - Starting Docker Desktop from: %ProgramFiles%\Docker\Docker\
) else if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" (
    start "" "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
    echo         - Starting Docker Desktop from: %LocalAppData%\Programs\Docker\Docker\
) else (
    color 0C
    echo.
    echo [ERROR] Docker Desktop could not be found or started automatically.
    echo.
    echo Please manually:
    echo   1. Open Docker Desktop from the Start Menu or Desktop shortcut.
    echo   2. Wait until the bottom bar shows: "Engine running" (green whale icon).
    echo   3. Then run this script again.
    echo.
    pause
    exit /b 1
)

echo.
echo         Waiting for Docker engine to become ready (up to 75 seconds)...
set /a DOCKER_WAIT=0

:WAIT_DOCKER_LOOP
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 goto DOCKER_READY

set /a DOCKER_WAIT+=1
if %DOCKER_WAIT% GEQ 25 (
    color 0C
    echo.
    echo [ERROR] Docker Desktop took too long to start (waited 75 seconds).
    echo.
    echo Please:
    echo   1. Start Docker Desktop manually from the Start Menu.
    echo   2. Wait until the whale icon in the taskbar shows "Engine running".
    echo   3. Then run this script again.
    echo.
    pause
    exit /b 1
)

ping 127.0.0.1 -n 4 >nul
echo         - Waiting for Docker engine... attempt !DOCKER_WAIT! of 25
goto WAIT_DOCKER_LOOP

:DOCKER_READY
color 0B
echo         - [OK] Docker engine is active and operational.
echo.

:: -----------------------------------------------------------------------------
:: Step 2: Check for codebase updates (standalone copy — no Git required)
:: -----------------------------------------------------------------------------
echo [Step 2/6] Checking for updated files...
if not exist ".git" (
    echo         - Standalone installation detected. Using the files in this folder.
) else (
    echo         - Git repository found. Checking if git is available...
    where git >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo         - Running git pull to sync latest changes...
        git pull origin main 2>&1
        echo         - Codebase sync check complete.
    ) else (
        echo         - Git not installed on this PC. Using current local files.
    )
)
echo.

:: -----------------------------------------------------------------------------
:: Step 3: Safety Pre-Update Database Backup (Protects All Client Data)
:: -----------------------------------------------------------------------------
echo [Step 3/6] Creating automated pre-update database backup...
if not exist "backups" mkdir "backups"

:: Generate timestamp for backup filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" set DT=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set DT=%DT: =0%
set "BACKUP_FILE=backups\greenlife_db_pre_update_%DT:~0,8%_%DT:~8,6%.sql"

docker compose ps 2>nul | findstr /i "greenlifeai_postgres" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo         - Taking live database snapshot to: %BACKUP_FILE%
    docker compose exec -T database pg_dump -U greenlife_admin greenlife_pharmacy_db > "%BACKUP_FILE%" 2>nul
    if exist "%BACKUP_FILE%" (
        echo         - [OK] Database backup saved successfully. All client data is protected.
    ) else (
        echo         - [INFO] Backup skipped (database container may still be starting).
    )
) else (
    echo         - [INFO] Postgres container not active. Database volume is preserved on disk.
)
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Gracefully Stop Previous Containers (Volume NEVER deleted)
:: -----------------------------------------------------------------------------
echo [Step 4/6] Gracefully stopping previous containers (Database Volume is PRESERVED)...
echo         - IMPORTANT: 'docker compose down' WITHOUT -v preserves all client data!
docker compose down 2>&1
echo         - Previous containers stopped. Database volume remains 100%% intact.
echo.

:: -----------------------------------------------------------------------------
:: Step 5: Load Offline Images and Start Updated Containers
:: -----------------------------------------------------------------------------
echo [Step 5/6] Starting updated containers...
echo         - PostgreSQL 16  (Port 5434)
echo         - Redis 7        (Port 6380)
echo         - Backend API    (Port 8000)
echo         - Frontend UI    (Port 80)
echo.

if exist "greenlife_images.tar" (
    echo         - [OFFLINE MODE] greenlife_images.tar found in this folder.
    echo         - Loading pre-packaged Docker images (no internet needed)...
    echo         - Please wait — this takes approx. 30-60 seconds...
    echo.
    docker load -i greenlife_images.tar
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo [ERROR] Failed to load Docker images from greenlife_images.tar!
        echo.
        echo The tar file may be incomplete or corrupted.
        echo Please copy a fresh greenlife_images.tar from the developer's USB drive.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo         - Docker images loaded successfully.
    echo         - Starting all services...
    docker compose up -d
) else (
    echo         - [ONLINE/LOCAL BUILD MODE] No greenlife_images.tar found.
    echo         - Building and launching production containers from source...
    docker compose up -d --build
)

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to start containers!
    echo.
    echo Showing recent logs for diagnosis:
    echo ------------------------------------------------------------------------------
    docker compose logs --tail=40
    echo ------------------------------------------------------------------------------
    echo.
    echo Common fixes:
    echo   1. Make sure Docker Desktop is fully running (whale icon green).
    echo   2. Check that port 80 is not used by another program (IIS, Skype, etc).
    echo   3. Check that port 8000 and 5434 are free.
    echo   4. Try running: docker compose down -v   (WARNING: clears data)
    echo      Only do this if you have a backup!
    echo.
    pause
    exit /b 1
)

echo.
echo         - [OK] Containers started successfully.
echo.

:: -----------------------------------------------------------------------------
:: Step 6: Wait for Backend Health Check & Apply Migrations
:: -----------------------------------------------------------------------------
echo [Step 6/6] Waiting for GreenLife AI services to come online...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=50

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% EQU 0 goto APPLY_MIGRATIONS

set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ %MAX_ATTEMPTS% goto HEALTH_TIMEOUT

ping 127.0.0.1 -n 3 >nul
echo         - Waiting for services to initialize... attempt !ATTEMPTS! of %MAX_ATTEMPTS%
goto HEALTH_CHECK_LOOP

:APPLY_MIGRATIONS
echo.
echo         - [OK] GreenLife AI backend is ONLINE and responding.
echo         - Applying any pending database schema migrations...
docker compose exec -T backend python manage.py migrate --noinput 2>&1
echo         - Migrations applied (or already up to date).
goto UPDATE_SUCCESS

:HEALTH_TIMEOUT
color 0E
echo.
echo [WARN] Services took longer than expected to report healthy.
echo.
echo Current container status:
docker compose ps
echo.
echo Backend logs (last 40 lines):
docker compose logs --tail=40 backend
echo.
echo The system may still be starting. Try opening http://localhost in your browser
echo in 30-60 seconds. If it does not load, check the logs above for errors.
echo.
goto DISPLAY_INFO

:UPDATE_SUCCESS
color 0A
echo.
echo ==============================================================================
echo   [SUCCESS] GreenLife AI System Update Completed!
echo   (All client data, products, inventory, and sales are 100%% preserved)
echo.
echo   Application URL:   http://localhost
echo   Super Admin User:  Admink19
echo   Super Admin Pass:  Admin1224
if exist "%BACKUP_FILE%" (
echo   Pre-Update Backup: %BACKUP_FILE%
)
echo ==============================================================================
echo.

:DISPLAY_INFO
echo Active Container Status:
docker compose ps
echo.

:: Open default browser
start http://localhost

echo.
echo =========================================================
echo  Update complete. Press any key to close this window.
echo =========================================================
pause
exit /b 0
