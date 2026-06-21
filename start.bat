@echo off
REM ============================================================
REM  Launcher for the Foundation web app
REM  - Installs dependencies if they are missing
REM  - Starts the Next.js dev server
REM  - Opens the app in your default browser
REM ============================================================

cd /d "%~dp0"

echo.
echo === Foundation launcher ===
echo.

REM Make sure Node.js is available
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on your PATH.
    echo         Install it from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

REM Install dependencies on first run
if not exist "node_modules" (
    echo Installing dependencies ^(first run^)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

REM Open the browser shortly after the server starts
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000"

echo.
echo Starting dev server at http://localhost:3000
echo Close this window or press Ctrl+C to stop.
echo.

call npm run dev
