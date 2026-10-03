@echo off
cd /d "%~dp0"
echo === swc repair === > ws_swc.log
call npm.cmd install --no-audit --no-fund --loglevel=warn --prefer-offline --force @next/swc-win32-x64-msvc >> ws_swc.log 2>&1
echo SWC_EXIT=%ERRORLEVEL% >> ws_swc.log
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
del /q ws_dev.log >nul 2>&1
start /min cmd /c "npm.cmd run dev >> ws_dev.log 2>&1"
timeout /t 30 /nobreak >nul
echo === dev log === >> ws_swc.log
type ws_dev.log >> ws_swc.log
echo SWC_DONE >> ws_swc.log
