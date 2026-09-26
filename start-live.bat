@echo off
title RoomHisaab Live Server
echo ===================================================
echo   ROOMHISAAB - Public Live Internet Launcher
echo ===================================================
echo.
echo 1. Starting Local Server on port 5000...
start "" node index.js
timeout /t 2 /nobreak >nul
echo.
echo 2. Connecting to Secure Public Internet Tunnel...
echo    (Share the HTTPS link printed below with all roommates!)
echo.
ssh -R 80:localhost:5000 -o StrictHostKeyChecking=no nokey@localhost.run
pause
