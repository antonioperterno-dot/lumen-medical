@echo off
cd /d "%~dp0"
echo === scripts + dev === > ws_final.log
call npm.cmd approve-scripts unrs-resolver @firebase/util protobufjs sharp >> ws_final.log 2>&1
echo APPROVE_EXIT=%ERRORLEVEL% >> ws_final.log
call npm.cmd rebuild >> ws_final.log 2>&1
echo REBUILD_EXIT=%ERRORLEVEL% >> ws_final.log
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo === dev server starting === >> ws_final.log
start /min cmd /c "npm.cmd run dev >> ws_dev.log 2>&1"
timeout /t 20 /nobreak >nul
type ws_dev.log >> ws_final.log
echo FINAL_DONE >> ws_final.log
