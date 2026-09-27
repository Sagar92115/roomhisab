@echo off
cd /d "%~dp0"
title RoomHisaab App Launcher
echo ===================================================
echo     ROOMHISAAB - Shared Expense & Hisaab Manager
echo ===================================================
echo.
echo [1/3] Navigating to project folder: %~dp0
echo [2/3] Checking Node.js installation...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [3/3] Starting RoomHisaab Server on port 5000...
echo.
echo Opening browser in 2 seconds at http://localhost:5000 ...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"

echo.
echo ===================================================
echo   APP IS NOW RUNNING ON: http://localhost:5000
echo.
echo   * Keep this black window OPEN while using the app.
echo   * To stop the app, press Ctrl + C or close this window.
echo ===================================================
echo.
node index.js
pause
