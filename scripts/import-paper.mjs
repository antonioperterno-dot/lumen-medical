#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createClient } from "@libsql/client/web";

const file = process.argv[2];
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!file || !url || !authToken) {
  console.error("Usage: npm run paper:import -- content/papers/paper.json");
  process.exit(1);
}

const paper = JSON.parse(await readFile(file, "utf8"));
const fail = (message) => {
  console.error(`Paper rejected: ${message}`);
  process.exit(1);
};

if (!paper.id || !paper.courseUnit || !paper.title) fail("id, courseUnit and title are required");
if (!['draft', 'published'].includes(paper.status)) fail("status must be explicitly set to 'draft' or 'published'");
if (typeof paper.publishAt !== "string" || !Number.isFinite(Date.parse(paper.publishAt))) fail("publishAt must be a valid ISO date/time");
if (!Number.isInteger(paper.level) || paper.level < 1) fail("level must be a positive whole number");
if (!Number.isInteger(paper.durationMinutes) || paper.durationMinutes < 1) fail("durationMinutes must be a positive whole number");
if (!Array.isArray(paper.objective) || paper.objective.length !== 20) fail("exactly 20 objective questions are required");
if (!Array.isArray(paper.structured) || paper.structured.length !== 5) fail("exactly 5 structured questions are required");
if (!paper.textbookReference || typeof paper.textbookReference.label !== "string" || typeof paper.textbookReference.url !== "string") fail("textbookReference label and url are required");
const questionIds = new Set();
for (const [index, question] of paper.objective.entries()) {
  const validTrueFalse = Array.isArray(question.options) && question.options.length === 2 && question.options[0] === "True" && question.options[1] === "False";
  if (!question.id || !question.question || !Array.isArray(question.options) || (question.options.length !== 4 && !validTrueFalse)) fail(`objective question ${index + 1} must have four choices or True/False options`);
  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.options.length) fail(`objective question ${index + 1} has an invalid answerIndex`);
  if (questionIds.has(question.id)) fail(`question id '${question.id}' is duplicated`);
  questionIds.add(question.id);
}
for (const [index, question] of paper.structured.entries()) {
  if (!question.id || !question.question || !Number.isInteger(question.marks) || !Array.isArray(question.markingGuide)) fail(`structured question ${index + 1} is incomplete`);
  if (questionIds.has(question.id)) fail(`question id '${question.id}' is duplicated`);
  questionIds.add(question.id);
}

const clientUrl = url.startsWith("libsql://")
  ? url.replace(/^libsql:\/\//, "https://")
  : url;
const db = createClient({ url: clientUrl, authToken });
await db.batch([
  { sql: `CREATE TABLE IF NOT EXISTS papers (id TEXT PRIMARY KEY, course_unit TEXT NOT NULL, title TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', publish_at TEXT NOT NULL, duration_minutes INTEGER NOT NULL DEFAULT 30, source TEXT NOT NULL DEFAULT 'admin-upload', textbook_label TEXT NOT NULL, textbook_url TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))` },
  { sql: `CREATE TABLE IF NOT EXISTS paper_objective_questions (id TEXT PRIMARY KEY, paper_id TEXT NOT NULL, question_number INTEGER NOT NULL, question TEXT NOT NULL, options_json TEXT NOT NULL, answer_index INTEGER NOT NULL, explanation TEXT NOT NULL, difficulty TEXT NOT NULL DEFAULT 'medium')` },
  { sql: `CREATE TABLE IF NOT EXISTS paper_structured_questions (id TEXT PRIMARY KEY, paper_id TEXT NOT NULL, question_number INTEGER NOT NULL, question TEXT NOT NULL, marks INTEGER NOT NULL, marking_guide_json TEXT NOT NULL, model_answer TEXT NOT NULL)` },
  { sql: `DELETE FROM paper_objective_questions WHERE paper_id = ?`, args: [paper.id] },
  { sql: `DELETE FROM paper_structured_questions WHERE paper_id = ?`, args: [paper.id] },
  { sql: `DELETE FROM papers WHERE id = ?`, args: [paper.id] },
  { sql: `INSERT INTO papers (id, course_unit, title, level, status, publish_at, duration_minutes, source, textbook_label, textbook_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [paper.id, paper.courseUnit, paper.title, paper.level ?? 1, paper.status ?? "draft", paper.publishAt, paper.durationMinutes ?? 30, paper.source ?? "admin-upload", paper.textbookReference?.label ?? "", paper.textbookReference?.url ?? ""] },
  ...paper.objective.map((question, index) => ({ sql: `INSERT INTO paper_objective_questions (id, paper_id, question_number, question, options_json, answer_index, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: [question.id, paper.id, index + 1, question.question, JSON.stringify(question.options), question.answerIndex, question.explanation ?? "", question.difficulty ?? "medium"] })),
  ...paper.structured.map((question, index) => ({ sql: `INSERT INTO paper_structured_questions (id, paper_id, question_number, question, marks, marking_guide_json, model_answer) VALUES (?, ?, ?, ?, ?, ?, ?)`, args: [question.id, paper.id, index + 1, question.question, question.marks, JSON.stringify(question.markingGuide), question.modelAnswer ?? ""] })),
].map((statement) => ({ ...statement, args: statement.args ?? [] })), "write");

console.log(`Imported ${paper.id}: ${paper.objective.length} objective + ${paper.structured.length} structured questions`);
