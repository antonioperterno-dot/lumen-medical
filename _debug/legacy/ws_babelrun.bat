@echo off
cd /d "%~dp0"
echo === babel fallback + dev === > ws_babel.log
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
del /q ws_dev.log >nul 2>&1
set NEXT_SWC_DISABLED=1
start /min cmd /c "set NEXT_SWC_DISABLED=1 && npm.cmd run dev >> ws_dev.log 2>&1"
timeout /t 40 /nobreak >nul
echo === dev log === >> ws_babel.log
type ws_dev.log >> ws_babel.log
echo BABEL_DONE >> ws_babel.log
