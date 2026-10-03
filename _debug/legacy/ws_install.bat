@echo off
cd /d "%~dp0"
set npm_config_fetch_retries=8
set npm_config_fetch_retry_mintimeout=20000
set npm_config_fetch_retry_maxtimeout=180000
set npm_config_fetch_timeout=600000
echo === attempt 1 === > ws_install2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn >> ws_install2.log 2>&1
if not errorlevel 1 goto success
echo === attempt 2 === >> ws_install2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn >> ws_install2.log 2>&1
if not errorlevel 1 goto success
echo === attempt 3 === >> ws_install2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn >> ws_install2.log 2>&1
if not errorlevel 1 goto success
echo === attempt 4 === >> ws_install2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn >> ws_install2.log 2>&1
if not errorlevel 1 goto success
echo === attempt 5 === >> ws_install2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn >> ws_install2.log 2>&1
if not errorlevel 1 goto success
echo INSTALL2_FAILED >> ws_install2.log
exit /b 1
:success
echo INSTALL2_DONE 0 >> ws_install2.log
