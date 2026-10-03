@echo off
cd /d "%~dp0"
call node ws_silly.mjs > ws_silly.log 2>&1
echo SILLY_EXIT=%ERRORLEVEL% >> ws_silly.log
