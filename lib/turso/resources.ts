import { isTursoConfigured, query, queryOne } from "./client";

/**
 * Typed data-access layer for the Turso resources microservice.
 * Every function degrades gracefully: if Turso is not configured yet the API
 * route returns seed content instead of a 500, so the UI is always browsable.
 */

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  accent: string;
  sort_order: number;
  textbook_url?: string | null;
};

export type Resource = {
  id: string;
  category_slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  body_md?: string | null;
  reading_time: number;
  level: string;
  is_trending: number;
  updated_at: string;
};

export type QuizQuestion = {
  id: string;
  category_slug: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string | null;
  difficulty: string;
};

export type Guideline = {
  id: string;
  title: string;
  issuer: string;
  summary: string | null;
  version: string | null;
  effective_on: string | null;
  is_uganda: number;
  updated_at: string;
};

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  if (!isTursoConfigured) return FALLBACK_CATEGORIES;
  return query<Category>(
    `SELECT id, slug, name, description, icon, accent, sort_order, textbook_url
       FROM categories
      WHERE slug IN ('pharmacology', 'psychology', 'physiology', 'anatomy', 'first-aid', 'nursing', 'microbiology', 'medical-journals')
      ORDER BY sort_order ASC`,
  );
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  if (!isTursoConfigured) {
    return FALLBACK_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }
  return queryOne<Category>(
    `SELECT id, slug, name, description, icon, accent, sort_order, textbook_url
       FROM categories
      WHERE slug = ?
      LIMIT 1`,
    [slug],
  );
}

/* ------------------------------------------------------------------ *
 * Resources
 * ------------------------------------------------------------------ */

export type ResourceQuery = {
  category?: string;
  trending?: boolean;
  search?: string;
  limit?: number;
  /** Cursor for keyset pagination — pass the last row's id. */
  after?: string;
};

