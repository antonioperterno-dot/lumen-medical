@echo off
cd /d "%~dp0"
call node ws_checknested.mjs > ws_nested.log 2>&1
echo NESTED_EXIT=%ERRORLEVEL% >> ws_nested.log
