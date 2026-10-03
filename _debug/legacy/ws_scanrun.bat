@echo off
cd /d "%~dp0"
call node ws_scan.mjs > ws_scan.log 2>&1
echo SCAN_EXIT=%ERRORLEVEL% >> ws_scan.log
