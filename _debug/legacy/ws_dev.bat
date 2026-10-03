@echo off
cd /d "%~dp0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo === dev server starting === > ws_dev.log
call npm.cmd run dev >> ws_dev.log 2>&1
