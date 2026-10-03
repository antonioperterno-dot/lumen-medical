@echo off
cd /d "%~dp0"
call node ws_lockfix2.mjs > ws_lockfix2.log 2>&1
echo LOCKFIX_EXIT=%ERRORLEVEL% >> ws_lockfix2.log
