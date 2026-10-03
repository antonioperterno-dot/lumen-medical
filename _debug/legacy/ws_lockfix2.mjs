import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const lockPath = path.join(root, "package-lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const P = lock.packages;
// @types/estree 0.0.39 has no deps — restore the entry so arborist never tries to dedupe against {}
P["node_modules/@rollup/pluginutils/node_modules/@types/estree"] = {
  version: "0.0.39",
  resolved: "https://registry.npmjs.org/@types/estree/-/estree-0.0.39.tgz",
  integrity: "sha512-EYNwp3bU+98cpU4lAWYYL7gkJOWBGSja2F6kIeqayC/owSSxQbkOpDQ5aN7hVzW6lTgQVs4XAMlIHQwZoKCaD6YQ==",
  license: "MIT",
};
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
console.log("lockfile patched: @types/estree nested entry restored");
// verify integrity hash from registry
try {
  const r = execSync("npm.cmd view @types/estree@0.0.39 dist.integrity 2>&1", { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 90000 });
  console.log("registry integrity: " + r.trim());
} catch (e) { console.log("view fail: " + String(e.stdout || e.message).slice(0, 300)); }
