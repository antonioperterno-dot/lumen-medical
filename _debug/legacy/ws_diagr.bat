@echo off
cd /d "%~dp0"
call node ws_diag.mjs > ws_diag.log 2>&1
echo DIAG_EXIT=%ERRORLEVEL% >> ws_diag.log