export async function listResources(
  opts: ResourceQuery = {},
): Promise<Resource[]> {
  if (!isTursoConfigured) return filterFallback(opts);

  const where: string[] = [];
  const args: (string | number)[] = [];

  if (opts.category) {
    where.push("category_slug = ?");
    args.push(opts.category);
  }
  if (opts.trending) {
    where.push("is_trending = 1");
  }
  if (opts.search) {
    // LIKE with a leading wildcard is fine at this catalogue size (~thousands
    // of rows). If the catalogue grows, swap for an FTS5 virtual table.
    where.push("(title LIKE ? OR summary LIKE ? OR subtitle LIKE ?)");
    const term = `%${opts.search}%`;
    args.push(term, term, term);
  }
  if (opts.after) {
    where.push("id > ?");
    args.push(opts.after);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  // Cap page size so a bad client can't ask for the whole table.
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  args.push(limit);

  return query<Resource>(
    `SELECT id, category_slug, title, subtitle, summary, reading_time,
            level, is_trending, updated_at
       FROM resources
       ${whereSql}
      ORDER BY is_trending DESC, updated_at DESC, id ASC
      LIMIT ?`,
    args,
  );
}

export async function getResourceById(id: string): Promise<Resource | null> {
  if (!isTursoConfigured) {
    return FALLBACK_RESOURCES.find((r) => r.id === id) ?? null;
  }
  return queryOne<Resource>(
    `SELECT id, category_slug, title, subtitle, summary, body_md,
            reading_time, level, is_trending, updated_at
       FROM resources
      WHERE id = ?
      LIMIT 1`,
    [id],
  );
}

/** Counts per category, used for the "12 topics" subtitles. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!isTursoConfigured) {
    return FALLBACK_RESOURCES.reduce<Record<string, number>>((acc, r) => {
      acc[r.category_slug] = (acc[r.category_slug] ?? 0) + 1;
      return acc;
    }, {});
  }

  const rows = await query<{ category_slug: string; total: number }>(
    `SELECT category_slug, COUNT(*) AS total
       FROM resources
      GROUP BY category_slug`,
  );

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category_slug] = Number(row.total);
    return acc;
  }, {});
}

/** The "Updated today" carousel on the home screen. */
export async function getRecentlyUpdated(limit = 6): Promise<Resource[]> {
  if (!isTursoConfigured) {
    return [...FALLBACK_RESOURCES]
      .sort((a, b) => Number(b.is_trending) - Number(a.is_trending))
      .slice(0, limit);
  }
  return query<Resource>(
    `SELECT id, category_slug, title, subtitle, summary, reading_time,
            level, is_trending, updated_at
       FROM resources
      ORDER BY date(updated_at) DESC, is_trending DESC
      LIMIT ?`,
    [Math.min(Math.max(limit, 1), 25)],
  );
}

/* ------------------------------------------------------------------ *
 * Quiz
 * ------------------------------------------------------------------ */

export async function getQuizQuestions(
  category?: string,
  limit = 5,
): Promise<QuizQuestion[]> {
  if (!isTursoConfigured) return FALLBACK_QUIZ;

  const capped = Math.min(Math.max(limit, 1), 20);
  const sql = category
    ? `SELECT id, category_slug, prompt, options_json, answer_index, explanation, difficulty
         FROM quiz_questions
        WHERE category_slug = ?
        ORDER BY RANDOM()
        LIMIT ?`
    : `SELECT id, category_slug, prompt, options_json, answer_index, explanation, difficulty
         FROM quiz_questions
        ORDER BY RANDOM()
        LIMIT ?`;

  const rows = await query<{
    id: string;
    category_slug: string;
    prompt: string;
    options_json: string;
    answer_index: number;
    explanation: string | null;
    difficulty: string;
  }>(sql, category ? [category, capped] : [capped]);

  return rows.map(toQuizQuestion);
}

function toQuizQuestion(row: {
  id: string;
  category_slug: string;
  prompt: string;
  options_json: string;
  answer_index: number;
  explanation: string | null;
  difficulty: string;
}): QuizQuestion {
  let options: string[] = [];
  try {
    const parsed = JSON.parse(row.options_json);
    if (Array.isArray(parsed)) options = parsed.map(String);
  } catch {
    options = [];
  }
  return {
    id: row.id,
    category_slug: row.category_slug,
    prompt: row.prompt,
    options,
    answerIndex: Number(row.answer_index),
    explanation: row.explanation,
    difficulty: row.difficulty,
  };
}

/* ------------------------------------------------------------------ *
 * Guidelines
 * ------------------------------------------------------------------ */

export async function getGuidelines(limit = 20): Promise<Guideline[]> {
  if (!isTursoConfigured) return [];
  return query<Guideline>(
    `SELECT id, title, issuer, summary, version, effective_on, is_uganda, updated_at
       FROM guidelines
      ORDER BY is_uganda DESC, date(effective_on) DESC
      LIMIT ?`,
    [Math.min(Math.max(limit, 1), 50)],
  );
}

/* ------------------------------------------------------------------ *
 * Fallbacks — used when Turso is unreachable OR unconfigured.
 * The PWA must never show an empty screen in a hospital.
 * ------------------------------------------------------------------ */

const now = () => new Date().toISOString();

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "cat_pharm",
    slug: "pharmacology",
    name: "Pharmacology",
    description: "Drug actions, prescribing and safety",
    icon: "💊",
    accent: "#39FF88",
    sort_order: 1,
  },
  {
    id: "cat_psych",
    slug: "psychology",
    name: "Psychology",
    description: "Mind, behaviour and patient communication",
    icon: "🧠",
    accent: "#39FF88",
    sort_order: 2,
  },
  {
    id: "cat_physio",
    slug: "physiology",
    name: "Physiology",
    description: "Systems, transport and homeostasis",
    icon: "🫀",
    accent: "#39FF88",
    sort_order: 3,
  },
  {
    id: "cat_anat",
    slug: "anatomy",
    name: "Anatomy",
    description: "Gross anatomy, neuroanatomy, limbs",
    icon: "🦴",
    accent: "#39FF88",
    sort_order: 4,
  },
  {
    id: "cat_first",
    slug: "first-aid",
    name: "First Aid",
    description: "Emergencies, triage and resuscitation",
    icon: "🩹",
    accent: "#39FF88",
    sort_order: 5,
  },
  {
    id: "cat_nursing",
    slug: "nursing",
    name: "Nursing",
    description: "Patient care, assessment and clinical skills",
    icon: "🩺",
    accent: "#39FF88",
    sort_order: 6,
  },
  {
    id: "cat_micro",
    slug: "microbiology",
    name: "Microbiology",
    description: "Pathogens, infection and antimicrobial care",
    icon: "🔬",
    accent: "#39FF88",
    sort_order: 7,
  },
  {
    id: "cat_journ",
    slug: "medical-journals",
    name: "Medical Journals",
    description: "Landmark papers and recent literature",
    icon: "📰",
    accent: "#39FF88",
    sort_order: 8,
  },
];

