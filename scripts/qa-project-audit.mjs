export default async function run(page) {
  await page.goto("http://localhost:3002/onboarding");
  await page.evaluate(() => localStorage.setItem("lumen:v1:onboarding-complete", "1"));
  const checks = [];
  for (const [unit, title, paperUrl, questionText] of [
    ["physiology", "Physiology Paper 6", "/papers/physiology-paper-006", "During aerobic respiration, most of the ATP is produced"],
    ["anatomy", "Anatomy Paper 8", "/papers/anatomy-paper-008", "Which nervous system cells produce myelin"],
    ["pharmacology", "Pharmacology Paper 4", "/papers/pharmacology-paper-004", "Which of the following is NOT an NSAID"],
  ]) {
    await page.goto(`http://localhost:3002/papers/unit/${unit}`);
    await page.waitForFunction((needle) => document.body.innerText.includes(needle), title, { timeout: 30000 });
    const listed = await page.evaluate((needle) => document.body.innerText.includes(needle), title);
    await page.goto(`http://localhost:3002${paperUrl}`);
    await page.waitForFunction((needle) => document.body.innerText.includes(needle), questionText, { timeout: 30000 });
    checks.push(await page.evaluate((needle) => ({
      title: document.title,
      questionVisible: document.body.innerText.includes(needle),
      optionButtons: document.querySelectorAll("article.glass button.quiz-option").length,
    }), questionText));
    checks[checks.length - 1].listingVisible = listed;
  }
  return checks;
}
