import { createClient, type Client, type InValue } from "@libsql/client/web";

/**
 * ===========================================================================
 * MICROSERVICE 1 — Turso (libSQL edge) : the "resources" collection
 * ===========================================================================
 * This module owns everything to do with the medical content catalogue:
 * categories, resources, quiz questions and journals.
 *
 * It is deliberately isolated from Firebase. Nothing here imports anything
 * from /lib/firebase, and nothing in /lib/firebase imports this. The two
 * microservices share no code and can be scaled, redeployed or even replaced
 * independently.
 */

declare global {
  // eslint-disable-next-line no-var
  var __lumenTurso: Client | undefined;
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

/** True when the Turso credentials are present. */
export const isTursoConfigured = Boolean(url && authToken);

/**
 * The client is cached on `globalThis` so Next.js hot-reloads in dev don't
 * open a new HTTP connection on every request.
 */
export function getTurso(): Client {
  if (!url || !authToken) {
    throw new Error(
      "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local",
    );
  }

  if (!global.__lumenTurso) {
    const clientUrl = url.startsWith("libsql://")
      ? url.replace(/^libsql:\/\//, "https://")
      : url;
    global.__lumenTurso = createClient({ url: clientUrl, authToken });
  }

  return global.__lumenTurso;
}

/**
 * Runs a parameterised query and normalises libSQL's row objects into plain
 * JS objects. Always use this instead of string-concatenating SQL — the
 * `args` array is bound by libSQL, so user input can never break out.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  const result = await getTurso().execute({ sql, args });
  return result.rows.map((row) => ({ ...row })) as T[];
}

/** Convenience helper for single-row lookups. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

/** Convenience helper for writes (INSERT / UPDATE / DELETE). */
export async function execute(sql: string, args: InValue[] = []) {
  return getTurso().execute({ sql, args });
}

/**
 * Runs a batch of statements as one atomic transaction. libSQL executes these
 * server-side in a single round trip, which matters on the slow connections
 * our students often have.
 */
export async function batch(
  statements: Array<{ sql: string; args?: InValue[] }>,
) {
  return getTurso().batch(statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })), "write");
}