const FALLBACK_RESOURCES: Resource[] = [
  {
    id: "res_acs_01",
    category_slug: "cardiology",
    title: "Acute Coronary Syndrome",
    subtitle: "STEMI vs NSTEMI",
    summary:
      "Risk stratification, door-to-balloon time and thrombolysis where PCI is unavailable.",
    reading_time: 8,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_hf_02",
    category_slug: "cardiology",
    title: "Heart Failure Management",
    subtitle: "Acute decompensation",
    summary: "Wet vs dry, warm vs cold, and when to reach for furosemide.",
    reading_time: 11,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_murmur_03",
    category_slug: "cardiology",
    title: "Murmur Recognition",
    subtitle: "Bedside manoeuvres",
    summary:
      "Handgrip, Valsalva and squatting: what each one does to each murmur.",
    reading_time: 14,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_stroke_04",
    category_slug: "neurology",
    title: "Acute Ischaemic Stroke",
    subtitle: "Thrombolysis window",
    summary:
      "NIHSS scoring and the 4.5-hour alteplase window in a resource-limited setting.",
    reading_time: 10,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_seiz_05",
    category_slug: "neurology",
    title: "Seizure vs Syncope",
    subtitle: "History that decides",
    summary:
      "The three questions that separate epileptic from vasovagal events.",
    reading_time: 7,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_csf_06",
    category_slug: "neurology",
    title: "CSF Interpretation",
    subtitle: "Meningitis patterns",
    summary:
      "Cell counts, glucose ratio and protein across bacterial, viral and TB meningitis.",
    reading_time: 9,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_cardphys_07",
    category_slug: "physiology",
    title: "Cardiac Cycle & Pressure-Volume",
    subtitle: "Wiggers diagram",
    summary: "Walk the Wiggers diagram once and never memorise it again.",
    reading_time: 12,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_renal_08",
    category_slug: "physiology",
    title: "Renal Handling of Sodium",
    subtitle: "Nephron segments",
    summary:
      "Where each diuretic acts, and why that produces its side-effect profile.",
    reading_time: 10,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_resp_09",
    category_slug: "physiology",
    title: "Oxygen–Haemoglobin Curve",
    subtitle: "Right and left shifts",
    summary: "Bohr, Haldane and 2,3-BPG in one page.",
    reading_time: 6,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_brach_10",
    category_slug: "anatomy",
    title: "Brachial Plexus",
    subtitle: "Roots to branches",
    summary:
      "Roots, trunks, divisions, cords and branches, with a mnemonic that holds.",
    reading_time: 13,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_femtri_11",
    category_slug: "anatomy",
    title: "Femoral Triangle",
    subtitle: "Contents & borders",
    summary: "NAVEL, the borders, and clinical relevance to femoral access.",
    reading_time: 8,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_airway_12",
    category_slug: "first-aid",
    title: "Airway Management",
    subtitle: "A–B–C drill",
    summary:
      "Head-tilt, chin-lift, OPAs, and when to reach for a supraglottic device.",
    reading_time: 9,
    level: "essential",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_shock_13",
    category_slug: "first-aid",
    title: "Recognising Shock Early",
    subtitle: "Compensated vs not",
    summary:
      "Capillary refill, mentation and urine output before the BP falls.",
    reading_time: 7,
    level: "essential",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_anaph_14",
    category_slug: "first-aid",
    title: "Anaphylaxis Protocol",
    subtitle: "Adrenaline dosing",
    summary:
      "IM adrenaline 0.5 mg, site and repeat interval: the drill you must not fumble.",
    reading_time: 5,
    level: "essential",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_lancet_15",
    category_slug: "medical-journals",
    title: "Malaria in Sub-Saharan Africa",
    subtitle: "Lancet review",
    summary:
      "Current artemisinin combination therapy outcomes across East Africa.",
    reading_time: 16,
    level: "advanced",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_nejm_16",
    category_slug: "medical-journals",
    title: "Hypertension in Low-Resource Settings",
    subtitle: "NEJM",
    summary: "Single-pill combination therapy and what it changes in practice.",
    reading_time: 14,
    level: "advanced",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_moh_17",
    category_slug: "clinical-guidelines",
    title: "Uganda MoH Malaria Protocol",
    subtitle: "2024 edition",
    summary:
      "Test-and-treat, ACT choice, and severe malaria referral triggers.",
    reading_time: 12,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_who_18",
    category_slug: "clinical-guidelines",
    title: "WHO Essential Medicines",
    subtitle: "2025 list",
    summary:
      "The core medicines a district hospital in Uganda should always hold.",
    reading_time: 15,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
  {
    id: "res_tb_19",
    category_slug: "clinical-guidelines",
    title: "TB Treatment Guidelines",
    subtitle: "DST and regimen",
    summary: "Diagnosis with Xpert MTB/RIF and the standard 2RHZE/4RH regimen.",
    reading_time: 11,
    level: "core",
    is_trending: 1,
    updated_at: now(),
  },
  {
    id: "res_hiv_20",
    category_slug: "clinical-guidelines",
    title: "HIV ART Initiation",
    subtitle: "Test and start",
    summary: "Same-day initiation, TLD regimen and adherence counselling.",
    reading_time: 10,
    level: "core",
    is_trending: 0,
    updated_at: now(),
  },
];

const FALLBACK_QUIZ: QuizQuestion[] = [

  {
    id: "q_01",
    category_slug: "cardiology",
    prompt:
      "Which manoeuvre increases the intensity of the murmur of aortic stenosis?",
    options: [
      "Valsalva phase 2",
      "Squatting to standing",
      "Handgrip",
      "None of the above",
    ],
    answerIndex: 3,
    explanation:
      "Aortic stenosis is a left-sided outflow murmur. Handgrip and squatting increase preload/afterload and affect other murmurs, but none of those manoeuvres reliably increase AS intensity. AS classically decreases with Valsalva and standing.",
    difficulty: "medium",
  },
  {
    id: "q_02",
    category_slug: "neurology",
    prompt: "Bacterial meningitis CSF typically shows which pattern?",
    options: [
      "High lymphocytes, normal glucose, mildly raised protein",
      "High neutrophils, low glucose, high protein",
      "High neutrophils, normal glucose, normal protein",
      "High lymphocytes, low glucose, very high protein",
    ],
    answerIndex: 1,
    explanation:
      "Bacterial: neutrophilic pleocytosis, glucose < 40% of serum (or < 2.2 mmol/L), protein markedly raised. Viral is lymphocytic with normal glucose. TB sits in between, classically lymphocytic with low glucose.",
    difficulty: "easy",
  },
  {
    id: "q_03",
    category_slug: "physiology",
    prompt:
      "A rightward shift of the oxygen–haemoglobin dissociation curve is caused by:",
    options: ["Alkalosis", "Hypothermia", "Increased 2,3-BPG", "Decreased CO2"],
    answerIndex: 2,
    explanation:
      'A right shift means haemoglobin releases oxygen more readily to tissue. Causes: raised 2,3-BPG, acidosis, hypercapnia and pyrexia. Think "exercise": the tissues that need oxygen most create exactly this environment.',
    difficulty: "easy",
  },
  {
    id: "q_04",
    category_slug: "first-aid",
    prompt: "What is the adult IM adrenaline dose for anaphylaxis?",
    options: ["0.1 mg", "0.5 mg", "1 mg", "2 mg"],
    answerIndex: 1,
    explanation:
      "0.5 mg (0.5 mL of 1:1000 solution) intramuscularly into the anterolateral thigh. Repeat at 5-minute intervals if there is no improvement. The IV route is only for monitored settings.",
    difficulty: "easy",
  },
  {
    id: "q_05",
    category_slug: "anatomy",
    prompt: "Which structure does NOT pass through the femoral triangle?",
    options: [
      "Femoral nerve",
      "Femoral vein",
      "Femoral artery",
      "Great saphenous vein",
    ],
    answerIndex: 3,
    explanation:
      "NAVEL: Nerve, Artery, Vein, Empty space and Lymphatics, arranged from lateral to medial. The great saphenous vein drains into the femoral vein via the saphenous opening, but does not traverse the triangle as a contained structure.",
    difficulty: "medium",
  },
  {
    id: "q_06",
    category_slug: "clinical-guidelines",
    prompt:
      "Per current WHO and Uganda MoH guidance, first-line treatment for uncomplicated P. falciparum malaria is:",
    options: [
      "Chloroquine monotherapy",
      "Artemether–lumefantrine (ACT)",
      "Sulfadoxine–pyrimethamine",
      "Amodiaquine monotherapy",
    ],
    answerIndex: 1,
    explanation:
      "Artemisinin-based combination therapy is first line. In Uganda the standard is artemether–lumefantrine (AL) for uncomplicated falciparum malaria, dosed by weight for three days. Monotherapy is no longer appropriate because of resistance.",
    difficulty: "easy",
  },
  {
    id: "q_07",
    category_slug: "cardiology",
    prompt:
      "A patient with a suspected STEMI presents at a facility without PCI. The ideal window for thrombolysis is:",
    options: [
      "Within 30 minutes",
      "Within 4 hours",
      "Within 12 hours",
      "Within 24 hours",
    ],
    answerIndex: 2,
    explanation:
      'Thrombolysis is indicated within 12 hours of symptom onset when PCI cannot be delivered within 120 minutes. Earlier is better. The greatest benefit is in the first 2 hours ("golden hour").',
    difficulty: "medium",
  },
];

/* ------------------------------------------------------------------ *
 * Stable quiz pool + seed exports
 * ------------------------------------------------------------------ */

/**
 * A deterministic question pool for the Daily Quiz.
 *
 * `getQuizQuestions()` shuffles inside SQL (`ORDER BY RANDOM()`), which is
 * right for free-form practice but wrong for a "quiz of the day": the same
 * student reloading the page — and two classmates comparing notes — must see
 * the same questions for that date. This orders by id so the API route can
 * shuffle with a date-seeded PRNG and always land on the same five.
 */
export async function getQuizPool(
  category?: string,
  limit = 60,
): Promise<QuizQuestion[]> {
  if (!isTursoConfigured) {
    return category
      ? FALLBACK_QUIZ.filter((question) => question.category_slug === category)
      : FALLBACK_QUIZ;
  }

  const capped = Math.min(Math.max(limit, 1), 200);
  const sql = category
    ? `SELECT id, category_slug, prompt, options_json, answer_index, explanation, difficulty
         FROM quiz_questions
        WHERE category_slug = ?
        ORDER BY id ASC
        LIMIT ?`
    : `SELECT id, category_slug, prompt, options_json, answer_index, explanation, difficulty
         FROM quiz_questions
        ORDER BY id ASC
        LIMIT ?`;

  const rows = await query<{
    id: string;
    category_slug: string;
    prompt: string;
    options_json: string;
    answer_index: number;
    explanation: string | null;
    difficulty: string;
  }>(sql, category ? [category, capped] : [capped]);

  return rows.map(toQuizQuestion);
}

/**
 * Seed content, exported so the API routes can degrade gracefully when Turso is
 * configured but momentarily unreachable. A student must never face an empty
 * library because of a network blip on the ward.
 */
export const SEED_CATEGORIES = FALLBACK_CATEGORIES;
export const SEED_RESOURCES = FALLBACK_RESOURCES;
export const SEED_QUIZ = FALLBACK_QUIZ;

/** Filters the bundled seed catalogue the way the SQL in listResources() would. */
function filterFallback(opts: ResourceQuery = {}): Resource[] {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const term = opts.search?.toLowerCase();
  return FALLBACK_RESOURCES.filter((r) => {
    if (opts.category && r.category_slug !== opts.category) return false;
    if (opts.trending && r.is_trending !== 1) return false;
    if (
      term &&
      !`${r.title} ${r.summary ?? ""} ${r.subtitle ?? ""}`.toLowerCase().includes(term)
    )
      return false;
    if (opts.after && r.id <= opts.after) return false;
    return true;
  }).slice(0, limit);
}


/** The seed equivalent of listResources(), used by the degraded branch. */
export function filterSeedResources(opts: ResourceQuery = {}): Resource[] {
  return filterFallback(opts);
}
