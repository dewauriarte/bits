@echo off
echo ============================================
echo   Sprint 4 Backend - Quick Start
echo ============================================
echo.

echo [1/4] Checking Node.js...
node --version || (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Checking .env file...
if not exist .env (
    echo WARNING: .env file not found!
    echo Copying from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env with your database credentials
    echo Press any key to open .env file...
    pause > nul
    notepad .env
)

echo.
echo [4/4] Starting backend server...
echo.
echo ============================================
echo   Server will start on http://localhost:3001
echo   WebSocket ready on ws://localhost:3001
echo.
echo   Press Ctrl+C to stop the server
echo ============================================
echo.

npm run dev
