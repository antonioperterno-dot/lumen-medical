@echo off
cd /d "%~dp0"
echo === install missing dep === > ws_repair3.log
call npm.cmd install --no-audit --no-fund --loglevel=warn --package-lock-only @apideck/better-ajv-errors@0.3.7 >> ws_repair3.log 2>&1
echo LOCK_EXIT=%ERRORLEVEL% >> ws_repair3.log
call npm.cmd install --no-audit --no-fund --loglevel=warn --prefer-offline >> ws_repair3.log 2>&1
echo REPAIR_EXIT=%ERRORLEVEL% >> ws_repair3.log
echo REPAIR_DONE >> ws_repair3.log
