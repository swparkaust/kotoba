import { test, expect } from "@playwright/test";

const API_URL = process.env.RAILS_API_URL || "http://localhost:3000";

let authToken: string;

test.describe("Authentication", () => {
  test("signup page loads and creates account", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[placeholder='Display name']")).toBeVisible({ timeout: 10000 });

    await page.fill("input[placeholder='Display name']", "Test User");
    await page.fill("input[placeholder='Email']", `test_${Date.now()}@example.com`);
    await page.fill("input[placeholder='Password']", "password123");
    await page.click("button[type='submit']");

    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("[data-testid='login-email'], input[type='email']")).toBeVisible();
  });
});

test.describe.serial("Authenticated flows", () => {
  test.beforeAll(async ({ request }) => {
    const email = `e2e_${Date.now()}@example.com`;
    const res = await request.post(`${API_URL}/api/v1/sessions/signup`, {
      data: { display_name: "E2E Tester", email, password: "password123" },
    });
    const body = await res.json();
    authToken = body.auth_token;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate((token) => {
      localStorage.setItem("auth_token", token);
    }, authToken);
  });

  test("dashboard shows level map and JLPT progress", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("level-map")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("jlpt-bar")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("encouragement")).toBeVisible({ timeout: 5000 });
  });

  test("review page loads", async ({ page }) => {
    await page.goto("/review");
    await expect(page.locator("[data-testid='review-session'], [data-testid='review-filter'], [data-testid='review-empty']").first()).toBeVisible();
  });

  test("settings page shows notification toggle", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByTestId("notification-toggle")).toBeVisible();
  });

  test("progress page shows JLPT comparison", async ({ page }) => {
    await page.goto("/progress");
    await expect(page.getByTestId("jlpt-bar")).toBeVisible();
  });

  test("library page loads items", async ({ page }) => {
    await page.goto("/library");
    await expect(page.locator("[data-testid='library-browser']").first()).toBeVisible({ timeout: 10000 });
  });

  test("placement test loads questions from API", async ({ page }) => {
    await page.goto("/placement");
    await expect(page.locator("[data-testid='placement-test'], [data-testid='placement-question']").first()).toBeVisible({ timeout: 10000 });
  });

  test("writing page loads exercises from API", async ({ page, request }) => {
    const lessonsRes = await request.get(`${API_URL}/api/v1/curriculum?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const levels = await lessonsRes.json();
    if (!levels.length) return;

    const levelRes = await request.get(`${API_URL}/api/v1/curriculum/${levels[0].id}`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const level = await levelRes.json();
    const lesson = level.units?.[0]?.lessons?.[0];
    if (!lesson) return;

    await page.goto(`/writing/${lesson.id}`);
    await expect(page.locator("[data-testid='writing-exercise'], .text-stone-400").first()).toBeVisible({ timeout: 10000 });
  });

  test("lesson player loads and renders exercises", async ({ page, request }) => {
    const lessonsRes = await request.get(`${API_URL}/api/v1/curriculum?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const levels = await lessonsRes.json();
    if (!levels.length) return;

    const levelRes = await request.get(`${API_URL}/api/v1/curriculum/${levels[0].id}`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const level = await levelRes.json();
    const unit = level.units?.[0];
    const lesson = unit?.lessons?.[0];
    if (!lesson) return;

    await page.goto(`/learn/${levels[0].id}/${unit.id}/${lesson.id}`);
    await expect(page.locator("[data-testid='lesson-player'], .text-stone-400").first()).toBeVisible({ timeout: 10000 });
  });

  test("reading page loads immersive reader", async ({ page, request }) => {
    const itemsRes = await request.get(`${API_URL}/api/v1/library?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const items = await itemsRes.json();
    const textItem = (Array.isArray(items) ? items : []).find((i: any) => ["graded_reader", "article", "novel"].includes(i.item_type));
    if (!textItem) return;

    await page.goto(`/library/read/${textItem.id}`);
    await expect(page.locator("[data-testid='immersive-reader'], .text-stone-400").first()).toBeVisible({ timeout: 10000 });
  });

  test("listening page loads audio player", async ({ page, request }) => {
    const itemsRes = await request.get(`${API_URL}/api/v1/library?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const items = await itemsRes.json();
    const audioItem = (Array.isArray(items) ? items : []).find((i: any) => ["podcast", "lecture"].includes(i.item_type));
    if (!audioItem) return;

    await page.goto(`/library/listen/${audioItem.id}`);
    await expect(page.locator("[data-testid='real-audio-player'], .text-stone-400").first()).toBeVisible({ timeout: 10000 });
  });

  test("speaking page loads exercises from API", async ({ page, request }) => {
    const lessonsRes = await request.get(`${API_URL}/api/v1/curriculum?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const levels = await lessonsRes.json();
    if (!levels.length) return;

    const levelRes = await request.get(`${API_URL}/api/v1/curriculum/${levels[0].id}`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const level = await levelRes.json();
    const lesson = level.units?.[0]?.lessons?.[0];
    if (!lesson) return;

    await page.goto(`/speaking/${lesson.id}`);
    await expect(page.locator("[data-testid='speaking-exercise'], .text-stone-400").first()).toBeVisible({ timeout: 10000 });
  });
});
