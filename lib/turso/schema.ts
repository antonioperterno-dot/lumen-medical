/**
 * LUMEN — Turso schema (microservice 1: the resources catalogue).
 *
 * This file is the single source of truth for the database shape.
 * `scripts/seed-turso.mjs` executes it, then inserts the starter catalogue.
 *
 * Run with:  npm run seed:turso
 */
export const SCHEMA_STATEMENTS: string[] = [
  // ---------------------------------------------------------------------
  // categories — the seven tiles on the home screen.
  // ---------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS categories (
     id           TEXT PRIMARY KEY,
     slug         TEXT NOT NULL UNIQUE,
     name         TEXT NOT NULL,
     description  TEXT,
     icon         TEXT,
     accent       TEXT NOT NULL DEFAULT '#39FF88',
    textbook_url TEXT,
     sort_order   INTEGER NOT NULL DEFAULT 0,
     created_at   TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories (sort_order)`,

  // ---------------------------------------------------------------------
  // resources — the actual study material.
  // `progress_key` is what /api/progress uses to join Firebase progress
  // against Turso content without either service knowing the other's schema.
  // ---------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS resources (
     id            TEXT PRIMARY KEY,
     category_slug TEXT NOT NULL,
     title         TEXT NOT NULL,
     subtitle      TEXT,
     summary       TEXT,
     body_md       TEXT,
     reading_time  INTEGER NOT NULL DEFAULT 5,
     level         TEXT NOT NULL DEFAULT 'core',
     is_trending   INTEGER NOT NULL DEFAULT 0,
     updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
     FOREIGN KEY (category_slug) REFERENCES categories (slug) ON DELETE CASCADE
   )`,

  `CREATE INDEX IF NOT EXISTS idx_resources_category ON resources (category_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_resources_trending ON resources (is_trending, updated_at DESC)`,

  // ---------------------------------------------------------------------
  // quiz_questions — the daily quiz pool.
  // ---------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS quiz_questions (
     id             TEXT PRIMARY KEY,
     category_slug  TEXT NOT NULL,
     prompt         TEXT NOT NULL,
     options_json   TEXT NOT NULL,
     answer_index   INTEGER NOT NULL,
     explanation    TEXT,
     difficulty     TEXT NOT NULL DEFAULT 'medium',
     created_at     TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE INDEX IF NOT EXISTS idx_quiz_category ON quiz_questions (category_slug)`,

  `CREATE TABLE IF NOT EXISTS papers (
     id               TEXT PRIMARY KEY,
     course_unit      TEXT NOT NULL,
     title            TEXT NOT NULL,
     level            INTEGER NOT NULL DEFAULT 1,
     status           TEXT NOT NULL DEFAULT 'draft',
     publish_at       TEXT NOT NULL,
     duration_minutes INTEGER NOT NULL DEFAULT 30,
     source           TEXT NOT NULL DEFAULT 'admin-upload',
     textbook_label   TEXT NOT NULL,
     textbook_url     TEXT NOT NULL,
     created_at       TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
   )`,

  `CREATE TABLE IF NOT EXISTS paper_objective_questions (
     id             TEXT PRIMARY KEY,
     paper_id       TEXT NOT NULL,
     question_number INTEGER NOT NULL,
     question       TEXT NOT NULL,
     options_json   TEXT NOT NULL,
     answer_index   INTEGER NOT NULL,
     explanation    TEXT NOT NULL,
     difficulty     TEXT NOT NULL DEFAULT 'medium',
     FOREIGN KEY (paper_id) REFERENCES papers (id) ON DELETE CASCADE
   )`,

  `CREATE TABLE IF NOT EXISTS paper_structured_questions (
     id                TEXT PRIMARY KEY,
     paper_id          TEXT NOT NULL,
     question_number   INTEGER NOT NULL,
     question          TEXT NOT NULL,
     marks             INTEGER NOT NULL,
     marking_guide_json TEXT NOT NULL,
     model_answer      TEXT NOT NULL,
     FOREIGN KEY (paper_id) REFERENCES papers (id) ON DELETE CASCADE
   )`,

  `CREATE INDEX IF NOT EXISTS idx_papers_release ON papers (course_unit, status, publish_at)`,

  // ---------------------------------------------------------------------
  // guidelines — clinical guidelines with an issuance date, kept separate
  // from resources because they update on a different cadence.
  // ---------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS guidelines (
     id            TEXT PRIMARY KEY,
     title         TEXT NOT NULL,
     issuer        TEXT NOT NULL,
     summary       TEXT,
     version       TEXT,
     effective_on  TEXT,
     is_uganda     INTEGER NOT NULL DEFAULT 0,
     updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
];

export const CATEGORY_SEED = [
  {
    id: "cat_pharm",
    slug: "pharmacology",
    name: "Pharmacology",
    icon: "💊",
    description: "Drug actions, prescribing and safety",
    sortOrder: 1,
  },
  {
    id: "cat_psych",
    slug: "psychology",
    name: "Psychology",
    icon: "🧠",
    description: "Mind, behaviour and patient communication",
    sortOrder: 2,
  },
  {
    id: "cat_physio",
    slug: "physiology",
    name: "Physiology",
    icon: "🫀",
    description: "Systems, transport and homeostasis",
    sortOrder: 3,
  },
  {
    id: "cat_anat",
    slug: "anatomy",
    name: "Anatomy",
    icon: "🦴",
    description: "Gross anatomy, neuroanatomy, limbs",
    sortOrder: 4,
  },
  {
    id: "cat_first",
    slug: "first-aid",
    name: "First Aid",
    icon: "🩹",
    description: "Emergencies, triage and resuscitation",
    sortOrder: 5,
  },
  {
    id: "cat_nursing",
    slug: "nursing",
    name: "Nursing",
    icon: "🩺",
    description: "Patient care, assessment and clinical skills",
    sortOrder: 6,
  },
  {
    id: "cat_micro",
    slug: "microbiology",
    name: "Microbiology",
    icon: "🔬",
    description: "Pathogens, infection and antimicrobial care",
    sortOrder: 7,
  },
  {
    id: "cat_journ",
    slug: "medical-journals",
    name: "Medical Journals",
    icon: "📰",
    description: "Landmark papers and recent literature",
    sortOrder: 8,
  },
];
