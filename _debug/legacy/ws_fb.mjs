import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
// firebase/firestore/dist layout: is the wrapper's dist flattened or nested?
import { execSync } from "node:child_process";
try {
  const cmd = `powershell -NoProfile -Command "Get-ChildItem 'node_modules/firebase/firestore' | Format-Table Name, Mode | Out-String; Get-ChildItem 'node_modules/firebase/firestore/dist' | Select-Object -First 25 Name, Length | Format-Table -AutoSize | Out-String; '---firestore-sub---'; Get-ChildItem 'node_modules/firebase/firestore/dist/firestore' -ErrorAction SilentlyContinue | Select-Object -First 10 Name | Format-Table -AutoSize | Out-String; '---index-mjs-head---'; Get-Content 'node_modules/firebase/firestore/dist/index.mjs' -TotalCount 15 -ErrorAction SilentlyContinue | Out-String"`;
  const r = execSync(cmd, { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 60000 });
  out.push(r.slice(0, 3000));
} catch (e) { out.push("scan fail: " + String(e.stdout || e.message).slice(0, 2000)); }
console.log(out.join("\n"));
