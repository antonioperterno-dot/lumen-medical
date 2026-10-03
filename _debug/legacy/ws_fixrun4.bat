@echo off
cd /d "%~dp0"
echo === fix4 === > ws_fix4.log
call node ws_fix3.mjs >> ws_fix4.log 2>&1
echo FIX4_EXIT=%ERRORLEVEL% >> ws_fix4.log
echo === typecheck5 === >> ws_fix4.log
call npm.cmd run typecheck >> ws_fix4.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_fix4.log
echo FIX4_DONE >> ws_fix4.log
