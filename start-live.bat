@echo off
cd /d "%~dp0"
title RoomHisaab Live Server
echo ===================================================
echo   ROOMHISAAB - Public Live Internet Launcher
echo ===================================================
echo.
echo [1/2] Starting Local Server on port 5000...
start "" cmd /k "cd /d "%~dp0" && node index.js"
timeout /t 3 /nobreak >nul
echo.
echo [2/2] Connecting to Secure Public Internet Tunnel...
echo       (Share the HTTPS link printed below with all roommates!)
echo.
ssh -R 80:localhost:5000 -o StrictHostKeyChecking=no nokey@localhost.run
pause
