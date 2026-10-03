/**
 * Barrel export for the Turso microservice.
 * Import from '@/lib/turso' — never reach into the individual files from UI code.
 */
export {
  getTurso,
  isTursoConfigured,
  query,
  queryOne,
  execute,
  batch,
} from "./client";
export {
  getCategories,
  getCategoryBySlug,
  listResources,
  getResourceById,
  getCategoryCounts,
  getRecentlyUpdated,
  getQuizQuestions,
  getQuizPool,
  getGuidelines,
  filterSeedResources,
  SEED_CATEGORIES,
  SEED_RESOURCES,
  SEED_QUIZ,
  type Category,
  type Resource,
  type QuizQuestion,
  type Guideline,
  type ResourceQuery,
} from "./resources";
export { SCHEMA_STATEMENTS, CATEGORY_SEED } from "./schema";
