@echo off
cd /d "%~dp0"
echo === fix === > ws_fix.log
call node ws_fix.mjs >> ws_fix.log 2>&1
echo FIX_EXIT=%ERRORLEVEL% >> ws_fix.log
echo === typecheck3 === >> ws_fix.log
call npm.cmd run typecheck >> ws_fix.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_fix.log
echo FIX_DONE >> ws_fix.log
