@echo off
REM ============================================================
REM  Launcher for The Foundation
REM  - Installs frontend + backend dependencies on first run
REM  - Pulls the embedding model if missing
REM  - Starts the Python backend (port 8000) and Next.js (port 3000)
REM  - Opens the app in your default browser
REM ============================================================

cd /d "%~dp0"

echo.
echo === The Foundation launcher ===
echo.

REM --- Prerequisite checks ---------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on your PATH. https://nodejs.org/
    pause
    exit /b 1
)
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not on your PATH. https://python.org/
    pause
    exit /b 1
)

REM --- Frontend dependencies -------------------------------------------------
if not exist "node_modules" (
    echo Installing frontend dependencies ^(first run^)...
    call npm install || (echo [ERROR] npm install failed & pause & exit /b 1)
)

REM --- Backend virtualenv + dependencies ------------------------------------
if not exist "backend\.venv" (
    echo Creating Python virtual environment ^(first run^)...
    python -m venv backend\.venv || (echo [ERROR] venv creation failed & pause & exit /b 1)
    echo Installing backend dependencies...
    backend\.venv\Scripts\python.exe -m pip install --upgrade pip
    backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt || (echo [ERROR] pip install failed & pause & exit /b 1)
)

REM --- Embedding model (best effort; needs Ollama) --------------------------
where ollama >nul 2>nul
if not errorlevel 1 (
    ollama list | findstr /i "nomic-embed-text" >nul 2>nul
    if errorlevel 1 (
        echo Pulling embedding model nomic-embed-text...
        ollama pull nomic-embed-text
    )
) else (
    echo [WARN] Ollama not found on PATH. Local models and embeddings will be unavailable.
)

REM --- Launch servers in their own windows ----------------------------------
echo Starting backend on http://localhost:8000
start "Foundation Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"

echo Starting frontend on http://localhost:3000
start "Foundation Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

REM --- Open the browser once the frontend is up -----------------------------
start "" cmd /c "timeout /t 6 >nul & start http://localhost:3000"

echo.
echo Both servers are starting in separate windows.
echo Close those windows to stop the servers.
echo.
