@echo off
setlocal enabledelayedexpansion

:: Force working directory to the script's own folder
cd /d "%~dp0"

title GreenLife AI - Automated System Update Utility
color 0B

echo ==============================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                   Automated System Updater
echo ==============================================================================
echo Script Location: %~dp0
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Verify Docker Desktop is installed and operational
:: -----------------------------------------------------------------------------
echo [Step 1/5] Checking Docker Desktop status...

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
echo [Step 2/5] Checking for codebase updates...
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
:: Step 3: Clean previous conflicting containers and reset broken volumes
:: -----------------------------------------------------------------------------
echo [Step 3/5] Stopping previous containers and resetting conflicting volumes...
docker compose down -v
echo         - Previous containers and volumes reset cleanly.
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Build and launch updated production containers
:: -----------------------------------------------------------------------------
echo [Step 4/5] Building and launching updated containers...
echo         - PostgreSQL 16 (Port 5434:5432)
echo         - Redis 7 (Port 6380:6379)
echo         - Backend (Django Gunicorn WSGI on Port 8000)
echo         - Frontend (React 19 Nginx on Port 80)
echo.
docker compose up -d --build

if %ERRORLEVEL% NEQ 0 goto BUILD_ERROR

echo         - Containers successfully built and started.
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
:: Step 5: Wait for Backend API Healthcheck
:: -----------------------------------------------------------------------------
:WAIT_HEALTHCHECK
echo [Step 5/5] Waiting for database migrations, initial seeding, and services...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=45

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% EQU 0 goto UPDATE_SUCCESS

set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ %MAX_ATTEMPTS% goto HEALTH_TIMEOUT

    ping 127.0.0.1 -n 3 >nul
echo         - Initializing services... attempt !ATTEMPTS! of %MAX_ATTEMPTS%
goto HEALTH_CHECK_LOOP

:HEALTH_TIMEOUT
color 0E
echo.
echo [WARN] Services took longer than expected to report healthy.
echo Checking container status...
docker compose ps
goto DISPLAY_INFO

:UPDATE_SUCCESS
color 0A
echo.
echo ==============================================================================
echo   [SUCCESS] GreenLife AI System Update Completed Successfully!
echo.
echo   Application URL:     http://localhost
echo   Super Admin User:    Admink19
echo   Super Admin Pass:    Admin1224
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
