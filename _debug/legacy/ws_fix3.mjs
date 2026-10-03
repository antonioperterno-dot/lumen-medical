import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const out = [];
// progress.ts: narrow queuePending kind (regex, tolerant of quotes/CRLF)
{
  const p = path.join(root, "lib/offline/progress.ts");
  const b = readFileSync(p, "utf8");
  const a = b.replace(/function queuePending\(kind:\s*string,/, 'function queuePending(kind: PendingWrite["kind"],');
  out.push("progress.ts queuePending: " + (a !== b ? "PATCHED" : "no-change"));
  if (a !== b) writeFileSync(p, a);
}
// api.ts
{
  const p = path.join(root, "lib/api.ts");
  const b = readFileSync(p, "utf8");
  const a = b.replace(/export function fetchCategoryIndex\(\): Promise<[\s\S]*?>\s*\{/, "export function fetchCategoryIndex(): Promise<ResourcePayload> {");
  out.push("api.ts fetchCategoryIndex: " + (a !== b ? "PATCHED" : "no-change"));
  if (a !== b) writeFileSync(p, a);
}
// firebase/client.ts: check what it imports from now
{
  const p = path.join(root, "lib/firebase/client.ts");
  const b = readFileSync(p, "utf8");
  out.push("client.ts imports: " + JSON.stringify(b.split("\n").slice(0, 8).join(" | ")));
}
console.log(out.join("\n"));

