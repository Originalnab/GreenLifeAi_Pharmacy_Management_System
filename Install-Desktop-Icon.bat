@echo off
setlocal enabledelayedexpansion

:: Force working directory to script directory
cd /d "%~dp0"

title GreenLife AI - Desktop Shortcut Installer
color 0A

echo ================================================================================
echo            GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
echo                Official Desktop Shortcut Installer
echo ================================================================================
echo  Target Application Directory: %~dp0
echo.

:: Generate VBScript to create the desktop shortcut
set "TEMP_VBS=%TEMP%\create_greenlife_shortcut_%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP_VBS%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\GreenLife AI Pharmacy.lnk" >> "%TEMP_VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP_VBS%"
echo oLink.TargetPath = "wscript.exe" >> "%TEMP_VBS%"
echo oLink.Arguments = Chr(34) ^& "%~dp0Launch-GreenLife.vbs" ^& Chr(34) >> "%TEMP_VBS%"
echo oLink.WorkingDirectory = "%~dp0" >> "%TEMP_VBS%"
echo oLink.Description = "GreenLife AI Pharmacy Management System" >> "%TEMP_VBS%"

:: Set custom icon if available (fallback to shell icon)
if exist "%~dp0assets\greenlife.ico" (
    echo oLink.IconLocation = "%~dp0assets\greenlife.ico, 0" >> "%TEMP_VBS%"
) else (
    echo oLink.IconLocation = "shell32.dll, 220" >> "%TEMP_VBS%"
)
echo oLink.Save >> "%TEMP_VBS%"

:: Execute the temporary VBScript
cscript //nologo "%TEMP_VBS%"
if exist "%TEMP_VBS%" del "%TEMP_VBS%"

echo.
echo ================================================================================
echo  [SUCCESS] "GreenLife AI Pharmacy" desktop shortcut has been created!
echo.
echo  Users can now launch GreenLife directly from their Windows Desktop:
echo    - Double-click: Launches silently with branded loading splash screen.
echo    - Shift + Double-click: Super Admin live Docker terminal mode.
echo ================================================================================
echo.
pause
exit /b 0
