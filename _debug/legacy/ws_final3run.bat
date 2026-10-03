@echo off
cd /d "%~dp0"
echo === add leven+jsonpointer === > ws_final3.log
call npm.cmd install --no-audit --no-fund --loglevel=warn --prefer-offline leven@3.1.0 jsonpointer@5.0.1 >> ws_final3.log 2>&1
echo INSTALL_EXIT=%ERRORLEVEL% >> ws_final3.log
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
del /q ws_dev.log >nul 2>&1
start /min cmd /c "npm.cmd run dev >> ws_dev.log 2>&1"
timeout /t 25 /nobreak >nul
echo === dev log === >> ws_final3.log
type ws_dev.log >> ws_final3.log
echo FINAL3_DONE >> ws_final3.log
