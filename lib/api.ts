import type {
  ApiEnvelope,
  Category,
  ProgressMeta,
  ProgressSummary,
  QuizMeta,
  QuizQuestion,
  Resource,
  ResourceMeta,
} from "./types";

/**
 * Thin, typed client for the three API microservices.
 * Rule of thumb: components never call fetch() directly, they call these.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ResourcePayload = ApiEnvelope<Resource[], ResourceMeta>;
export type SingleResourcePayload = ApiEnvelope<Resource, ResourceMeta>;
export type QuizPayload = ApiEnvelope<QuizQuestion[], QuizMeta>;
export type ProgressPayload = ApiEnvelope<ProgressSummary, ProgressMeta>;

/** Builds `/api/x?a=1&b=2`, skipping empty values. */
export function apiUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Firebase Auth ID token in the Authorization header.
 * /api/progress and /api/quiz verify it with firebase-admin; without it they
 * answer politely with a "local mode" payload instead of a 401, because a
 * student who never signed in must still be able to study.
 */
function authHeaders(
  idToken?: string | null,
): Record<string, string> | undefined {
  return idToken ? { Authorization: `Bearer ${idToken}` } : undefined;
}

async function request<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 12000, ...rest } = init;

  // Safari keeps a pending fetch alive basically forever on a dead network.
  // We abort so the skeleton turns into the cached copy instead of spinning.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(rest.headers ?? {}),
      },
    });

    if (!res.ok) {
      throw new ApiError(`Request failed: ${res.status} ${url}`, res.status);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function getJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  return request<T>(url, { method: "GET", timeoutMs });
}

export function postJson<T>(
  url: string,
  body: unknown,
  timeoutMs = 12000,
): Promise<T> {
  return request<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
    // Progress writes must never be served from an HTTP cache.
    cache: "no-store",
    timeoutMs,
  });
}

/* -------------------------------------------------------------------------- */
/* Endpoint helpers                                                            */
/* -------------------------------------------------------------------------- */

export function fetchResources(params: {
  category?: string;
  trending?: boolean;
  q?: string;
  limit?: number;
  include?: "categories" | "counts" | "all";
}): Promise<ResourcePayload> {
  return getJson<ResourcePayload>(apiUrl("/api/resources", params));
}

export function fetchResource(id: string): Promise<SingleResourcePayload> {
  return getJson<SingleResourcePayload>(
    `/api/resources/${encodeURIComponent(id)}`,
  );
}

export function fetchDailyQuiz(params: {
  category?: string;
  count?: number;
  date?: string;
}): Promise<QuizPayload> {
  return getJson<QuizPayload>(apiUrl("/api/quiz", params));
}

/** GET the signed-in student's progress summary. */
export function fetchProgress(
  idToken?: string | null,
): Promise<ProgressPayload> {
  return request<ProgressPayload>("/api/progress", {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(idToken),
  });
}

/** Fire-and-forget sync of the local mirror up to Firestore. */
export function pushProgress(
  body: unknown,
  idToken?: string | null,
): Promise<ProgressPayload> {
  return request<ProgressPayload>("/api/progress", {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
    headers: authHeaders(idToken),
  });
}

/** Grades happen on the device; only the attempt is posted. */
export function pushQuizAttempts(
  body: unknown,
  idToken?: string | null,
): Promise<ApiEnvelope<unknown, QuizMeta>> {
  return request<ApiEnvelope<unknown, QuizMeta>>("/api/quiz", {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
    headers: authHeaders(idToken),
  });
}

/** Categories + counts in one hop (same microservice, so one round trip). */
export function fetchCategoryIndex(): Promise<ResourcePayload> {
  return fetchResources({ include: "all", limit: 24 });
}
