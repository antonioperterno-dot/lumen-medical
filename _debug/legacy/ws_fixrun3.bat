@echo off
cd /d "%~dp0"
echo === approve + fix3 === > ws_fix3.log
call npm.cmd approve-scripts --allow-scripts-pending >> ws_fix3.log 2>&1
echo APPROVE_EXIT=%ERRORLEVEL% >> ws_fix3.log
call node ws_fix3.mjs >> ws_fix3.log 2>&1
echo FIX3_EXIT=%ERRORLEVEL% >> ws_fix3.log
echo === typecheck4 === >> ws_fix3.log
call npm.cmd run typecheck >> ws_fix3.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_fix3.log
echo FIX3_DONE >> ws_fix3.log
