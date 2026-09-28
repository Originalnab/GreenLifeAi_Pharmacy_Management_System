@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: GreenLife AI - Diagnostic Script
:: Writes a full log file so we can see the exact error
:: even if the window closes.
:: ============================================================

cd /d "%~dp0"

set "LOGFILE=%~dp0greenlife_diagnostic_log.txt"
echo GreenLife AI Diagnostic > "%LOGFILE%"
echo Run Time: %DATE% %TIME% >> "%LOGFILE%"
echo Script Location: %~dp0 >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo ==============================================================
echo  GreenLife AI Diagnostic Tool
echo  A log file will be saved to:
echo  %LOGFILE%
echo ==============================================================
echo.

:: --- Check 1: Docker CLI ---
echo [CHECK 1] Is 'docker' command available?
echo [CHECK 1] Is 'docker' command available? >> "%LOGFILE%"
where docker >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo         PASS - docker command found.
    echo         PASS - docker command found. >> "%LOGFILE%"
) else (
    echo         FAIL - docker not found in PATH!
    echo         FAIL - docker not found in PATH! >> "%LOGFILE%"
    echo         FIX: Install Docker Desktop and restart the PC. >> "%LOGFILE%"
    goto DONE
)
echo.

:: --- Check 2: Docker Engine Running ---
echo [CHECK 2] Is Docker engine running?
echo [CHECK 2] Is Docker engine running? >> "%LOGFILE%"
docker info >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo         PASS - Docker engine is active.
    echo         PASS - Docker engine is active. >> "%LOGFILE%"
) else (
    echo         FAIL - Docker engine is NOT running!
    echo         FAIL - Docker engine is NOT running! >> "%LOGFILE%"
    echo         FIX: Open Docker Desktop from the Start Menu and wait >> "%LOGFILE%"
    echo              until the taskbar whale icon shows 'Engine running'. >> "%LOGFILE%"
    goto DONE
)
echo.

:: --- Check 3: docker-compose.yml exists ---
echo [CHECK 3] Does docker-compose.yml exist in this folder?
echo [CHECK 3] Does docker-compose.yml exist in this folder? >> "%LOGFILE%"
if exist "%~dp0docker-compose.yml" (
    echo         PASS - docker-compose.yml found.
    echo         PASS - docker-compose.yml found. >> "%LOGFILE%"
    type "%~dp0docker-compose.yml" >> "%LOGFILE%"
) else (
    echo         FAIL - docker-compose.yml NOT found!
    echo         FAIL - docker-compose.yml NOT found! >> "%LOGFILE%"
    echo         FIX: Copy docker-compose.yml from the USB drive to this folder. >> "%LOGFILE%"
    goto DONE
)
echo.

:: --- Check 4: greenlife_images.tar exists ---
echo [CHECK 4] Does greenlife_images.tar exist?
echo [CHECK 4] Does greenlife_images.tar exist? >> "%LOGFILE%"
if exist "%~dp0greenlife_images.tar" (
    echo         PASS - greenlife_images.tar found.
    echo         PASS - greenlife_images.tar found. >> "%LOGFILE%"
    for %%F in ("%~dp0greenlife_images.tar") do (
        echo         File size: %%~zF bytes >> "%LOGFILE%"
        echo         File size: %%~zF bytes
    )
) else (
    echo         WARN - greenlife_images.tar NOT found! (Online/build mode will be used)
    echo         WARN - greenlife_images.tar NOT found! >> "%LOGFILE%"
)
echo.

:: --- Check 5: docker compose config valid ---
echo [CHECK 5] Is docker-compose.yml configuration valid?
echo [CHECK 5] Is docker-compose.yml configuration valid? >> "%LOGFILE%"
docker compose config >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo         PASS - docker compose config is valid.
    echo         PASS - docker compose config is valid. >> "%LOGFILE%"
) else (
    echo         FAIL - docker compose config has errors! See log file.
    echo         FAIL - docker compose config has errors! >> "%LOGFILE%"
    goto DONE
)
echo.

:: --- Check 6: What images are currently loaded? ---
echo [CHECK 6] Docker images currently loaded on this PC:
echo [CHECK 6] Docker images currently loaded on this PC: >> "%LOGFILE%"
docker images >> "%LOGFILE%" 2>&1
docker images
echo.

:: --- Check 7: What containers are currently running? ---
echo [CHECK 7] Current container status:
echo [CHECK 7] Current container status: >> "%LOGFILE%"
docker compose ps >> "%LOGFILE%" 2>&1
docker compose ps
echo.

:: --- Check 8: Port 80 availability ---
echo [CHECK 8] Is port 80 available (not used by another app)?
echo [CHECK 8] Is port 80 available? >> "%LOGFILE%"
netstat -ano | findstr ":80 " >> "%LOGFILE%" 2>&1
netstat -ano | findstr ":80 "
if %ERRORLEVEL% EQU 0 (
    echo         WARN - Something is already using port 80. This may block the app.
    echo         WARN - Port 80 in use. Check if IIS or another app is running. >> "%LOGFILE%"
) else (
    echo         PASS - Port 80 is free.
    echo         PASS - Port 80 is free. >> "%LOGFILE%"
)
echo.

:: --- Check 9: Disk space ---
echo [CHECK 9] Available disk space:
echo [CHECK 9] Available disk space: >> "%LOGFILE%"
wmic logicaldisk where "DeviceID='C:'" get size,freespace,caption >> "%LOGFILE%" 2>&1
wmic logicaldisk where "DeviceID='C:'" get size,freespace,caption
echo.

:DONE
echo.
echo ==============================================================
echo  Diagnostic COMPLETE.
echo  Log saved to:
echo  %LOGFILE%
echo.
echo  Please send this log file to the developer.
echo ==============================================================
echo.
pause
