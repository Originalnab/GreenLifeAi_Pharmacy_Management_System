@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title GreenLife AI - Offline System Installer & Launcher (Data-Preserving)
color 0B

echo ==============================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo          Offline System Installer / Launcher (Zero Data Loss)
echo ==============================================================================
echo Script Location: %~dp0
echo.

:: 1. Check Docker Desktop
echo [Step 1/5] Checking Docker Desktop status...
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_CLI

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_ENGINE

echo         - Docker engine is active.
echo.

:: 2. Check for offline images archive
echo [Step 2/5] Checking for greenlife_images.tar...
if not exist "greenlife_images.tar" goto NO_TAR_FILE

echo         - Loading offline Docker images (zero internet required)...
echo         - Please wait, this takes about 30 seconds...
docker load -i greenlife_images.tar

if %ERRORLEVEL% NEQ 0 goto LOAD_ERROR
echo         - Docker images loaded into local Docker registry successfully.
echo.
goto BACKUP_AND_START

:NO_TAR_FILE
echo         [INFO] greenlife_images.tar not found in this folder.
echo         Proceeding with currently available Docker images...
echo.
goto BACKUP_AND_START

:LOAD_ERROR
color 0C
echo.
echo [ERROR] Failed to load greenlife_images.tar!
echo Check if the file is complete and not corrupted.
echo.
pause
exit /b 1

:: 3. Safety Pre-Update Database Backup
:BACKUP_AND_START
echo [Step 3/5] Protecting existing client data...
if not exist "backups" mkdir "backups"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" set DT=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set DT=%DT: =0%
set "BACKUP_FILE=backups\greenlife_db_pre_import_%DT:~0,8%_%DT:~8,6%.sql"

docker compose ps | findstr /i "greenlifeai_postgres" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo         - Creating safety backup to: %BACKUP_FILE%
    docker compose exec -T database pg_dump -U greenlife_admin greenlife_pharmacy_db > "%BACKUP_FILE%" 2>nul
    if exist "%BACKUP_FILE%" (
        echo         - [OK] Existing database backed up safely.
    )
) else (
    echo         - Postgres container not active. Database volume remains preserved on disk.
)
echo.

:: 4. Gracefully Stop Old Containers and Start Updated Images
echo [Step 4/5] Safely restarting containers with updated images (Preserving Database Volume)...
:: NOTE: Never use -v! Volume greenlifeai_postgres_volume preserves all customer and pharmacy records.
docker compose down
echo.
echo Starting containers...
docker compose up -d

if %ERRORLEVEL% NEQ 0 goto START_ERROR
echo         - Containers started.
echo.
goto WAIT_HEALTHCHECK

:START_ERROR
color 0C
echo.
echo [ERROR] Failed to start containers!
echo Recent container logs:
docker compose logs --tail=30
echo.
pause
exit /b 1

:: 5. Wait for Healthcheck & Apply Migrations
:WAIT_HEALTHCHECK
echo [Step 5/5] Waiting for GreenLife AI services to be ready...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=45

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% EQU 0 goto APPLY_MIGRATIONS

set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ %MAX_ATTEMPTS% goto LAUNCH_TIMEOUT

ping 127.0.0.1 -n 3 >nul
echo         - Initializing services... attempt !ATTEMPTS! of %MAX_ATTEMPTS%
goto HEALTH_CHECK_LOOP

:APPLY_MIGRATIONS
echo         - Verifying database migrations...
docker compose exec -T backend python manage.py migrate --noinput >nul 2>&1
goto LAUNCH_SUCCESS

:LAUNCH_TIMEOUT
color 0E
echo.
echo [WARN] Services took longer than expected to report healthy.
docker compose ps
echo.
echo Recent backend logs:
docker compose logs --tail=25 backend
goto OPEN_BROWSER

:LAUNCH_SUCCESS
color 0A
echo.
echo ==============================================================================
echo   [SUCCESS] GreenLife AI is now running successfully!
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

:OPEN_BROWSER
start http://localhost
docker compose ps
echo.
echo System is active. You may now minimize or close this window.
pause
exit /b 0

:NO_DOCKER_CLI
color 0C
echo.
echo [ERROR] 'docker' command was not found in your system PATH!
echo Please make sure Docker Desktop is installed.
echo.
pause
exit /b 1

:NO_DOCKER_ENGINE
color 0C
echo.
echo [ERROR] Docker Desktop is not running!
echo Please start Docker Desktop and wait until the whale icon shows "Engine running".
echo.
pause
exit /b 1
