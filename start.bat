@echo off
title College Bus Tracking System - Nirma University
echo ========================================================
echo   College Bus Tracking System - Startup Script
echo   Department of Computer Science & Engineering
echo   Nirma University - FSD Practical Project
echo ========================================================
echo.

:: 1. Check if MySQL is listening on port 3306
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting MySQL Server 8.4 in background...
    start "" /b "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/3] MySQL Server is already running on port 3306.
)

:: 2. Launch browser
echo [2/3] Opening web browser...
start http://localhost:3000

:: 3. Run Node.js Server
echo [3/3] Starting Node.js Express server...
echo --------------------------------------------------------
echo Application is running at: http://localhost:3000
echo Press Ctrl + C to stop the server anytime.
echo --------------------------------------------------------
echo.
node server.js
pause
