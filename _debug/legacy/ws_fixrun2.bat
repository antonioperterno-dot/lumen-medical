@echo off
cd /d "%~dp0"
echo === fix2 === > ws_fix2.log
call node ws_fix2.mjs >> ws_fix2.log 2>&1
echo FIX2_EXIT=%ERRORLEVEL% >> ws_fix2.log
echo FIX2_DONE >> ws_fix2.log
