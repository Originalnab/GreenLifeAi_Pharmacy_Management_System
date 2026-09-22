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
if %ERRORLEVEL% NEQ 0 goto NO_DOCKER_DAEMON

echo [1/3] Docker daemon detected and operational.
echo [2/3] Starting GreenLife AI stack (PostgreSQL 16, Redis, Backend, Frontend Nginx)...
docker compose up -d --build

if %ERRORLEVEL% NEQ 0 goto START_ERROR

echo.
echo [3/3] Waiting for GreenLife AI services to be ready...

:HEALTH_CHECK_LOOP
curl -s http://localhost/api/v1/health/ >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    ping 127.0.0.1 -n 3 >nul
    goto HEALTH_CHECK_LOOP
)

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
echo [ERROR] Docker Desktop is not running!
echo Please start Docker Desktop and wait until the whale icon shows "Engine running".
echo.
pause
exit /b 1

:START_ERROR
color 0C
echo.
echo [ERROR] Failed to start containers!
echo Check docker compose logs by running: docker compose logs
echo.
pause
exit /b 1
