@echo off
cd /d "%~dp0"
echo === typecheck6 === > ws_fix5.log
call npm.cmd run typecheck >> ws_fix5.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_fix5.log
echo FIX5_DONE >> ws_fix5.log
