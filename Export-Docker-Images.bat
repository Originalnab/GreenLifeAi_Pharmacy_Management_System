@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title GreenLife AI - Export Offline Docker Images
color 0B

echo ==============================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                Offline Docker Images Exporter
echo ==============================================================================
echo.
echo This tool will bundle all 4 required Docker images into a single offline
echo archive: greenlife_images.tar
echo.
echo Images being exported:
echo   1. greenlifeai_pharmacy_management_system-backend:latest
echo   2. greenlifeai_pharmacy_management_system-frontend:latest
echo   3. postgres:16-alpine
echo   4. redis:7-alpine
echo.

echo Packaging images (this may take 1-2 minutes, please wait)...
docker save -o greenlife_images.tar greenlifeai_pharmacy_management_system-backend:latest greenlifeai_pharmacy_management_system-frontend:latest postgres:16-alpine redis:7-alpine

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to export Docker images!
    echo Ensure the containers have been built first on this computer.
    pause
    exit /b 1
)

color 0A
echo.
echo ==============================================================================
echo   [SUCCESS] greenlife_images.tar created successfully!
echo.
echo   Location: %~dp0greenlife_images.tar
echo.
echo   Next Step:
echo   Copy greenlife_images.tar to your USB drive along with the project folder.
echo   On the client PC, run Import-Docker-Images.bat.
echo ==============================================================================
echo.
pause
