import paperJson from "@/content/papers/psychology-paper-001.json";
import firstAidJson from "@/content/papers/firstaid-paper-001.json";
import physiologyJson from "@/content/papers/physiology-cell-transport-2026-001.json";
import psychologyPaper2Json from "@/content/papers/psychology-paper-002.json";
import psychologyPaper3Json from "@/content/papers/psychology-paper-003.json";

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

const FALLBACK_PAPERS = [paperJson, psychologyPaper2Json, psychologyPaper3Json, firstAidJson, physiologyJson] as Paper[];

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
    objective: objectiveRows.map((row) => ({ ...row, options: JSON.parse(row.options_json), answerIndex: row.answer_index })),
    structured: structuredRows.map((row) => ({
      id: row.id,
      question: row.question,
      marks: Number(row.marks),
      markingGuide: JSON.parse(row.marking_guide_json),
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
    return rows.map((row) => ({
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
  } catch {
    return summarizeFallbacks(courseUnit, includeAll);
  }
}

