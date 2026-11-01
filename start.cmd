@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 18 or newer, then run this file again.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:5173 in Chrome. Press Ctrl+C to stop.
node server.mjs
