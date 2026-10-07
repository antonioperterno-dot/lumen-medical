export default async function run(page) {
  await page.goto("http://localhost:3002/onboarding");
  await page.evaluate(() => localStorage.setItem("lumen:v1:onboarding-complete", "1"));
  await page.goto("http://localhost:3002/papers/unit/physiology");
  await page.waitForFunction(() => document.body.innerText.includes("Physiology Paper 2"), null, { timeout: 30000 });
  const physiology = await page.evaluate(() => ({
    title: document.title,
    paper2: document.body.innerText.includes("Physiology Paper 2"),
    paper3: document.body.innerText.includes("Physiology Paper 3"),
    noPublished: document.body.innerText.includes("No quizzes published yet"),
  }));
  await page.goto("http://localhost:3002/papers/unit/anatomy");
  await page.waitForFunction(() => document.body.innerText.includes("Anatomy Paper 3"), null, { timeout: 30000 });
  const anatomy = await page.evaluate(() => ({
    title: document.title,
    paper3: document.body.innerText.includes("Anatomy Paper 3"),
    paper4: document.body.innerText.includes("Anatomy Paper 4"),
    noPublished: document.body.innerText.includes("No quizzes published yet"),
  }));
  await page.goto("http://localhost:3002/papers/anatomy-paper-004");
  await page.waitForFunction(() => document.body.innerText.includes("Which bones form the cranial vault?"), null, { timeout: 30000 });
  const player = await page.evaluate(() => ({
    hasQuestion: document.body.innerText.includes("Which bones form the cranial vault?"),
    hasStructureQuestion: document.body.innerText.includes("temporomandibular joint"),
    options: document.querySelectorAll("article.glass button.quiz-option").length,
  }));
  return { physiology, anatomy, player };
}
