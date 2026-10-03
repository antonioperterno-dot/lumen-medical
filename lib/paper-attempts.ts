export type PaperAttempt = { week: string; score: number; completedAt: string };

const STORAGE_KEY = "lumen:v1:paper-attempts";
export const PAPER_ATTEMPTS_CHANGED = "lumen:paper-attempts-changed";

export function currentWeekKey(date = new Date()): string {
  const monday = new Date(date);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export function readPaperAttempts(): Record<string, PaperAttempt> {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, PaperAttempt>;
  } catch {
    return {};
  }
}

export function savePaperAttempt(paperId: string, score: number): void {
  try {
    const attempts = readPaperAttempts();
    attempts[paperId] = { week: currentWeekKey(), score, completedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    window.dispatchEvent(new Event(PAPER_ATTEMPTS_CHANGED));
  } catch {
    // An unavailable local store must not prevent the paper from being submitted.
  }
}
