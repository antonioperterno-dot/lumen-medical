@echo off
cd /d "%~dp0"
echo === typecheck7 === > ws_fix6.log
call npm.cmd run typecheck >> ws_fix6.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_fix6.log
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
del /q ws_dev.log >nul 2>&1
set NEXT_SWC_DISABLED=1
start /min cmd /c "set NEXT_SWC_DISABLED=1 && npm.cmd run dev >> ws_dev.log 2>&1"
timeout /t 45 /nobreak >nul
echo === dev log === >> ws_fix6.log
type ws_dev.log >> ws_fix6.log
echo FIX6_DONE >> ws_fix6.log
