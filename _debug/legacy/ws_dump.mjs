import { readFileSync } from "node:fs";
import path from "node:path";
const p = path.join("C:\\Users\\antonio perterno\\LUMEN", "lib/offline/progress.ts");
const lines = readFileSync(p, "utf8").split("\n");
console.log(lines.slice(115, 200).map((l, i) => `${116 + i}|${l}`).join("\n"));
