@echo off
cd /d "%~dp0"
call node ws_fb.mjs > ws_fb.log 2>&1
echo FB_EXIT=%ERRORLEVEL% >> ws_fb.log
