@echo off
setlocal enabledelayedexpansion

:: Force working directory to script location
cd /d "%~dp0"

title GreenLife AI Pharmacy Management System - Docker Launcher
color 0A

echo ==============================================================================
echo           GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                   Production Docker Launcher
echo ==============================================================================
echo.

:: 1. Check if Docker is installed and running
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_CLI

docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 goto DOCKER_RUNNING

:: Attempt auto-starting Docker Desktop if installed
echo [1/3] Docker Desktop is not active. Attempting to start Docker daemon automatically...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    echo         - Starting Docker Desktop in background...
) else if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" (
    start "" "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
    echo         - Starting Docker Desktop in background...
)

set /a DOCKER_WAIT=0
:WAIT_FOR_DOCKER_ENGINE
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 goto DOCKER_RUNNING

set /a DOCKER_WAIT+=1
if %DOCKER_WAIT% GEQ 25 goto NO_DOCKER_DAEMON

ping 127.0.0.1 -n 3 >nul
echo         - Waiting for Docker engine to become operational (!DOCKER_WAIT!/25)...
goto WAIT_FOR_DOCKER_ENGINE

:DOCKER_RUNNING
echo [1/3] Docker daemon detected and operational.
echo [2/3] Starting GreenLife AI stack (PostgreSQL 16, Redis, Backend, Frontend Nginx)...
:: NOTE: Never use --build on offline client deployments! Uses local pre-imported images.
docker compose up -d

if %ERRORLEVEL% NEQ 0 goto START_ERROR

echo.
echo [3/3] Waiting for GreenLife AI services to be ready...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=40

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% EQU 0 goto START_SUCCESS

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
echo.
echo Checking backend logs:
docker compose logs --tail=25 backend
goto SHOW_SYSTEM_READY

:START_SUCCESS
color 0A

:SHOW_SYSTEM_READY
echo.
echo ==============================================================================
echo   GreenLife AI is now RUNNING!
echo.
echo   Application URL:     http://localhost
echo   Default Username:    Admink19
echo   Default Password:    Admin1224
echo ==============================================================================
echo.

:: Launch the user's default browser
start http://localhost

echo Container Status:
docker compose ps
echo.
echo You can now minimize or close this window. To stop the system, run Stop-GreenLife-Docker.bat.
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

:NO_DOCKER_DAEMON
color 0C
echo.
echo [ERROR] Docker Desktop could not be initialized automatically.
echo Please open Docker Desktop manually, wait until the whale icon shows "Engine running", and re-run this launcher.
echo.
pause
exit /b 1

:START_ERROR
color 0C
echo.
echo [ERROR] Failed to start containers!
echo Recent container logs:
docker compose logs --tail=30
echo.
pause
exit /b 1
