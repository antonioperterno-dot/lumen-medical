import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
const root = "C:\\Users\\antonio perterno\\LUMEN";
const log = [];
function patch(rel, fn) {
  const p = path.join(root, rel);
  const before = readFileSync(p, "utf8");
  const after = fn(before);
  if (after !== before) { writeFileSync(p, after); log.push(`PATCHED ${rel}`); }
  else log.push(`SKIP ${rel} (no change)`);
}
// 1. resources.ts: add missing filterFallback if absent
patch("lib/turso/resources.ts", (t) => {
  if (t.includes("function filterFallback")) return t;
  const impl = `\n/** Filters the bundled seed catalogue the way the SQL in listResources() would. */\nfunction filterFallback(opts: ResourceQuery = {}): Resource[] {\n  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);\n  const term = opts.search?.toLowerCase();\n  return FALLBACK_RESOURCES.filter((r) => {\n    if (opts.category && r.category_slug !== opts.category) return false;\n    if (opts.trending && r.is_trending !== 1) return false;\n    if (term && !\`\${r.title} \${r.summary ?? ""} \${r.subtitle ?? ""}\`.toLowerCase().includes(term)) return false;\n    if (opts.after && r.id <= opts.after) return false;\n    return true;\n  }).slice(0, limit);\n}\n`;
  const anchor = "/** The seed equivalent of listResources(), used by the degraded branch. */";
  if (t.includes(anchor)) return t.replace(anchor, impl + "\n" + anchor);
  return t + impl;
});
// 2. offline/progress.ts: narrow kind param
patch("lib/offline/progress.ts", (t) =>
  t.replace("function queuePending(kind: string,", 'function queuePending(kind: PendingWrite["kind"],')
);
// 3. turso/client.ts: default args to []
patch("lib/turso/client.ts", (t) =>
  t.replace(
    "return getTurso().batch(statements, \"write\");",
    'return getTurso().batch(statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })), "write");'
  )
);
// 4. api.ts: relax fetchCategoryIndex return type to ResourcePayload
patch("lib/api.ts", (t) =>
  t.replace(
    "/** Categories + counts in one hop (same microservice, so one round trip). */",
    "/** Categories + counts in one hop (same microservice, so one round trip). */"
  ).replace(
    "export function fetchCategoryIndex(): Promise<{\n  data: Resource[];\n  meta: ResourceMeta & { categories: Category[]; counts: Record<string, number> };\n}> {",
    "export function fetchCategoryIndex(): Promise<ResourcePayload> {"
  )
);
console.log(log.join("\n"));
// 5. inspect firebase install
const fsp = path.join(root, "node_modules/firebase/firestore/dist/index.d.ts");
console.log("firestore types exist: " + existsSync(fsp));
try {
  const pkg = JSON.parse(readFileSync(path.join(root, "node_modules/firebase/package.json"), "utf8"));
  console.log("firebase version: " + pkg.version);
} catch (e) { console.log("firebase pkg read failed: " + e.message); }
try {
  const fp = JSON.parse(readFileSync(path.join(root, "node_modules/@libsql/client/package.json"), "utf8"));
  console.log("libsql version: " + fp.version);
} catch (e) { console.log("libsql pkg read failed: " + e.message); }
// 6. check DailyQuiz exports
const dq = readFileSync(path.join(root, "components/DailyQuiz.tsx"), "utf8");
console.log("has DailyQuizCard: " + dq.includes("export function DailyQuizCard"));
console.log("has default DailyQuiz: " + dq.includes("export default function DailyQuiz"));
