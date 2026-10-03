@echo off
cd /d "%~dp0"
echo === repair2 === > ws_repair2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn >> ws_repair2.log 2>&1
echo REPAIR_EXIT=%ERRORLEVEL% >> ws_repair2.log
echo REPAIR_DONE >> ws_repair2.log
