@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title GreenLife AI - Offline System Installer & Launcher
color 0B

echo ==============================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                Offline System Installer / Launcher
echo ==============================================================================
echo Script Location: %~dp0
echo.

:: 1. Check Docker Desktop
echo [Step 1/4] Checking Docker Desktop status...
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_CLI

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_ENGINE

echo         - Docker engine is active.
echo.

:: 2. Check for offline images archive
echo [Step 2/4] Checking for greenlife_images.tar...
if not exist "greenlife_images.tar" goto NO_TAR_FILE

echo         - Loading offline Docker images (zero internet required)...
echo         - Please wait, this takes about 30 seconds...
docker load -i greenlife_images.tar

if %ERRORLEVEL% NEQ 0 goto LOAD_ERROR
echo         - Docker images loaded into local Docker registry successfully.
echo.
goto START_SERVICES

:NO_TAR_FILE
echo         [INFO] greenlife_images.tar not found in this folder.
echo         Proceeding to start with locally available images...
echo.
goto START_SERVICES

:LOAD_ERROR
color 0C
echo.
echo [ERROR] Failed to load greenlife_images.tar!
echo Check if the file is complete and not corrupted.
echo.
pause
exit /b 1

:: 3. Clean and reset previous broken volumes
:START_SERVICES
echo [Step 3/4] Resetting previous volumes and launching stack...
docker compose down -v
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
echo Check logs using: docker compose logs
echo.
pause
exit /b 1

:: 4. Wait for Healthcheck
:WAIT_HEALTHCHECK
echo [Step 4/4] Waiting for GreenLife AI services to be ready...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=45

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% EQU 0 goto LAUNCH_SUCCESS

set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ %MAX_ATTEMPTS% goto LAUNCH_TIMEOUT

ping 127.0.0.1 -n 3 >nul
echo         - Initializing services... attempt !ATTEMPTS! of %MAX_ATTEMPTS%
goto HEALTH_CHECK_LOOP

:LAUNCH_TIMEOUT
color 0E
echo.
echo [WARN] Services took longer than expected to report healthy.
docker compose ps
goto OPEN_BROWSER

:LAUNCH_SUCCESS
color 0A
echo.
echo ==============================================================================
echo   [SUCCESS] GreenLife AI is now running successfully!
echo.
echo   Application URL:     http://localhost
echo   Super Admin User:    Admink19
echo   Super Admin Pass:    Admin1224
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
