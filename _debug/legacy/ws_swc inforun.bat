@echo off
cd /d "%~dp0"
call node ws_swcinfo.mjs > ws_swcinfo.log 2>&1
echo INFO_EXIT=%ERRORLEVEL% >> ws_swcinfo.log
