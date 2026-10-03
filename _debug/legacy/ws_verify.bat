@echo off
cd /d "%~dp0"
echo === typecheck === > ws_verify.log
call npm.cmd run typecheck >> ws_verify.log 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL% >> ws_verify.log
echo === icons === >> ws_verify.log
call node scripts\generate-icons.mjs >> ws_verify.log 2>&1
echo ICONS_EXIT=%ERRORLEVEL% >> ws_verify.log
echo VERIFY_DONE >> ws_verify.log
