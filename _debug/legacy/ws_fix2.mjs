import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
const q = (p) => path.join(root, p);
// @firebase/firestore dist listing
for (const d of ["node_modules/@firebase/firestore", "node_modules/@firebase/firestore/dist", "node_modules/firebase/firestore/dist"]) {
  try { out.push(d + " => " + readdirSync(q(d)).slice(0, 25).join(",")); }
  catch (e) { out.push(d + " FAIL: " + e.message); }
}
// unrs-resolver + sharp (the two allow-scripts packages)
for (const d of ["node_modules/unrs-resolver", "node_modules/sharp", "node_modules/protobufjs"]) {
  try {
    const pkg = JSON.parse(readFileSync(q(d + "/package.json"), "utf8"));
    out.push(d + " version=" + pkg.version);
  } catch (e) { out.push(d + " FAIL: " + e.message); }
}
// protobufjs postinstall state: does dist exist?
try { out.push("protobufjs/dist files: " + readdirSync(q("node_modules/protobufjs/dist")).slice(0, 10).join(",")); }
catch (e) { out.push("protobufjs/dist FAIL: " + e.message); }
console.log(out.join("\n"));



