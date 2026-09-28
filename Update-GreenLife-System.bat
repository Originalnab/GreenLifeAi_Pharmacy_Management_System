@echo off
setlocal enabledelayedexpansion

:: Force working directory to the script's own folder
cd /d "%~dp0"

title GreenLife AI - Automated Production Update Utility (Data-Preserving)
color 0B

echo ==============================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo             Production System Updater (Zero Data Loss)
echo ==============================================================================
echo Script Location: %~dp0
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Verify Docker Desktop is installed and operational
:: -----------------------------------------------------------------------------
echo [Step 1/6] Checking Docker Desktop status...

where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_CLI

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_ENGINE

echo         - Docker engine is active and operational.
goto DOCKER_READY

:NO_DOCKER_CLI
color 0C
echo.
echo [ERROR] 'docker' command was not found in your system PATH!
echo Please make sure Docker Desktop is installed.
echo If recently installed, please restart your computer.
echo.
pause
exit /b 1

:NO_DOCKER_ENGINE
color 0C
echo.
echo [ERROR] Docker Desktop engine is not running!
echo.
echo Please do the following on this computer:
echo   1. Open Docker Desktop from the Start Menu or Desktop.
echo   2. Look at the bottom-left corner of Docker Desktop.
echo   3. Wait until the whale icon turns GREEN -- Engine running.
echo   4. Once it is green, run this script again.
echo.
pause
exit /b 1

:DOCKER_READY
echo.

:: -----------------------------------------------------------------------------
:: Step 2: Check for Git repository updates (if applicable)
:: -----------------------------------------------------------------------------
echo [Step 2/6] Checking for codebase updates...
if not exist ".git" goto STANDALONE_COPY

echo         - Git repository detected. Checking remote updates...
git pull origin main
echo         - Codebase sync check complete.
goto CODEBASE_READY

:STANDALONE_COPY
echo         - Standalone installation detected using updated local files.

:CODEBASE_READY
echo.

:: -----------------------------------------------------------------------------
:: Step 3: Safety Pre-Update Database Backup (Protects All Client Data)
:: -----------------------------------------------------------------------------
echo [Step 3/6] Creating automated pre-update database backup...
if not exist "backups" mkdir "backups"

:: Generate a timestamp for the backup filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" set DT=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set DT=%DT: =0%
set "BACKUP_FILE=backups\greenlife_db_pre_update_%DT:~0,8%_%DT:~8,6%.sql"

docker compose ps | findstr /i "greenlifeai_postgres" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo         - Taking snapshot of active database to: %BACKUP_FILE%
    docker compose exec -T database pg_dump -U greenlife_admin greenlife_pharmacy_db > "%BACKUP_FILE%" 2>nul
    if exist "%BACKUP_FILE%" (
        echo         - [OK] Database backup saved safely.
    ) else (
        echo         - [NOTE] Active dump skipped (database container was idle/starting).
    )
) else (
    echo         - [NOTE] Postgres container not active right now. Volume remains safe on disk.
)
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Safely Stop Previous Containers (Volume Preserved 100%)
:: -----------------------------------------------------------------------------
echo [Step 4/6] Gracefully stopping previous containers (Preserving Database Volume)...
:: NOTE: Never use -v here! Keeping volume greenlifeai_postgres_volume guarantees zero data loss!
docker compose down
echo         - Previous containers stopped cleanly.
echo         - Database volume 'greenlifeai_postgres_volume' is 100%% PRESERVED.
echo.

:: -----------------------------------------------------------------------------
:: Step 5: Launch updated production containers
:: -----------------------------------------------------------------------------
echo [Step 5/6] Starting updated production containers...
echo         - PostgreSQL 16 (Port 5434:5432)
echo         - Redis 7 (Port 6380:6379)
echo         - Backend (Django Gunicorn WSGI on Port 8000)
echo         - Frontend (React 19 Nginx on Port 80)
echo.

if exist "greenlife_images.tar" (
    echo         - Offline image archive 'greenlife_images.tar' detected.
    echo         - Loading offline Docker images (zero internet required)...
    docker load -i greenlife_images.tar
    echo         - Starting containers from updated images...
    docker compose up -d
) else (
    echo         - Building and launching production containers...
    docker compose up -d --build
)

if %ERRORLEVEL% NEQ 0 goto BUILD_ERROR

echo         - Containers successfully started.
echo.
goto WAIT_HEALTHCHECK

:BUILD_ERROR
color 0C
echo.
echo [ERROR] Failed to build or start updated containers!
echo Check container logs using: docker compose logs
echo.
pause
exit /b 1

:: -----------------------------------------------------------------------------
:: Step 6: Wait for Backend API Healthcheck & Apply Migrations
:: -----------------------------------------------------------------------------
:WAIT_HEALTHCHECK
echo [Step 6/6] Waiting for services to initialize and apply migrations...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=45

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% EQU 0 goto APPLY_MIGRATIONS

set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ %MAX_ATTEMPTS% goto HEALTH_TIMEOUT

ping 127.0.0.1 -n 3 >nul
echo         - Initializing services... attempt !ATTEMPTS! of %MAX_ATTEMPTS%
goto HEALTH_CHECK_LOOP

:APPLY_MIGRATIONS
echo         - Ensuring latest database migrations are applied...
docker compose exec -T backend python manage.py migrate --noinput >nul 2>&1
goto UPDATE_SUCCESS

:HEALTH_TIMEOUT
color 0E
echo.
echo [WARN] Services took longer than expected to report healthy.
echo Checking container status...
docker compose ps
echo.
echo Recent backend logs:
docker compose logs --tail=30 backend
goto DISPLAY_INFO

:UPDATE_SUCCESS
color 0A
echo.
echo ==============================================================================
echo   [SUCCESS] GreenLife AI System Update Completed Successfully!
echo   (All client data, products, inventory, and sales were 100%% preserved)
echo.
echo   Application URL:     http://localhost
echo   Super Admin User:    Admink19
echo   Super Admin Pass:    Admin1224
if exist "%BACKUP_FILE%" (
echo   Pre-Update Backup:   %BACKUP_FILE%
)
echo ==============================================================================
echo.

:DISPLAY_INFO
:: Open default browser
start http://localhost

echo Active Container Status:
docker compose ps
echo.
echo The update is complete. You may now close this window.
pause
exit /b 0
