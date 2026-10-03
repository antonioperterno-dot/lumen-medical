import { readFileSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
// which package has the empty version?
for (const p of ["node_modules/@apideck/better-ajv-errors/package.json", "node_modules/workbox-build/package.json", "node_modules/ajv/package.json"]) {
  try {
    const j = JSON.parse(readFileSync(path.join(root, p), "utf8"));
    out.push(`${p}: name=${j.name} version=${JSON.stringify(j.version)}`);
  } catch (e) { out.push(`${p}: FAIL ${e.message}`); }
}
// find ALL package.json files with empty version
import { execSync } from "node:child_process";
try {
  const cmd = `powershell -NoProfile -Command "Get-ChildItem node_modules -Recurse -Filter package.json -ErrorAction SilentlyContinue | ForEach-Object { try { $j = Get-Content $_.FullName -Raw | ConvertFrom-Json; if (-not $j.version) { $_.FullName } } catch {} } | Select-Object -First 10"`;
  const hit = execSync(cmd, { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 120000 });
  out.push("empty-version pkgs:\n" + hit.slice(0, 2000));
} catch (e) { out.push("scan fail: " + String(e.stdout || e.message).slice(0, 1000)); }
console.log(out.join("\n"));
