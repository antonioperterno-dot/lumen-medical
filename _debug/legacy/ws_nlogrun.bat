@echo off
cd /d "%~dp0"
call node ws_nlog.mjs > ws_nlog.log 2>&1
