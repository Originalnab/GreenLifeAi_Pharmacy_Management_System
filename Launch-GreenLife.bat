@echo off
setlocal enabledelayedexpansion

:: Force working directory to the project folder
cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: Step 1: Detect if Super Admin is holding the Shift key
:: -----------------------------------------------------------------------------
powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; if ([System.Windows.Forms.Control]::ModifierKeys -band [System.Windows.Forms.Keys]::Shift) { exit 1 } else { exit 0 }" >nul 2>&1
if %ERRORLEVEL% EQU 1 goto LAUNCH_ADMIN_CONSOLE

:: -----------------------------------------------------------------------------
:: Step 2: Normal Launch — Check & Silently Ensure Docker Desktop is Active
:: -----------------------------------------------------------------------------
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 goto LAUNCH_SERVICES

:: Try starting Docker Desktop silently in the background
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
) else if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" (
    start "" "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
)

:LAUNCH_SERVICES
:: Silently start containers if they are not already up
docker compose up -d >nul 2>&1

:: -----------------------------------------------------------------------------
:: Step 3: Open the Modern Branded Splash Screen in App/Kiosk Mode
:: -----------------------------------------------------------------------------
set "SPLASH_PATH=%~dp0assets\splash.html"

:: Try Microsoft Edge App Mode (Frameless window without browser tabs)
where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start msedge --app="file:///%SPLASH_PATH:\=/%"
    exit /b 0
)

:: Try Google Chrome App Mode
where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start chrome --app="file:///%SPLASH_PATH:\=/%"
    exit /b 0
)

:: Fallback: Open in default browser
start "" "%SPLASH_PATH%"
exit /b 0

:: -----------------------------------------------------------------------------
:: Super Admin Verbose Override (Shift key was held down)
:: -----------------------------------------------------------------------------
:LAUNCH_ADMIN_CONSOLE
cls
title GreenLife AI - Super Admin Live Telemetry Console
color 0B
echo ================================================================================
echo   [SUPER ADMIN OVERRIDE DETECTED] Shift key pressed during launch.
echo   Opening Interactive Operations & Live Docker Console...
echo ================================================================================
echo.
call "%~dp0Admin-Console.bat"
exit /b 0
