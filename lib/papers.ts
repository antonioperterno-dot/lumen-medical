import paperJson from "@/content/papers/psychology-paper-001.json";
import firstAidJson from "@/content/papers/firstaid-paper-001.json";
import firstAidPaper2Json from "@/content/papers/firstaid-paper-002.json";
import firstAidPaper3Json from "@/content/papers/firstaid-paper-003.json";
import firstAidPaper4Json from "@/content/papers/firstaid-paper-004.json";
import firstAidPaper5Json from "@/content/papers/firstaid-paper-005.json";
import firstAidPaper6Json from "@/content/papers/firstaid-paper-006.json";
import firstAidPaper7Json from "@/content/papers/firstaid-paper-007.json";
import physiologyJson from "@/content/papers/physiology-cell-transport-2026-001.json";
import physiologyPaper2Json from "@/content/papers/physiology-paper-002.json";
import physiologyPaper3Json from "@/content/papers/physiology-paper-003.json";
import physiologyPaper4Json from "@/content/papers/physiology-paper-004.json";
import physiologyPaper5Json from "@/content/papers/physiology-paper-005.json";
import physiologyPaper6Json from "@/content/papers/physiology-paper-006.json";
import anatomyPaper1Json from "@/content/papers/anatomy-paper-001.json";
import anatomyPaper2Json from "@/content/papers/anatomy-paper-002.json";
import anatomyPaper3Json from "@/content/papers/anatomy-paper-003.json";
import anatomyPaper4Json from "@/content/papers/anatomy-paper-004.json";
import anatomyPaper5Json from "@/content/papers/anatomy-paper-005.json";
import anatomyPaper6Json from "@/content/papers/anatomy-paper-006.json";
import anatomyPaper7Json from "@/content/papers/anatomy-paper-007.json";
import anatomyPaper8Json from "@/content/papers/anatomy-paper-008.json";
import microbiologyPaper1Json from "@/content/papers/microbiology-paper-001.json";
import microbiologyPaper2Json from "@/content/papers/microbiology-paper-002.json";
import microbiologyPaper3Json from "@/content/papers/microbiology-paper-003.json";
import microbiologyPaper4Json from "@/content/papers/microbiology-paper-004.json";
import microbiologyPaper5Json from "@/content/papers/microbiology-paper-005.json";
import pharmacologyPaper1Json from "@/content/papers/pharmacology-paper-001.json";
import pharmacologyPaper2Json from "@/content/papers/pharmacology-paper-002.json";
import pharmacologyPaper3Json from "@/content/papers/pharmacology-paper-003.json";
import pharmacologyPaper4Json from "@/content/papers/pharmacology-paper-004.json";
import psychologyPaper2Json from "@/content/papers/psychology-paper-002.json";
import psychologyPaper3Json from "@/content/papers/psychology-paper-003.json";
import psychologyPaper4Json from "@/content/papers/psychology-paper-004.json";
import psychologyPaper5Json from "@/content/papers/psychology-paper-005.json";
import psychologyPaper6Json from "@/content/papers/psychology-paper-006.json";
import psychologyPaper7Json from "@/content/papers/psychology-paper-007.json";
import psychologyPaper8Json from "@/content/papers/psychology-paper-008.json";
import psychologyPaper9Json from "@/content/papers/psychology-paper-009.json";
import psychologyPaper10Json from "@/content/papers/psychology-paper-010.json";

export type PaperObjective = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: string;
};

export type PaperStructured = {
  id: string;
  question: string;
  marks: number;
  markingGuide: string[];
  modelAnswer: string;
};

export type Paper = {
  id: string;
  courseUnit: string;
  title: string;
  level: number;
  status: string;
  publishAt: string;
  durationMinutes: number;
  source: string;
  textbookReference: { label: string; url: string };
  objective: PaperObjective[];
  structured: PaperStructured[];
};

export type PaperSummary = Omit<Paper, "objective" | "structured"> & {
  /** Number of published quizzes in this unit (included in unit-list queries). */
  quizCount?: number;
};

