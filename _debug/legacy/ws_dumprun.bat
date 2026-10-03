@echo off
cd /d "%~dp0"
call node ws_dump.mjs > ws_dump.log 2>&1
echo DUMP_EXIT=%ERRORLEVEL% >> ws_dump.log
