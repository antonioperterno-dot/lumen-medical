import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
// npm 11 prunes nested entries missing resolved/integrity.
// Restore the three entries from the registry metadata already in the lockfile's packages[""]... no —
// correct versions: read them from npm cache or the registry via `npm view` (network works for metadata).
import { execSync } from "node:child_process";
function view(pkg) {
  const r = execSync(`npm.cmd view ${pkg} version dist.tarball dist.integrity 2>&1`, { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 90000 });
  return r;
}
for (const p of ["@apideck/better-ajv-errors@0.3.1", "ajv@8.6.0", "source-map@0.8.0"]) {
  try { out.push(p + " =>\n" + view(p).slice(0, 600)); }
  catch (e) { out.push(p + " FAIL: " + String(e.stdout || e.message).slice(0, 400)); }
}
console.log(out.join("\n"));



