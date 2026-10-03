import { execSync } from "node:child_process";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const log = execSync("npm.cmd install --no-audit --no-fund --loglevel=silly --prefer-offline 2>&1 || true", { encoding: "utf8", shell: "cmd.exe", cwd: root, timeout: 180000, maxBuffer: 40 * 1024 * 1024 });
const lines = log.split("\n");
const idx = lines.findIndex((l) => l.includes("placeDep ROOT @types/estree"));
console.log(lines.slice(Math.max(0, idx - 5), idx + 12).join("\n").slice(0, 4000));

