import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
// ajv@8's deps live hoisted at top level? check
for (const p of ["node_modules/fast-uri/package.json", "node_modules/json-schema-traverse/package.json", "node_modules/require-from-string/package.json", "node_modules/leven/package.json"]) {
  try {
    const j = JSON.parse(readFileSync(path.join(root, p), "utf8"));
    out.push(`TOP ${j.name}@${j.version}`);
  } catch { out.push(`TOP MISS ${p}`); }
}
// nested ajv's own deps
try { out.push("nested ajv children: " + readdirSync(path.join(root, "node_modules/workbox-build/node_modules/ajv/node_modules")).join(",")); }
catch (e) { out.push("nested ajv children: NONE"); }
// better-ajv-errors children
try { out.push("bae children: " + readdirSync(path.join(root, "node_modules/workbox-build/node_modules/@apideck/better-ajv-errors/node_modules")).join(",")); }
catch (e) { out.push("bae children: NONE"); }
// check where `leven` is required from
try {
  const src = readFileSync(path.join(root, "node_modules/workbox-build/node_modules/@apideck/better-ajv-errors/dist/better-ajv-errors.cjs.development.js"), "utf8");
  const lines = src.split("\n").filter((l) => l.includes("require(")).slice(0, 20);
  out.push("bae requires:\n" + lines.join("\n").slice(0, 1500));
} catch (e) { out.push("bae src fail: " + e.message); }
console.log(out.join("\n"));

