@echo off
cd /d "%~dp0"
echo === typecheck2 === > ws_verify2.log
call npm.cmd run typecheck >> ws_verify2.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_verify2.log
echo VERIFY_DONE >> ws_verify2.log
