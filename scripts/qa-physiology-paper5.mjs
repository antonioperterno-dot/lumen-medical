export default async function run(page) {
  await page.goto("http://localhost:3002/onboarding");
  await page.evaluate(() =>
    localStorage.setItem("lumen:v1:onboarding-complete", "1"),
  );
  await page.goto("http://localhost:3002/papers/unit/physiology");
  await page.waitForFunction(
    () => document.body.innerText.includes("Physiology Paper 5"),
    null,
    { timeout: 30000 },
  );
  const archive = await page.evaluate(() => ({
    title: document.title,
    paper5Visible: document.body.innerText.includes("Physiology Paper 5"),
    noQuizzes: document.body.innerText.includes("No quizzes published yet"),
  }));
  await page.goto("http://localhost:3002/papers/physiology-paper-005");
  await page.waitForFunction(
    () => document.body.innerText.includes("Rouleaux formation means"),
    null,
    { timeout: 30000 },
  );
  const player = await page.evaluate(() => ({
    firstQuestionVisible: document.body.innerText.includes(
      "Rouleaux formation means",
    ),
    objectiveQuestionCards: document.querySelectorAll(
      "article.glass button.quiz-option",
    ).length,
    paperFiveHeading: document.body.innerText.includes("Physiology Paper 5"),
  }));
  return { archive, player };
}
