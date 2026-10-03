@echo off
cd /d "%~dp0"
echo === approve-all + reinstall nested === > ws_final2.log
call npm.cmd approve-scripts @firebase/util protobufjs >> ws_final2.log 2>&1
echo APPROVE_EXIT=%ERRORLEVEL% >> ws_final2.log
call npm.cmd install --no-audit --no-fund --loglevel=warn --prefer-offline >> ws_final2.log 2>&1
echo INSTALL_EXIT=%ERRORLEVEL% >> ws_final2.log
call node ws_checknested.mjs >> ws_final2.log 2>&1
echo FINAL2_DONE >> ws_final2.log
