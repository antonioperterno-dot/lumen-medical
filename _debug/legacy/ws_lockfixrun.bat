@echo off
cd /d "%~dp0"
call node ws_lockfix.mjs > ws_lockfix.log 2>&1
echo LOCKFIX_EXIT=%ERRORLEVEL% >> ws_lockfix.log
echo === install === >> ws_lockfix.log
call npm.cmd install --no-audit --no-fund --loglevel=warn --prefer-offline >> ws_lockfix.log 2>&1
echo INSTALL_EXIT=%ERRORLEVEL% >> ws_lockfix.log
echo LOCKFIX_DONE >> ws_lockfix.log
