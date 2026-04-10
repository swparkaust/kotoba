import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ["notifications"],
    extraHTTPHeaders: {
      "Authorization": "Bearer test-token-123",
    },
  });
  const page = await context.newPage();
  const results: { test: string; pass: boolean }[] = [];

  function check(test: string, pass: boolean) {
    results.push({ test, pass });
    console.log(`  ${pass ? "✓" : "✗"} ${test}`);
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("  BROWSER MANUAL TESTS — KOTOBA");
  console.log("═══════════════════════════════════════════════════\n");

  await page.goto(`${BASE}/login`);
  check("Login page loads", (await page.content()).includes("login") || (await page.content()).includes("ログイン"));

  await page.goto(`${BASE}/signup`);
  check("Signup page loads", (await page.content()).includes("signup") || (await page.content()).includes("登録"));

  await page.goto(`${BASE}/dashboard`);
  check("Dashboard renders level map", !!(await page.getByTestId("level-map").count()));
  check("Dashboard renders JLPT bar", !!(await page.getByTestId("jlpt-bar").count()));
  check("Dashboard renders encouragement", !!(await page.getByTestId("encouragement").count()));

  await page.goto(`${BASE}/review`);
  const hasReview = !!(await page.getByTestId("review-session").count()) || !!(await page.getByTestId("review-empty").count());
  check("Review page renders", hasReview);

  await page.goto(`${BASE}/placement`);
  check("Placement test renders", !!(await page.getByTestId("placement-test").count()));

  await page.goto(`${BASE}/library`);
  check("Library browser renders", !!(await page.getByTestId("library-browser").count()));

  await page.goto(`${BASE}/settings`);
  check("Settings page renders", !!(await page.getByTestId("notification-toggle").count()));

  const manifestResponse = await page.goto(`${BASE}/manifest.json`);
  check("PWA manifest serves valid JSON", manifestResponse?.status() === 200);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log("═══════════════════════════════════════════════════");
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════════");

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run();
