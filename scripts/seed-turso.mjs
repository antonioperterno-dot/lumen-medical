#!/usr/bin/env node
/**
 * ===========================================================================
 * LUMEN — seed the Turso (libSQL) catalogue
 * ===========================================================================
 *   npm run seed:turso
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local (the npm
 * script loads that file with `node --env-file`).
 *
 * The CREATE TABLE statements below mirror lib/turso/schema.ts, which is the
 * source of truth the app reads at runtime. Keep the two in step when the shape
 * changes; the script is idempotent (IF NOT EXISTS + INSERT OR REPLACE), so it
 * is safe to re-run after every schema change.
 *
 * The seed content carries real markdown bodies, which is what makes the reader
 * worth testing offline: `body_md` only ever comes from Turso, never from the
 * bundled fallback catalogue.
 */

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error(
    [
      "Turso is not configured.",
      "Add these two lines to .env.local:",
      '  TURSO_DATABASE_URL="libsql://..."',
      '  TURSO_AUTH_TOKEN="..."',
      "Get them with:  turso db show <db> --url   /   turso db tokens create <db>",
    ].join("\n"),
  );
  process.exit(1);
}

const db = createClient({ url, authToken });

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS categories (
     id           TEXT PRIMARY KEY,
     slug         TEXT NOT NULL UNIQUE,
     name         TEXT NOT NULL,
     description  TEXT,
     icon         TEXT,
     accent       TEXT NOT NULL DEFAULT '#39FF88',
     sort_order   INTEGER NOT NULL DEFAULT 0,
     created_at   TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug)`,
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
  `CREATE TABLE IF NOT EXISTS quiz_questions (
     id            TEXT PRIMARY KEY,
     category_slug TEXT NOT NULL,
     prompt        TEXT NOT NULL,
     options_json  TEXT NOT NULL,
     answer_index  INTEGER NOT NULL,
     explanation   TEXT,
     difficulty    TEXT NOT NULL DEFAULT 'medium',
     created_at    TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_category ON quiz_questions (category_slug)`,
  `CREATE TABLE IF NOT EXISTS guidelines (
     id           TEXT PRIMARY KEY,
     title        TEXT NOT NULL,
     issuer       TEXT NOT NULL,
     summary      TEXT,
     version      TEXT,
     effective_on TEXT,
     is_uganda    INTEGER NOT NULL DEFAULT 0,
     updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
];

const CATEGORIES = [
  ["cat_pharm", "pharmacology", "Pharmacology", "Drug actions, prescribing and safety", "💊", 1],
  ["cat_psych", "psychology", "Psychology", "Mind, behaviour and patient communication", "🧠", 2],
  ["cat_physio", "physiology", "Physiology", "Systems, transport and homeostasis", "🫀", 3],
  ["cat_anat", "anatomy", "Anatomy", "Gross anatomy, neuroanatomy, limbs", "🦴", 4],
  ["cat_first", "first-aid", "First Aid", "Emergencies, triage and resuscitation", "🩹", 5],
  ["cat_nursing", "nursing", "Nursing", "Patient care, assessment and clinical skills", "🩺", 6],
  ["cat_micro", "microbiology", "Microbiology", "Pathogens, infection and antimicrobial care", "🔬", 7],
  ["cat_journ", "medical-journals", "Medical Journals", "Landmark papers and recent literature", "📰", 8],
];

/* ------------------------------------------------------------------ *
 * Seed content
 * ------------------------------------------------------------------ */

/** ISO timestamp `days` days in the past — spreads `updated_at` realism. */
const daysAgo = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * Resource rows, mirroring the ids/subtitles/reading times of the bundled
 * fallback catalogue so the app looks identical online and offline:
 * [id, category_slug, title, subtitle, summary, body_md, reading_time, level, is_trending, updated_at]
 * `body_md` uses only the subset lib/markdown.ts renders: ##/### headings,
 * paragraphs, - bullets, 1. numbered lists, > quotes and !! callouts.
 */
const RESOURCES = [
  [
    "res_acs_01",
    "cardiology",
    "Acute Coronary Syndrome",
    "STEMI vs NSTEMI",
    "Risk stratification, door-to-balloon time and thrombolysis where PCI is unavailable.",
    `## Recognise it in the first two minutes
Central crushing chest pain radiating to the left arm or jaw, with sweating, nausea or breathlessness. In any adult over 40 with hypertension, diabetes, smoking or HIV on older ART, **think ACS before gastritis**.

### The 12-lead ECG decides
- **ST elevation** in two contiguous leads — STEMI. Time-critical.
- **ST depression or T-wave inversion** — NSTEMI or unstable angina.
- A normal ECG does **not** exclude ACS. Repeat it every 15–30 minutes while pain persists.

!! Time is muscle. Target door-to-balloon under 90 minutes; if PCI is unavailable, aim for thrombolysis within 30 minutes of arrival.

### Immediate management
1. Aspirin 300 mg chewed, unless there is a true allergy.
2. Oxygen only if SpO2 falls below 90% — routine oxygen harms.
3. Nitrates for pain if systolic BP is above 90 mmHg and there is no right ventricular infarct.
4. Morphine titrated for ongoing pain.
5. Reperfusion: primary PCI if deliverable within 120 minutes, otherwise thrombolysis per the national protocol.

### Thrombolysis checklist
- Confirm the **time of symptom onset** — the 12-hour window runs from onset, not from arrival.
- Contraindications: recent stroke, active bleeding, severe uncontrolled hypertension, suspected aortic dissection.
- Reassess pain and ECG at 60–90 minutes; falling pain and resolving ST elevation suggest reperfusion.

> Document door time, ECG time and needle time. The audit is how the system improves.`,
    8,
    "core",
    1,
    daysAgo(0),
  ],
  [
    "res_hf_02",
    "cardiology",
    "Heart Failure Management",
    "Acute decompensation",
    "Wet vs dry, warm vs cold, and when to reach for furosemide.",
    `## Orient the patient with two questions
*Wet or dry?* asks about congestion. *Warm or cold?* asks about perfusion. That grid decides management before any echo is available.

### Wet and warm (the majority)
Congested but perfusing well. Diurese and monitor.
- Furosemide 40 mg IV if diuretic-naive; double the usual oral dose if already on one.
- Aim for 0.5–1 mL/kg/hour of urine output.
- Daily weight is more honest than a glance at the ankles.

### Wet and cold
Congested and hypoperfusing — the sickest group. Careful unloading and inotropes; most of these patients need referral.

### Dry and warm
Compensated chronic heart failure. Build up guideline-directed therapy:
1. ACE inhibitor or ARB.
2. Beta-blocker, started only once euvolaemic.
3. Spironolactone if potassium and renal function allow.
4. SGLT2 inhibitor where available and affordable.

### Hunt for the trigger
- Non-adherence to medication or salt restriction.
- Infection — chest, urine, dental.
- Anaemia; iron deficiency is common and easily missed.
- Arrhythmia — feel the pulse, get an ECG.

!! Never start a beta-blocker in a patient who is still wet. Treat the congestion first.`,
    11,
    "core",
    0,
    daysAgo(3),
  ],

  [
    "res_murmur_03",
    "cardiology",
    "Murmur Recognition",
    "Bedside manoeuvres",
    "Handgrip, Valsalva and squatting — what each one does to each murmur.",
    `## Three questions at the bedside
Where in the cardiac cycle? Where does it radiate? What does a dynamic manoeuvre do? Answer those and you rarely need the echo first.

### Systolic murmurs
- **Aortic stenosis** — ejection systolic, right second intercostal space, radiating to the carotids; slow-rising pulse, soft second heart sound.
- **Mitral regurgitation** — pansystolic, loudest at the apex, radiating to the axilla.
- **Ventricular septal defect** — harsh pansystolic at the left sternal edge.

### Diastolic murmurs
- **Mitral stenosis** — mid-diastolic rumble at the apex with a loud first heart sound; almost always rheumatic, which still matters in East Africa.
- **Aortic regurgitation** — early diastolic at the left sternal edge, collapsing pulse, wide pulse pressure.

### Manoeuvres that change what you hear
- **Handgrip** raises afterload: louder mitral and aortic regurgitation, softer aortic stenosis.
- **Valsalva phase 2** lowers preload: louder hypertrophic cardiomyopathy; softer aortic stenosis and mitral regurgitation.
- **Squatting** raises preload: louder aortic stenosis and mitral regurgitation.
- **Standing** lowers preload: louder hypertrophic cardiomyopathy.

!! Hypertrophic cardiomyopathy is the murmur that gets louder while the others fade. A young athlete who syncopises with a systolic murmur needs referral, not reassurance.`,
    14,
    "core",
    1,
    daysAgo(0),
  ],
  [
    "res_stroke_04",
    "neurology",
    "Acute Ischaemic Stroke",
    "Thrombolysis window",
    "NIHSS scoring and the 4.5-hour alteplase window in a resource-limited setting.",
    `## Time is brain
Every minute of untreated large-vessel occlusion costs roughly two million neurons. The first job is not diagnosis — it is the clock.

### Do this in the first ten minutes
1. Check the glucose. Hypoglycaemia mimics stroke and is instantly reversible.
2. Establish the **time of onset** — when the patient was last seen well.
3. Score the NIHSS to quantify the deficit and allow comparison over time.
4. Non-contrast CT to exclude haemorrhage before any thrombolysis.

### The thrombolysis window
- Alteplase within **4.5 hours** of onset in eligible patients.
- Exclusions to check: BP above 185/110, recent surgery, anticoagulation with a raised INR, platelets below 100, active bleeding.
- Lower the BP below 185/110 before thrombolysis, then keep it below 180/105 for 24 hours.

### When thrombolysis is not available
- Aspirin 300 mg after haemorrhage is excluded (and after 24 hours if thrombolysis was given).
- Admit to a stroke unit or the nearest facility with nursing care; aspiration pneumonia kills more than the infarct itself.
- Swallow screen before any oral intake.

> Stroke mimics to keep in mind: hypoglycaemia, seizure with Todd's palsy, migraine with aura, conversion disorder.

!! In a resource-limited setting the biggest gains are simple: glucose, BP control, swallow screen and early mobilisation.`,
    10,
    "core",
    1,
    daysAgo(0),
  ],

  [
    "res_seiz_05",
    "neurology",
    "Seizure vs Syncope",
    "History that decides",
    "The three questions that separate epileptic from vasovagal events.",
    `## Three questions that decide
Most "fits" that reach a ward are syncope. The history separates them better than any test.

1. **What happened before?** Syncope usually warns — dizziness, tunnel vision, nausea, sweating. Seizures may have an aura, a rising feeling from the stomach, or no warning at all.
2. **What did the body do?** Brief stiffening then a few clonic jerks is common in vasovagal syncope. Prolonged, asymmetric or focal jerking points to epilepsy.
3. **What happened after?** Post-ictal confusion lasting minutes to hours strongly suggests seizure. Recovery within seconds after lying flat suggests syncope.

### Supporting features
- **Lateral tongue bite** favours seizure; a tip-of-tongue bite favours syncope.
- Cyanosis and frothing at the mouth favour seizure.
- Injury from the fall is common in both — do not over-read it.
- Urinary incontinence happens in both and proves little.

### First seizure: what to check
- Glucose, sodium, calcium, magnesium.
- Pregnancy test in women of childbearing age — eclampsia changes everything.
- Malaria film in a febrile patient; cerebral malaria is a common cause here.
- HIV status and, if positive, consider a CNS opportunistic infection.

> Driving, swimming and working at heights are the safety conversations that actually prevent harm.`,
    7,
    "core",
    0,
    daysAgo(5),
  ],
  [
    "res_csf_06",
    "neurology",
    "CSF Interpretation",
    "Meningitis patterns",
    "Cell counts, glucose ratio and protein across bacterial, viral and TB meningitis.",
    `## The three numbers that matter
Cell count with differential, glucose (always with a paired serum glucose) and protein. Interpret them together, never alone.

### Typical patterns
- **Bacterial** — neutrophils dominate, glucose low (below 40% of serum or under 2.2 mmol/L), protein high.
- **Viral** — lymphocytes dominate, glucose normal, protein normal or mildly raised.
- **TB** — lymphocytes dominate, glucose low, protein often very high; the fluid may look clear and pass for viral disease if you only glance at it.
- **Cryptococcal** — lymphocytes, low glucose, raised protein, raised opening pressure; the antigen test confirms.

### Before you call it viral
- Has the patient already had antibiotics? Partially treated bacterial meningitis turns lymphocytic.
- Is there a raised opening pressure, focal deficit or reduced consciousness? Image first when it is safe to delay the LP.
- Do not forget the **paired serum glucose** — a CSF glucose is uninterpretable alone.

!! In Uganda, a first CSF in an adult with fever must trigger consideration of TB and cryptococcus, not only bacterial meningitis.

### Treatment pearls
- Start empirical antibiotics immediately after (or even before) the LP if the patient is sick; do not delay for imaging.
- Adjunctive dexamethasone is reasonable in suspected pneumococcal meningitis, given with the first antibiotic dose.
- Send CSF for Xpert MTB/RIF and cryptococcal antigen where available.`,
    9,
    "core",
    1,
    daysAgo(1),
  ],

  [
    "res_cardphys_07",
    "physiology",
    "Cardiac Cycle & Pressure-Volume",
    "Wiggers diagram",
    "Walk the Wiggers diagram once and never memorise it again.",
    `## Wiggers in seven steps
Walk the diagram once from left to right and it stops being something to memorise.

1. **Atrial systole** — the "kick". A small volume addition, but important at high heart rates.
2. **Isovolumetric contraction** — the mitral valve has closed, the aortic has not opened. Pressure spikes, volume fixed.
3. **Rapid ejection** — the aortic valve opens, volume falls steeply.
4. **Reduced ejection** — pressure begins to fall while the aortic valve is still open.
5. **Isovolumetric relaxation** — aortic valve closed, mitral not yet open. Pressure plummets, volume fixed.
6. **Rapid filling** — the mitral valve opens; most filling happens passively here.
7. **Diastasis** — slow filling before the next atrial kick.

### Read the pressure-volume loop like a story
- Bottom-right corner: end-diastolic volume — the preload.
- Left edge: end-systolic volume; the width of the loop is the stroke volume.
- The area inside the loop is the stroke work.
- A line joining end-systolic points at different afterloads is the end-systolic pressure-volume relationship — contractility.

### What changes what
- **More preload** widens the loop to the right.
- **More afterload** narrows the loop and raises end-systolic volume.
- **More contractility** shifts the loop up and to the left.

> The same diagram explains why a failing heart dilates: it moves right and flattens, trading efficiency for output.`,
    12,
    "core",
    0,
    daysAgo(6),
  ],
  [
    "res_renal_08",
    "physiology",
    "Renal Handling of Sodium",
    "Nephron segments",
    "Where each diuretic acts, and why that produces its side-effect profile.",
    `## Follow the sodium, place the diuretic
About 65% of filtered sodium is reabsorbed in the proximal tubule, 25% in the thick ascending limb, and the remainder in the distal tubule and collecting duct. Each diuretic class blocks one of those segments — and inherits that segment's side-effect profile.

### Segment by segment
- **Proximal convoluted tubule** — sodium is reclaimed with glucose, amino acids and bicarbonate. Carbonic anhydrase inhibitors such as acetazolamide act here; metabolic acidosis limits their use.
- **Thick ascending limb** — the diluting segment. The Na-K-2Cl cotransporter is the target of loop diuretics such as furosemide. Blocking it causes hypokalaemia, hypocalcaemia and ototoxicity at high doses.
- **Distal convoluted tubule** — thiazides block the Na-Cl cotransporter and cause hypokalaemia, hypercalcaemia, hyponatraemia and raised uric acid.
- **Collecting duct** — aldosterone drives sodium reabsorption in exchange for potassium. Spironolactone competes with aldosterone; watch for hyperkalaemia, especially alongside an ACE inhibitor.

### Correlations that show up in exams
- Loop diuretics are weak antihypertensives but strong diuretics; thiazides are the reverse.
- Diuretic resistance often means the distal nephron has hypertrophied — block it twice (loop plus thiazide).
- Any diuretic plus an NSAID plus an ACE inhibitor is the classic "triple whammy" for acute kidney injury.

!! In a patient on furosemide, the urine output chart is the most useful investigation of the first 24 hours.`,
    10,
    "core",
    0,
    daysAgo(7),
  ],

  [
    "res_resp_09",
    "physiology",
    "Oxygen–Haemoglobin Curve",
    "Right and left shifts",
    "Bohr, Haldane and 2,3-BPG in one page.",
    `## One curve, three influences
The curve is sigmoid because binding is cooperative: the first oxygen molecule makes the next one easier to bind. That is what lets haemoglobin load in the lung and unload in tissue.

### What shifts it right (unloads oxygen)
- Raised **2,3-BPG** — chronic anaemia, hypoxia, altitude.
- **Acidosis** (the Bohr effect) — exercising muscle becomes acidic.
- **Hypercapnia** — carbon dioxide reduces oxygen affinity (the Haldane effect).
- **Pyrexia** — fever drives oxygen off the carrier.

Think *exercise*: the tissue that needs oxygen most creates exactly this environment.

### What shifts it left (holds oxygen)
- Alkalosis, hypothermia, low 2,3-BPG in banked blood, fetal haemoglobin, methaemoglobin and carboxyhaemoglobin.
- In carbon monoxide poisoning the curve looks normal to the pulse oximeter while oxygen delivery collapses — treat the patient, not the saturation.

### Numbers worth knowing
- P50 is about 26 mmHg under standard conditions.
- A right shift raises P50; oxygen is released more readily.
- A left shift lowers P50; oxygen is held tighter and tissue delivery suffers.

> Draw it once with labelled axes: the shallow bottom, the steep middle where most delivery happens, and the flat top that protects against mild hypoventilation.`,
    6,
    "core",
    1,
    daysAgo(0),
  ],
  [
    "res_brach_10",
    "anatomy",
    "Brachial Plexus",
    "Roots to branches",
    "Roots, trunks, divisions, cords, branches — with a mnemonic that holds.",
    `## Roots, trunks, divisions, cords, branches
The names run lateral to medial and follow the anatomy in order: **R**oots, **T**runks, **D**ivisions, **C**ords, **B**ranches — *Read That Damn Cadaver Book*.

### Roots and trunks
- C5 and C6 join to form the **upper trunk**.
- C7 continues alone as the **middle trunk**.
- C8 and T1 form the **lower trunk**.
- Each trunk splits into anterior and posterior divisions.

### Cords and their branches
- Posterior divisions unite into the **posterior cord** — radial and axillary nerves.
- Anterior divisions of the upper and middle trunks form the **lateral cord** — musculocutaneous nerve and the lateral head of the median nerve.
- The anterior division of the lower trunk continues as the **medial cord** — ulnar nerve and the medial head of the median nerve.

### Clinical patterns to recognise
- **Erb's palsy (C5–C6)** — the upper trunk. The arm hangs in "waiter's tip": adducted, internally rotated, elbow extended, wrist flexed.
- **Klumpke's palsy (C8–T1)** — the lower trunk. A clawed hand, with or without Horner's syndrome because T1 carries the sympathetic fibres.
- **Winged scapula** — the long thoracic nerve (C5–C7), a direct branch of the roots rather than of any cord.

!! Test the plexus with movement, not sensation alone: abduction (C5), elbow flexion (C6), wrist extension (C6–C7), finger flexion (C8), finger abduction (T1).`,
    13,
    "core",
    1,
    daysAgo(1),
  ],

  [
    "res_femtri_11",
    "anatomy",
    "Femoral Triangle",
    "Contents & borders",
    "NAVEL, the borders, and clinical relevance to femoral access.",
    `## Borders you can find by hand
- **Superior** — the inguinal ligament.
- **Lateral** — the medial border of sartorius.
- **Medial** — the medial border of adductor longus.
- Floor: iliopsoas laterally and pectineus medially. Roof: fascia lata, pierced by the great saphenous vein.

### Contents: NAVEL, lateral to medial
1. Femoral **N**erve — outside the femoral sheath, so a femoral nerve block sits lateral to the artery.
2. Femoral **A**rtery — the midline of the triangle; this is the pulse you feel.
3. Femoral **V**ein — medial to the artery, inside the sheath.
4. **E**mpty space — the femoral canal, and the site of femoral hernias.
5. **L**ymphatics — nodes along the medial wall, enlarged in infection or malignancy of the leg.

### Why it matters clinically
- **Femoral access** — puncture the artery 1–2 cm below the mid-inguinal point, needle aiming slightly medially and superiorly.
- **Femoral hernia** — a lump below and lateral to the pubic tubercle; the narrow ring makes strangulation a real risk.
- **Saphenous nerve injury** — it runs with the saphenous vein, the vein commonly harvested for bypass grafting.
- **Femoral nerve block** — warn the patient about quadriceps weakness before they try to walk.

> Landmark: the femoral artery lies halfway between the anterior superior iliac spine and the pubic symphysis, a finger's breadth below the inguinal ligament.`,
    8,
    "core",
    0,
    daysAgo(8),
  ],
  [
    "res_airway_12",
    "first-aid",
    "Airway Management",
    "A–B–C drill",
    "Head-tilt, chin-lift, OPAs, and when to reach for a supraglottic device.",
    `## The first thirty seconds
Look for chest movement, listen for air at the mouth, feel for breath. If all three are absent in an unresponsive patient, the airway is the problem until proven otherwise.

### Open the airway
- **Head-tilt, chin-lift** in adults with no suspected neck injury.
- **Jaw thrust** when the cervical spine is at risk — trauma, falls, road traffic crashes.
- Remove visible blood, vomit or dentures; sweep only what you can see.

### Keep it open
- **Oropharyngeal airway (OPA)** — measure from the corner of the mouth to the angle of the jaw. Only in a patient with no gag reflex; otherwise it provokes vomiting.
- **Nasopharyngeal airway (NPA)** — tolerated with a gag reflex. Avoid in suspected base-of-skull fracture.
- **Supraglottic device** — the workhorse rescue when intubation is not immediately available.

### When to reach for more
1. Failure to maintain a patent airway with basic adjuncts.
2. A need for prolonged ventilation or airway protection.
3. A predicted difficult airway — make a plan and get a second pair of hands.

!! A patient who can talk has a patent airway. Reassess constantly; the airway open now may not be open in five minutes.

### Oxygen and ventilation
- High-flow oxygen by non-rebreather mask while you prepare.
- Two-person bag-valve-mask ventilation is far more effective than one; watch the chest rise, not the bag.
- In cardiac arrest, compressions and airway management happen together, not in sequence.`,
    9,
    "essential",
    1,
    daysAgo(0),
  ],

  [
    "res_shock_13",
    "first-aid",
    "Recognising Shock Early",
    "Compensated vs not",
    "Capillary refill, mentation and urine output before the BP falls.",
    `## Shock is a diagnosis of perfusion, not of blood pressure
Blood pressure is the last thing to fall in a young patient because compensation is powerful. By the time the systolic pressure drops, a lot has already been lost.

### Look for the compensation
- **Heart rate** — early tachycardia; bradycardia in hypovolaemia is late and ominous.
- **Capillary refill** — press the sternum or a fingertip for five seconds; normal is under three seconds.
- **Mentation** — anxiety, then drowsiness. A patient who is "just tired" may be underperfusing the brain.
- **Urine output** — under 0.5 mL/kg/hour in an adult is a red flag.
- **Skin** — cool peripheries, sweating and mottling over the knees.

### Classify while you resuscitate
1. **Hypovolaemic** — bleeding, vomiting, diarrhoea, burns.
2. **Distributive** — sepsis, anaphylaxis, spinal injury.
3. **Cardiogenic** — myocardial infarction, arrhythmia, valve failure.
4. **Obstructive** — tension pneumothorax, tamponade, massive pulmonary embolism.

### Immediate steps
- Two large-bore cannulae; warmed crystalloid 20 mL/kg in hypovolaemic and septic shock, reassessing after each bolus.
- Stop external bleeding; get the patient to a facility that can control internal bleeding.
- In the febrile patient think malaria and sepsis — blood cultures where possible, antibiotics within the hour.
- In trauma with distended neck veins and a quiet chest, act on tension pneumothorax before any imaging.

!! A normal blood pressure is not reassurance. Perfusion is what you are treating.`,
    7,
    "essential",
    1,
    daysAgo(0),
  ],
  [
    "res_anaph_14",
    "first-aid",
    "Anaphylaxis Protocol",
    "Adrenaline dosing",
    "IM adrenaline 0.5 mg, site, and repeat interval — the drill you must not fumble.",
    `## Recognise it early
Sudden onset, rapidly progressing, with **airway, breathing or circulatory** compromise — usually with skin or mucosal change, though skin signs are absent in up to a fifth of cases. Common triggers: drugs, foods, insect stings, latex.

### The dose that must be automatic
- **Adrenaline 0.5 mg intramuscularly** (0.5 mL of 1:1000) into the **anterolateral thigh** in an adult.
- Repeat every 5 minutes if there is no improvement.
- A child receives 0.01 mg/kg, maximum 0.5 mg.
- The anterolateral thigh absorbs faster than the deltoid or buttock.

### Then, in parallel
1. Remove the trigger where possible; call for help early.
2. High-flow oxygen. Sit the patient up if breathless; lay flat with legs raised if hypotensive.
3. IV crystalloid 500–1000 mL over 15–30 minutes.
4. Adjuncts: chlorpheniramine and hydrocortisone — but never before adrenaline.

### What kills people
- **Delay** in giving adrenaline, or the wrong dose or route.
- Standing the patient up during a reaction.
- Discharge without observation: biphasic reactions can occur 6–12 hours later.

!! Every anaphylaxis patient leaves with an adrenaline plan and written instructions. The next exposure may happen where nobody is trained.`,
    5,
    "essential",
    0,
    daysAgo(4),
  ],

  [
    "res_lancet_15",
    "medical-journals",
    "Malaria in Sub-Saharan Africa",
    "Lancet review",
    "Current artemisinin combination therapy outcomes across East Africa.",
    `## The bottom line
Artemisinin combination therapy has transformed malaria outcomes across East Africa, but progress stalls where resistance emerges. The review's practical message is about **access and diagnostics**, not a new molecule.

### What the evidence supports
- **Test before you treat** every febrile patient. Rapid diagnostic tests keep antimalarials for those who have malaria and redirect the rest — typhoid, dengue, urinary infection, pneumonia.
- **Full weight-based ACT dosing**, taken with an adequate fat-containing meal so lumefantrine is absorbed.
- **Severe malaria** — IV artesunate is the treatment of choice, followed by a full oral ACT course once the patient can swallow.
- **Mass distribution of long-lasting insecticidal nets** remains the single most cost-effective intervention in the region.

### The resistance signal worth watching
- Partial artemisinin resistance is documented in the Greater Mekong subregion; markers such as pfKelch13 are monitored because East Africa will not be insulated forever.
- If a treated patient still has fever and parasitaemia at day 3, suspect resistance or a sub-therapeutic dose before blaming the drug.

### What the paper asks of clinicians
1. Use microscopy or an RDT in every febrile case; clinical diagnosis alone badly over-diagnoses malaria.
2. Report treatment failure — a signal seen early is a disaster avoided.
3. Remember co-infection: HIV, TB and malaria travel together in this region.

> The next gains will come from delivery: diagnostics in the periphery, adherence support, and no stock-outs where the drugs are actually needed.`,
    16,
    "advanced",
    1,
    daysAgo(2),
  ],
  [
    "res_nejm_16",
    "medical-journals",
    "Hypertension in Low-Resource Settings",
    "NEJM",
    "Single-pill combination therapy and what it changes in practice.",
    `## The bottom line
Most patients who need blood-pressure treatment in low-resource settings need it simpler, not cleverer. This review argues that **single-pill combination therapy** prevents more strokes and heart attacks than any new agent.

### Why single-pill combinations work here
- Fewer tablets to buy, carry and take — adherence improves the moment the regimen stops being complicated.
- One titration decision instead of two.
- The usual pairing is a calcium channel blocker with a thiazide-like diuretic, or an ACE inhibitor or ARB with a diuretic, adjusted to what is actually available.

### What the trial data show
- Starting with a low-dose **two-drug** combination controls BP faster, with fewer side effects, than starting one drug and adding later — a step doctors often delay for years.
- Morning dosing is the pragmatic default; the dosing hour matters far less than the patient actually taking the tablet.

### Practical points raised
1. Confirm the diagnosis: measure properly after five minutes sitting, both arms, on at least two visits unless the pressure is severely raised.
2. Assess risk: age, smoking, diabetes, renal function, urine albumin and evidence of left ventricular hypertrophy.
3. Treat to a target, usually below 140/90 mmHg, if tolerated.
4. Invest in cheap follow-up — the biggest failure of hypertension care here is the patient who disappears.

> A district hospital does not need the newest antihypertensive. It needs a reliable supply of two or three trusted drugs and a patient who keeps coming back.`,
    14,
    "advanced",
    0,
    daysAgo(9),
  ],

  [
    "res_moh_17",
    "clinical-guidelines",
    "Uganda MoH Malaria Protocol",
    "2024 edition",
    "Test-and-treat, ACT choice, and severe malaria referral triggers.",
    `## Test and treat, then follow the rules
The national protocol is built on diagnostics and clear thresholds. Know them and you will manage malaria better than most visitors from richer systems.

### Uncomplicated falciparum malaria
- First line: **artemether–lumefantrine (AL)** by weight, twice daily for three days, taken with food.
- Alternatives where AL is unavailable or not tolerated: dihydroartemisinin–piperaquine or artesunate–amodiaquine.
- Check G6PD status before **primaquine**; it is used where radical cure is indicated and the patient is G6PD-sufficient.
- Do not use monotherapy. Resistance was built on it once and will be again.

### Severe malaria
- **IV artesunate** is the treatment of choice; artemether intramuscularly or quinine are second line where artesunate is unavailable.
- Pre-referral treatment: rectal artesunate for children who cannot take oral medication and cannot reach a facility quickly.
- Referral triggers: repeated convulsions, inability to drink, persistent vomiting, severe anaemia, dark urine, reduced consciousness, respiratory distress, or a child not improving after 24 hours.

### Follow-up that matters
1. Repeat the blood film or RDT if fever persists at day 3.
2. Check haemoglobin for late anaemia after severe malaria.
3. Reinforce prevention: nets, indoor residual spraying where available, and prophylaxis for specific high-risk groups as guided.

!! Stock-outs hurt more than resistance in the short term. If your first-line drug runs out, tell the district store immediately — silence costs lives.`,
    12,
    "core",
    1,
    daysAgo(0),
  ],
  [
    "res_who_18",
    "clinical-guidelines",
    "WHO Essential Medicines",
    "2025 list",
    "The core medicines a district hospital in Uganda should always hold.",
    `## Why an essential medicines list is a survival document
The WHO list names the medicines a basic health system must hold at all times, in the forms that actually get used. A district hospital that keeps this core set can manage the overwhelming majority of its patients.

### A core set for medicine, obstetrics and paediatrics
- **Infections:** amoxicillin, ceftriaxone, metronidazole, doxycycline, ciprofloxacin; artemether–lumefantrine; TB combinations; antiretrovirals including TLD.
- **Pain and fever:** paracetamol, ibuprofen, and morphine for severe pain — the list treats palliative care as essential, not optional.
- **Cardiovascular:** a thiazide, amlodipine, an ACE inhibitor; aspirin and a statin; metoprolol and digoxin where indicated.
- **Obstetrics:** oxytocin, misoprostol, magnesium sulphate, labetalol or hydralazine, dexamethasone for preterm labour.
- **Paediatrics:** oral rehydration salts with zinc, dispersible amoxicillin, vitamin A, artesunate for severe malaria.
- **Emergency adjuncts:** adrenaline for anaphylaxis, oxygen and intravenous fluids.

### How the list changes practice
1. It guides procurement so a small budget buys the drugs that save the most lives.
2. It insists on age-appropriate formulations — dispersible tablets for children, not halved adult tablets.
3. It is revised every two years; check which version you are teaching from.

> When a drug is unavailable, ask whether a listed alternative can do the same job before improvising. That habit keeps care evidence-based when the shelf is bare.`,
    15,
    "core",
    0,
    daysAgo(10),
  ],

  [
    "res_tb_19",
    "clinical-guidelines",
    "TB Treatment Guidelines",
    "DST and regimen",
    "Diagnosis with Xpert MTB/RIF and the standard 2RHZE/4RH regimen.",
    `## Diagnosis first
- **Xpert MTB/RIF** on sputum is the first-line test: it detects M. tuberculosis and rifampicin resistance in about two hours.
- Send a second specimen if the first is negative and suspicion remains high; smear-negative TB is common.
- Test every TB patient for **HIV** and link to ART.
- Extrapulmonary TB — lymph node, pleural, spinal, meningeal — usually needs aspirate or biopsy material for the same molecular test.

### Standard regimen for new pulmonary TB
1. **Intensive phase, 2 months:** rifampicin, isoniazid, pyrazinamide and ethambutol (2RHZE), daily.
2. **Continuation phase, 4 months:** rifampicin and isoniazid (4RH), daily.
3. Fixed-dose combination tablets improve adherence and cut the tablet count whenever available.

### What changes the plan
- If Xpert or culture shows rifampicin resistance, refer to DR-TB services; never patch a failing first-line regimen.
- Children and pregnant women get weight-adjusted dosing; ethambutol is considered safe in pregnancy.
- **Interactions:** rifampicin is a powerful enzyme inducer. Adjust dolutegravir-containing ART and give pyridoxine with isoniazid to prevent neuropathy.

### Monitoring
- Sputum at 2 months and at the end of treatment.
- Visual acuity for ethambutol, liver function if unwell, and clinical drug-intake checks — adherence is the strongest predictor of cure.

!! TB is a disease of contact tracing: screen the household, especially children and anyone with HIV.`,
    11,
    "core",
    1,
    daysAgo(1),
  ],
  [
    "res_hiv_20",
    "clinical-guidelines",
    "HIV ART Initiation",
    "Test and start",
    "Same-day initiation, TLD regimen and adherence counselling.",
    `## Test and start, same day
Every person who tests HIV-positive starts treatment regardless of CD4 count. Earlier treatment is better for the patient and dramatically reduces transmission.

### The regimen
- First line: **TLD** — tenofovir, lamivudine and dolutegravir, one tablet daily.
- Dolutegravir is effective, well tolerated and forgiving of an occasional missed dose.
- Adjust in specific situations: space iron and calcium supplements away from dolutegravir, and double-dose it twice daily when given with rifampicin for TB.

### Before and at initiation
1. Confirm the diagnosis per the national algorithm — never start lifelong therapy on a single rapid test alone.
2. Baseline: creatinine, haemoglobin, hepatitis B status, TB screen, pregnancy status and blood pressure.
3. Screen for opportunistic infection: TB symptoms, cryptococcal antigen in advanced disease, careful neurological review.
4. Start cotrimoxazole prophylaxis and give pyridoxine if also on isoniazid for TB.

### Counselling that keeps people on treatment
- Why adherence matters even when they feel perfectly well.
- Which side effects demand a return visit: a rash with fever, yellow eyes, worsening weakness.
- Disclosure, partner testing and prevention options, including condoms and pre-exposure prophylaxis for partners.
- The refill date, written down, with a plan for travel or relocation.

!! In advanced disease with headache and confusion, think cryptococcal meningitis before assuming treatment failure.`,
    10,
    "core",
    0,
    daysAgo(6),
  ],

];

/** [id, category_slug, prompt, options, answerIndex, explanation, difficulty] */
const QUIZ = [
  [
    "q_01",
    "cardiology",
    "Which manoeuvre increases the intensity of the murmur of aortic stenosis?",
    ["Valsalva phase 2", "Squatting to standing", "Handgrip", "None of the above"],
    3,
    "Aortic stenosis is a left-sided outflow murmur. Handgrip and squatting increase preload/afterload and affect other murmurs, but none of those manoeuvres reliably increase AS intensity. AS classically decreases with Valsalva and standing.",
    "medium",
  ],
  [
    "q_02",
    "neurology",
    "Bacterial meningitis CSF typically shows which pattern?",
    [
      "High lymphocytes, normal glucose, mildly raised protein",
      "High neutrophils, low glucose, high protein",
      "High neutrophils, normal glucose, normal protein",
      "High lymphocytes, low glucose, very high protein",
    ],
    1,
    "Bacterial: neutrophilic pleocytosis, glucose < 40% of serum (or < 2.2 mmol/L), protein markedly raised. Viral is lymphocytic with normal glucose. TB sits in between, classically lymphocytic with low glucose.",
    "easy",
  ],
  [
    "q_03",
    "physiology",
    "A rightward shift of the oxygen–haemoglobin dissociation curve is caused by:",
    ["Alkalosis", "Hypothermia", "Increased 2,3-BPG", "Decreased CO2"],
    2,
    'A right shift means haemoglobin releases oxygen more readily to tissue. Causes: raised 2,3-BPG, acidosis, hypercapnia, pyrexia. Think "exercise" — the tissues that need oxygen most create exactly this environment.',
    "easy",
  ],
  [
    "q_04",
    "first-aid",
    "What is the adult IM adrenaline dose for anaphylaxis?",
    ["0.1 mg", "0.5 mg", "1 mg", "2 mg"],
    1,
    "0.5 mg (0.5 mL of 1:1000 solution) intramuscularly into the anterolateral thigh. Repeat at 5-minute intervals if there is no improvement. The IV route is only for monitored settings.",
    "easy",
  ],
  [
    "q_05",
    "anatomy",
    "Which structure does NOT pass through the femoral triangle?",
    [
      "Femoral nerve",
      "Femoral vein",
      "Femoral artery",
      "Great saphenous vein",
    ],
    3,
    "NAVEL: Nerve, Artery, Vein, Empty space, Lymphatics — running lateral to medial. The great saphenous vein drains into the femoral vein via the saphenous opening, but does not traverse the triangle as a contained structure.",
    "medium",
  ],
  [
    "q_06",
    "clinical-guidelines",
    "Per current WHO and Uganda MoH guidance, first-line treatment for uncomplicated P. falciparum malaria is:",
    [
      "Chloroquine monotherapy",
      "Artemether–lumefantrine (ACT)",
      "Sulfadoxine–pyrimethamine",
      "Amodiaquine monotherapy",
    ],
    1,
    "Artemisinin-based combination therapy is first line. In Uganda the standard is artemether–lumefantrine (AL) for uncomplicated falciparum malaria, dosed by weight for three days. Monotherapy is no longer appropriate because of resistance.",
    "easy",
  ],

  [
    "q_07",
    "cardiology",
    "A patient with a suspected STEMI presents at a facility without PCI. The ideal window for thrombolysis is:",
    ["Within 30 minutes", "Within 4 hours", "Within 12 hours", "Within 24 hours"],
    2,
    'Thrombolysis is indicated within 12 hours of symptom onset when PCI cannot be delivered within 120 minutes. Earlier is better — the greatest benefit is in the first 2 hours ("golden hour").',
    "medium",
  ],
  [
    "q_08",
    "cardiology",
    "A 12-lead ECG shows ST elevation in leads V1–V4. Which territory is infarcting?",
    ["Inferior", "Anteroseptal", "Lateral", "Posterior"],
    1,
    "V1–V2 are septal and V3–V4 anterior leads, so this is an anteroseptal infarct. Inferior changes appear in II, III and aVF; lateral changes in I, aVL and V5–V6.",
    "medium",
  ],
  [
    "q_09",
    "neurology",
    "A patient arrives 90 minutes after sudden right hemiparesis and aphasia. Glucose is normal. What is the most important next step?",
    ["MRI brain", "Non-contrast CT head", "Lumbar puncture", "Carotid Doppler ultrasound"],
    1,
    "A non-contrast CT excludes haemorrhage before any thrombolysis — it is the only imaging that changes the immediate decision. It may be normal in early ischaemia, and that is acceptable.",
    "medium",
  ],
  [
    "q_10",
    "physiology",
    "Furosemide acts primarily on which nephron segment?",
    [
      "Proximal convoluted tubule",
      "Thick ascending limb of the loop of Henle",
      "Distal convoluted tubule",
      "Collecting duct",
    ],
    1,
    "Loop diuretics block the Na-K-2Cl cotransporter in the thick ascending limb — the diluting segment. That explains the large natriuresis, and also the hypokalaemia, hypocalcaemia and ototoxicity at high doses.",
    "easy",
  ],
  [
    "q_11",
    "anatomy",
    "A mid-shaft humeral fracture injures the nerve that causes wrist drop. Which nerve?",
    ["Axillary", "Radial", "Median", "Ulnar"],
    1,
    "The radial nerve runs in the spiral groove against the humeral shaft. Injury causes wrist drop and weak finger extension, with sensory loss over the dorsum of the first web space.",
    "easy",
  ],
  [
    "q_12",
    "clinical-guidelines",
    "A patient on 2RHZE TB treatment reports burning feet. What is the most likely cause?",
    [
      "Isoniazid-induced peripheral neuropathy",
      "Pyrazinamide hepatotoxicity",
      "Ethambutol optic neuritis",
      "Rifampicin hypersensitivity",
    ],
    0,
    "Isoniazid causes peripheral neuropathy, prevented with pyridoxine (vitamin B6). Ethambutol affects colour vision and acuity; pyrazinamide causes hepatitis and hyperuricaemia; rifampicin turns secretions orange and can cause flu-like syndromes.",
    "medium",
  ],

];

/** [id, title, issuer, summary, version, effective_on, is_uganda, updated_at] */
const GUIDELINES = [
  [
    "gl_ug_malaria",
    "National Malaria Treatment Guidelines",
    "Uganda Ministry of Health",
    "Test-and-treat algorithm, weight-based ACT dosing and severe malaria referral criteria.",
    "2024 edition",
    "2024-04-01",
    1,
    daysAgo(20),
  ],
  [
    "gl_ug_ucg",
    "Uganda Clinical Guidelines (UCG)",
    "Uganda Ministry of Health",
    "The national standard treatment guidelines, from primary-care level upwards.",
    "2023 edition",
    "2023-07-01",
    1,
    daysAgo(30),
  ],
  [
    "gl_ug_hiv",
    "Consolidated Guidelines for HIV Prevention and Treatment",
    "Uganda Ministry of Health",
    "Test-and-start, the TLD regimen, viral-load monitoring and differentiated service delivery.",
    "2023 edition",
    "2023-09-01",
    1,
    daysAgo(28),
  ],
  [
    "gl_ug_tb",
    "National TB and Leprosy Control Programme Manual",
    "Uganda Ministry of Health",
    "Diagnosis with Xpert MTB/RIF, the 2RHZE/4RH regimen, DR-TB referral and contact tracing.",
    "2022 edition",
    "2022-10-01",
    1,
    daysAgo(40),
  ],
  [
    "gl_who_malaria",
    "WHO Guidelines for Malaria",
    "World Health Organization",
    "Consolidated global guidance on ACTs, severe malaria care and vector control, updated continuously.",
    "2024 consolidation",
    "2024-10-01",
    0,
    daysAgo(15),
  ],
  [
    "gl_who_essential",
    "WHO Model List of Essential Medicines",
    "World Health Organization",
    "The core medicines every health system should stock, in age-appropriate formulations.",
    "23rd list",
    "2023-07-01",
    0,
    daysAgo(35),
  ],

];

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

/**
 * UPSERTs rather than INSERT OR REPLACE on purpose: REPLACE fires the
 * `ON DELETE CASCADE` from resources into categories and would briefly wipe the
 * catalogue on every re-run. ON CONFLICT DO UPDATE rewrites rows in place.
 */
const UPSERT = {
  category: `INSERT INTO categories (id, slug, name, description, icon, accent, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      accent = excluded.accent,
      sort_order = excluded.sort_order`,

  resource: `INSERT INTO resources
      (id, category_slug, title, subtitle, summary, body_md, reading_time, level, is_trending, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      category_slug = excluded.category_slug,
      title = excluded.title,
      subtitle = excluded.subtitle,
      summary = excluded.summary,
      body_md = excluded.body_md,
      reading_time = excluded.reading_time,
      level = excluded.level,
      is_trending = excluded.is_trending,
      updated_at = excluded.updated_at`,

  quiz: `INSERT INTO quiz_questions
      (id, category_slug, prompt, options_json, answer_index, explanation, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      category_slug = excluded.category_slug,
      prompt = excluded.prompt,
      options_json = excluded.options_json,
      answer_index = excluded.answer_index,
      explanation = excluded.explanation,
      difficulty = excluded.difficulty`,

  guideline: `INSERT INTO guidelines
      (id, title, issuer, summary, version, effective_on, is_uganda, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      issuer = excluded.issuer,
      summary = excluded.summary,
      version = excluded.version,
      effective_on = excluded.effective_on,
      is_uganda = excluded.is_uganda,
      updated_at = excluded.updated_at`,
};

async function main() {
  console.log("LUMEN seed: applying schema…");
  for (const statement of SCHEMA) {
    await db.execute(statement);
  }

  console.log("LUMEN seed: writing catalogue…");
  // One transaction: the whole catalogue lands, or none of it does.
  await db.batch(
    [
      // Categories first: resources reference them by slug later in the batch.
      ...CATEGORIES.map(([id, slug, name, description, icon, sortOrder]) => ({
        sql: UPSERT.category,
        args: [id, slug, name, description, icon, "#39FF88", sortOrder],
      })),
      ...RESOURCES.map((row) => ({ sql: UPSERT.resource, args: row })),
      ...QUIZ.map(([id, category, prompt, options, answerIndex, explanation, difficulty]) => ({
        sql: UPSERT.quiz,
        args: [
          id,
          category,
          prompt,
          JSON.stringify(options),
          answerIndex,
          explanation,
          difficulty,
        ],
      })),
      ...GUIDELINES.map((row) => ({ sql: UPSERT.guideline, args: row })),
    ],
    "write",
  );

  const [categories, resources, bodies, quiz, guidelines] = await Promise.all([
    db.execute("SELECT COUNT(*) AS n FROM categories"),
    db.execute("SELECT COUNT(*) AS n FROM resources"),
    db.execute("SELECT COUNT(*) AS n FROM resources WHERE body_md IS NOT NULL"),
    db.execute("SELECT COUNT(*) AS n FROM quiz_questions"),
    db.execute("SELECT COUNT(*) AS n FROM guidelines"),
  ]).then((results) => results.map((result) => Number(result.rows[0]?.n ?? 0)));

  console.log("Seed complete:");
  console.log(`  categories      ${categories}`);
  console.log(`  resources       ${resources} (${bodies} with full text)`);
  console.log(`  quiz questions  ${quiz}`);
  console.log(`  guidelines      ${guidelines}`);
  console.log("");
  console.log("Start the app with:  npm run dev");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
