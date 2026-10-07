export default async function run(page) {
  await page.goto("http://localhost:3002/onboarding");
  await page.evaluate(() =>
    localStorage.setItem("lumen:v1:onboarding-complete", "1"),
  );
  await page.goto("http://localhost:3002/papers/unit/physiology");
  await page.waitForFunction(
    () => document.body.innerText.includes("Physiology Paper 4"),
    null,
    { timeout: 30000 },
  );
  const archive = await page.evaluate(() => ({
    title: document.title,
    showsPaper4: document.body.innerText.includes("Physiology Paper 4"),
    noQuizzes: document.body.innerText.includes("No quizzes published yet"),
  }));
  await page.goto("http://localhost:3002/papers/physiology-paper-004");
  await page.waitForFunction(
    () =>
      document.body.innerText.includes(
        "The organelle responsible for most cellular energy metabolism",
      ),
    null,
    { timeout: 30000 },
  );
  const player = await page.evaluate(() => ({
    questionVisible: document.body.innerText.includes(
      "The organelle responsible for most cellular energy metabolism",
    ),
    options: document.querySelectorAll("article.glass button.quiz-option")
      .length,
    answerChoices:
      document.querySelectorAll("article.glass button.quiz-option").length > 0,
  }));
  return { archive, player };
}
