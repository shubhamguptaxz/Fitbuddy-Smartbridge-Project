@echo off
title FitBuddy Server
echo.
echo  ======================================
echo   FitBuddy - AI Fitness Coach
echo  ======================================
echo.

REM Set your Gemini API Key below:
set GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

cd /d "%~dp0"

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo [i] First time setup: Creating Python virtual environment...
    python -m venv .venv
    echo [i] Installing dependencies...
    .venv\Scripts\pip.exe install -r requirements.txt
    echo [i] Setup complete!
)

echo [i] Starting server on http://127.0.0.1:8000
echo.

.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000 --host 127.0.0.1

pause

