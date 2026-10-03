import { existsSync, statSync, readFileSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
const f = path.join(root, "node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node");
try {
  const st = statSync(f);
  out.push(`size=${st.size} mtime=${st.mtime}`);
} catch (e) { out.push("stat fail: " + e.message); }
// check the binary header — real node addon starts with MZ + PE
try {
  const buf = readFileSync(f).subarray(0, 4);
  out.push("magic bytes: " + buf.toString("hex") + " (want 4d5a9000 = MZ)");
} catch (e) { out.push("read fail: " + e.message); }
// node version + arch sanity
out.push("node: " + process.version + " arch: " + process.arch);
// does plain node ffi load work? try next's own fallback check
try {
  const r = execSync('node -e "require(\'@next/swc-win32-x64-msvc\'); console.log(\'loads ok\')" 2>&1', { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 60000 });
  out.push("direct load: " + r.slice(0, 400));
} catch (e) { out.push("direct load fail: " + String(e.stdout || e.message).slice(0, 500)); }
console.log(out.join("\n"));
