@echo off
REM ============================================================
REM  One-time setup for local TTS engines (XTTS + LuxTTS)
REM  - Installs heavy TTS deps (PyTorch via coqui-tts) into the backend venv
REM  - Clones LuxTTS from GitHub and installs its requirements
REM  NOTE: large download (GBs). Models download on first synthesis.
REM ============================================================

cd /d "%~dp0"

if not exist ".venv" (
    echo [ERROR] Backend venv not found. Run start.bat once first.
    pause
    exit /b 1
)

set PY=.venv\Scripts\python.exe

echo.
echo === Installing XTTS (coqui-tts) + soundfile ===
%PY% -m pip install -r requirements-tts.txt || (echo [ERROR] TTS deps install failed & pause & exit /b 1)

echo.
echo === Setting up LuxTTS ===
where git >nul 2>nul
if errorlevel 1 (
    echo [WARN] git not found; skipping LuxTTS. Install git to enable LuxTTS.
) else (
    if not exist "engines\LuxTTS" (
        echo Cloning LuxTTS...
        git clone https://github.com/ysharma3501/LuxTTS.git engines\LuxTTS || echo [WARN] LuxTTS clone failed
    )
    if exist "engines\LuxTTS\requirements.txt" (
        echo Installing LuxTTS requirements...
        %PY% -m pip install -r engines\LuxTTS\requirements.txt || echo [WARN] LuxTTS requirements install failed
    )
)

echo.
echo === Done ===
echo XTTS and LuxTTS are installed if no errors appeared above.
echo Models download automatically on first use.
echo.
pause
