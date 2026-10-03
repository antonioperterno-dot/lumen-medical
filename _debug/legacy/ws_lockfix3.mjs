import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const lockPath = path.join("C:\\Users\\antonio perterno\\LUMEN", "package-lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
lock.packages["node_modules/@rollup/pluginutils/node_modules/@types/estree"].integrity =
  "sha512-EYNwp3bU+98cpU4lAWYYL7Zz+2gryWH1qbdDTidVd6hkiR6weksdbMadyXKXNPEkQFhXM+hVO9ZygomHXp+AIw==";
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
console.log("integrity corrected");
