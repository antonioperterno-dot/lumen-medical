import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const lockPath = path.join(root, "package-lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const P = lock.packages;
// workbox-build needs its own nested copies (it resolves ajv@8 + better-ajv-errors + source-map@0.8 + glob@7)
P["node_modules/workbox-build/node_modules/@apideck/better-ajv-errors"] = {
  version: "0.3.1",
  resolved: "https://registry.npmjs.org/@apideck/better-ajv-errors/-/better-ajv-errors-0.3.1.tgz",
  integrity: "sha512-6RMV31esAxqlDIvVCG/CJxY/s8dFNVOI5w8RWIfDMhjg/iwqnawko9tJXau/leqC4+T1Bu8et99QVWCwU5wk+g==",
  license: "MIT",
};
P["node_modules/workbox-build/node_modules/ajv"] = {
  version: "8.6.0",
  resolved: "https://registry.npmjs.org/ajv/-/ajv-8.6.0.tgz",
  integrity: "sha512-cnUG4NSBiM4YFBxgZIj/In3/6KX+rQ2l2YPRVcvAMQGWEPKuXoPIhxzwqh31jA3IPbI4qEOp/5ILI4ynioXsGQ==",
  license: "MIT",
};
P["node_modules/workbox-build/node_modules/source-map"] = {
  version: "0.8.0",
  resolved: "https://registry.npmjs.org/source-map/-/source-map-0.8.0.tgz",
  integrity: "sha512-d8EqvL+k/SOXCreS/SUzg2ciyHqBBLcN/yuRjFsbvVhHTE2pgei7oAhmPM7kWFbkX6OSMQfUq4KbkF3au9lhYQ==",
  license: "BSD-3-Clause",
};
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
console.log("lockfile patched: 3 nested workbox-build entries restored");
