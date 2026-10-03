import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
// walk node_modules/@rollup + nested copies, print every pluginutils version
import { execSync } from "node:child_process";
try {
  const cmd = `powershell -NoProfile -Command "$pkgs = Get-ChildItem node_modules/@rollup -Directory -ErrorAction SilentlyContinue; foreach ($p in $pkgs) { $f = Join-Path $p.FullName 'package.json'; if (Test-Path $f) { try { $j = Get-Content $f -Raw | ConvertFrom-Json; Write-Output ($p.Name + ' version=' + $j.version) } catch { Write-Output ($p.Name + ' READFAIL') } } }; $n = Get-ChildItem node_modules/@rollup/pluginutils -Recurse -Filter package.json -ErrorAction SilentlyContinue | Select-Object -First 10; foreach ($x in $n) { Write-Output ('nested: ' + $x.FullName) }"`;
  const hit = execSync(cmd, { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 60000 });
  out.push(hit.slice(0, 2000));
} catch (e) { out.push("scan fail: " + String(e.stdout || e.message).slice(0, 1000)); }
// also check npm ls for pluginutils
try {
  const ls = execSync("npm.cmd ls @rollup/pluginutils --all 2>&1", { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 90000 });
  out.push("npm ls:\n" + ls.slice(0, 2000));
} catch (e) { out.push("npm ls output:\n" + String(e.stdout || e.message).slice(0, 2000)); }
console.log(out.join("\n"));


