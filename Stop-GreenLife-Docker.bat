@echo off
title Stop GreenLife AI Pharmacy System
color 0E

echo ==============================================================================
echo           GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                     Stopping Docker Stack
echo ==============================================================================
echo.

cd /d "%~dp0"
echo Shutting down containers gracefully...
docker compose down

echo.
echo [SUCCESS] GreenLife AI containers have stopped cleanly.
echo All database records remain safely preserved in the postgres volume.
echo.
pause
