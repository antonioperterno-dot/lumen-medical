import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const papersDirectory = "content/papers";
const files = (await readdir(papersDirectory))
  .filter((file) => file.endsWith(".json"))
  .map((file) => path.join(papersDirectory, file));
let failed = false;
for (const file of files) {
  let paper;
  try {
    paper = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    console.error(`${file}: invalid JSON`, error);
    failed = true;
    continue;
  }
  if (paper.status !== "published") continue;
  if (!Array.isArray(paper.objective) || !Array.isArray(paper.structured)) {
    console.error(`${file}: objective/structured sections must be arrays`);
    failed = true;
    continue;
  }
  const all = [...paper.objective, ...paper.structured];
  const allIds = all.map((question) => question.id);
  const ids = new Set(allIds);
  const duplicateQuestions = paper.objective.filter((question, index) =>
    paper.objective.slice(0, index).some((prior) =>
      prior.question?.trim().toLowerCase().replace(/\\s+/g, " ") ===
      question.question?.trim().toLowerCase().replace(/\\s+/g, " "),
    ),
  );
  const invalidQuestions = paper.objective.filter(
    (question) =>
      !question.id ||
      typeof question.question !== "string" ||
      !question.question.trim() ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 5 ||
      question.options.some((option) => typeof option !== "string" || !option.trim()) ||
      !Number.isInteger(question.answerIndex) ||
      question.answerIndex < 0 ||
      question.answerIndex >= question.options.length ||
      typeof question.explanation !== "string" ||
      question.explanation.trim().length < 15
  );
  const invalidStructured = paper.structured.filter(
    (question) =>
      !question.id ||
      typeof question.question !== "string" ||
      !question.question.trim() ||
      !Array.isArray(question.markingGuide) ||
      question.markingGuide.length === 0 ||
      typeof question.modelAnswer !== "string" ||
      !question.modelAnswer.trim()
  );
  const valid =
    paper.objective.length > 0 &&
    paper.structured.length > 0 &&
    ids.size === all.length &&
    allIds.every((id) => typeof id === "string" && id.length > 0) &&
    invalidQuestions.length === 0 &&
    invalidStructured.length === 0 &&
    duplicateQuestions.length === 0;
  console.log(
    `${paper.id}: ${paper.objective.length} objective, ${paper.structured.length} structured, ${valid ? "valid" : `INVALID (${invalidQuestions.length} objective, ${invalidStructured.length} structured, ${duplicateQuestions.length} duplicate stems)`}`,
  );
  if (!valid) failed = true;
}
if (failed) process.exit(1);
