@echo off
cd /d "%~dp0"
echo === probe === > ws_probe.log
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 60 -UseBasicParsing; 'HOME_STATUS=' + $r.StatusCode >> ws_probe.log; ($r.Content.Substring(0, [Math]::Min(1500, $r.Content.Length))) >> ws_probe.log } catch { 'HOME_FAIL=' + $_.Exception.Message >> ws_probe.log }" >> ws_probe.log 2>&1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/resources?limit=3' -TimeoutSec 60 -UseBasicParsing; 'API_STATUS=' + $r.StatusCode >> ws_probe.log; ($r.Content.Substring(0, [Math]::Min(1500, $r.Content.Length))) >> ws_probe.log } catch { 'API_FAIL=' + $_.Exception.Message >> ws_probe.log }" >> ws_probe.log 2>&1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/quiz?count=2' -TimeoutSec 60 -UseBasicParsing; 'QUIZ_STATUS=' + $r.StatusCode >> ws_probe.log; ($r.Content.Substring(0, [Math]::Min(1000, $r.Content.Length))) >> ws_probe.log } catch { 'QUIZ_FAIL=' + $_.Exception.Message >> ws_probe.log }" >> ws_probe.log 2>&1
echo PROBE_DONE >> ws_probe.log