const FALLBACK_PAPERS = [
  paperJson,
  psychologyPaper2Json,
  psychologyPaper3Json,
  psychologyPaper4Json,
  psychologyPaper5Json,
  psychologyPaper6Json,
  psychologyPaper7Json,
  psychologyPaper8Json,
  psychologyPaper9Json,
  psychologyPaper10Json,
  firstAidJson,
  firstAidPaper2Json,
  firstAidPaper3Json,
  firstAidPaper4Json,
  firstAidPaper5Json,
  firstAidPaper6Json,
  firstAidPaper7Json,
  physiologyJson,
  physiologyPaper2Json,
  physiologyPaper3Json,
  physiologyPaper4Json,
  physiologyPaper5Json,
  physiologyPaper6Json,
  anatomyPaper1Json,
  anatomyPaper2Json,
  anatomyPaper3Json,
  anatomyPaper4Json,
  anatomyPaper5Json,
  anatomyPaper6Json,
  anatomyPaper7Json,
  anatomyPaper8Json,
  microbiologyPaper1Json,
  microbiologyPaper2Json,
  microbiologyPaper3Json,
  microbiologyPaper4Json,
  microbiologyPaper5Json,
  pharmacologyPaper1Json,
  pharmacologyPaper2Json,
  pharmacologyPaper3Json,
  pharmacologyPaper4Json,
] as Paper[];

/** Never let a malformed JSON column take down a whole paper page. */
function parseJsonArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

function publishedFallbacks(courseUnit?: string): Paper[] {
  const now = Date.now();
  return FALLBACK_PAPERS.filter((paper) =>
    paper.status === "published" && Date.parse(paper.publishAt) <= now &&
    (!courseUnit || paper.courseUnit === courseUnit),
  );
}

function summarizeFallbacks(courseUnit?: string, includeAll = false): PaperSummary[] {
  const papers = publishedFallbacks(courseUnit).sort((a, b) =>
    Date.parse(b.publishAt) - Date.parse(a.publishAt) || b.level - a.level || b.id.localeCompare(a.id),
  );
  const selected = courseUnit || includeAll
    ? papers
    : [...new Map(papers.map((paper) => [paper.courseUnit, paper])).values()];
  const counts = new Map<string, number>();
  for (const paper of papers) counts.set(paper.courseUnit, (counts.get(paper.courseUnit) ?? 0) + 1);
  return selected.map((paper) => ({
    id: paper.id,
    courseUnit: paper.courseUnit,
    title: paper.title,
    level: paper.level,
    status: paper.status,
    publishAt: paper.publishAt,
    durationMinutes: paper.durationMinutes,
    source: paper.source,
    textbookReference: paper.textbookReference,
    quizCount: counts.get(paper.courseUnit) ?? 1,
  }));
}

function getFallbackPaper(id: string): Paper | null {
  return publishedFallbacks().find((paper) => paper.id === id) ?? null;
}

export async function getPaper(id: string): Promise<Paper | null> {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    return getFallbackPaper(id);
  }

  try {
    const { query, queryOne } = await import("@/lib/turso");

    const paper = await queryOne<{
    id: string;
    course_unit: string;
    title: string;
    level: number;
    status: string;
    publish_at: string;
    duration_minutes: number;
    source: string;
    textbook_label: string;
    textbook_url: string;
  }>(
    `SELECT id, course_unit, title, level, status, publish_at, duration_minutes,
            source, textbook_label, textbook_url
       FROM papers
      WHERE id = ?
        AND status = 'published'
        AND datetime(publish_at) <= datetime('now')
      LIMIT 1`,
    [id],
  );
    if (!paper) return getFallbackPaper(id);

    const [objectiveRows, structuredRows] = await Promise.all([
    query<{ id: string; question: string; options_json: string; answer_index: number; explanation: string; difficulty: string }>(
      `SELECT id, question, options_json, answer_index, explanation, difficulty
         FROM paper_objective_questions WHERE paper_id = ? ORDER BY question_number`,
      [id],
    ),
    query<{ id: string; question: string; marks: number; marking_guide_json: string; model_answer: string }>(
      `SELECT id, question, marks, marking_guide_json, model_answer
         FROM paper_structured_questions WHERE paper_id = ? ORDER BY question_number`,
      [id],
    ),
  ]);

    return {
    id: paper.id,
    courseUnit: paper.course_unit,
    title: paper.title,
    level: Number(paper.level),
    status: paper.status,
    publishAt: paper.publish_at,
    durationMinutes: Number(paper.duration_minutes),
    source: paper.source,
    textbookReference: { label: paper.textbook_label, url: paper.textbook_url },
    // Safe parse: a malformed row in Turso must never 500 the whole paper.
    objective: objectiveRows.map((row) => ({ ...row, options: parseJsonArray(row.options_json), answerIndex: row.answer_index })),
    structured: structuredRows.map((row) => ({
      id: row.id,
      question: row.question,
      marks: Number(row.marks),
      markingGuide: parseJsonArray(row.marking_guide_json),
      modelAnswer: row.model_answer,
    })),
    };
  } catch {
    return getFallbackPaper(id);
  }
}

