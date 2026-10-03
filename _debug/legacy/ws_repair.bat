@echo off
cd /d "%~dp0"
echo === reinstall workbox chain === > ws_repair.log
call npm.cmd install --no-audit --no-fund @apideck/better-ajv-errors workbox-build workbox-webpack-plugin next-pwa --loglevel=warn >> ws_repair.log 2>&1
echo REPAIR_EXIT=%ERRORLEVEL% >> ws_repair.log
echo REPAIR_DONE >> ws_repair.log
