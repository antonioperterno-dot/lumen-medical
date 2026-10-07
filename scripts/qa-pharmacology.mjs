export default async function run(page) {
  await page.goto("http://localhost:3002/onboarding");
  await page.evaluate(() =>
    localStorage.setItem("lumen:v1:onboarding-complete", "1"),
  );
  await page.goto("http://localhost:3002/papers/unit/pharmacology");
  await page.waitForFunction(
    () => document.body.innerText.includes("Pharmacology Paper 1"),
    null,
    { timeout: 30000 },
  );
  const archive = await page.evaluate(() => ({
    title: document.title,
    paperVisible: document.body.innerText.includes("Pharmacology Paper 1"),
    noQuizzes: document.body.innerText.includes("No quizzes published yet"),
  }));
  await page.goto("http://localhost:3002/papers/pharmacology-paper-001");
  await page.waitForFunction(
    () =>
      document.body.innerText.includes(
        "Teratogenicity is a harmful drug effect",
      ),
    null,
    { timeout: 30000 },
  );
  const player = await page.evaluate(() => ({
    questionVisible: document.body.innerText.includes(
      "Teratogenicity is a harmful drug effect",
    ),
    answerButtons: document.querySelectorAll("article.glass button.quiz-option")
      .length,
  }));
  return { archive, player };
}