export async function getPapers(courseUnit?: string, includeAll = false): Promise<PaperSummary[]> {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    return summarizeFallbacks(courseUnit, includeAll);
  }

  try {
    const { query } = await import("@/lib/turso");
    const rows = await query<{
      id: string;
      course_unit: string;
      title: string;
      level: number;
      status: string;
      publish_at: string;
      duration_minutes: number;
      source: string;
      textbook_label: string;
      textbook_url: string;
      quiz_count: number;
    }>(courseUnit
      ? `SELECT id, course_unit, title, level, status, publish_at, duration_minutes,
                source, textbook_label, textbook_url, COUNT(*) OVER () AS quiz_count
           FROM papers
          WHERE status = 'published'
            AND datetime(publish_at) <= datetime('now')
            AND course_unit = ?
          ORDER BY datetime(publish_at) DESC, level DESC, id DESC
          LIMIT 2000`
      : includeAll
      ? `SELECT id, course_unit, title, level, status, publish_at, duration_minutes,
                source, textbook_label, textbook_url,
                COUNT(*) OVER (PARTITION BY course_unit) AS quiz_count
           FROM papers
          WHERE status = 'published'
            AND datetime(publish_at) <= datetime('now')
          ORDER BY datetime(publish_at) DESC, level DESC, id DESC
          LIMIT 2000`
      : `SELECT id, course_unit, title, level, status, publish_at, duration_minutes,
                source, textbook_label, textbook_url, quiz_count
           FROM (
             SELECT id, course_unit, title, level, status, publish_at, duration_minutes,
                    source, textbook_label, textbook_url,
                    COUNT(*) OVER (PARTITION BY course_unit) AS quiz_count,
                    ROW_NUMBER() OVER (
                      PARTITION BY course_unit
                      ORDER BY datetime(publish_at) DESC, level DESC, id DESC
                    ) AS row_number
               FROM papers
              WHERE status = 'published'
                AND datetime(publish_at) <= datetime('now')
           )
          WHERE row_number = 1
          ORDER BY course_unit`,
      courseUnit ? [courseUnit] : [],
    );
    const databasePapers: PaperSummary[] = rows.map((row) => ({
      id: row.id,
      courseUnit: row.course_unit,
      title: row.title,
      level: Number(row.level),
      status: row.status,
      publishAt: row.publish_at,
      durationMinutes: Number(row.duration_minutes),
      source: row.source,
      textbookReference: { label: row.textbook_label, url: row.textbook_url },
      quizCount: Number(row.quiz_count),
    }));

    // Keep bundled published papers visible even when a configured database
    // has not had the new papers imported yet. Database copies take precedence.
    const fallbackPapers = summarizeFallbacks(courseUnit, includeAll);
    const merged = new Map(databasePapers.map((paper) => [paper.id, paper]));
    for (const paper of fallbackPapers) {
      if (!merged.has(paper.id)) merged.set(paper.id, paper);
    }
    const available = [...merged.values()].sort(
      (a, b) => Date.parse(b.publishAt) - Date.parse(a.publishAt) || b.level - a.level || b.id.localeCompare(a.id),
    );
    return courseUnit || includeAll
      ? available
      : [...new Map(available.map((paper) => [paper.courseUnit, paper])).values()];
  } catch {
    return summarizeFallbacks(courseUnit, includeAll);
  }
}

