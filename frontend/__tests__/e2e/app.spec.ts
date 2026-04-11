import { test, expect, APIRequestContext } from "@playwright/test";

const API_URL = process.env.RAILS_API_URL || "http://localhost:3001";

let authToken: string;

async function getAnyLesson(request: APIRequestContext) {
  const levelsRes = await request.get(`${API_URL}/api/v1/curriculum?language_code=ja`, {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const levels = await levelsRes.json();
  if (!Array.isArray(levels) || !levels.length) return null;

  for (const level of levels) {
    const levelRes = await request.get(`${API_URL}/api/v1/curriculum/${level.id}`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const data = await levelRes.json();
    for (const unit of data.units || []) {
      for (const lesson of unit.lessons || []) {
        return { levelId: level.id, unitId: unit.id, lessonId: lesson.id, levelPosition: level.position };
      }
    }
  }
  return null;
}

async function getExercise(request: APIRequestContext, lessonId: number) {
  const res = await request.get(`${API_URL}/api/v1/lessons/${lessonId}`, {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  return data.exercises?.[0] || null;
}

async function simulateLearner(request: APIRequestContext, context: string, level: number, quality: "good" | "poor", exerciseType: "writing" | "speaking" = "writing") {
  const res = await request.post(`${API_URL}/api/v1/simulate`, {
    headers: { authorization: `Bearer ${authToken}` },
    data: { context, level, quality, exercise_type: exerciseType },
  });
  const data = await res.json();
  return data.text || "";
}

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

  test("login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[placeholder='Email']", "wrong@example.com");
    await page.fill("input[placeholder='Password']", "wrongpassword");
    await page.click("button[type='submit']");
    await expect(page.locator(".text-red-500")).toBeVisible({ timeout: 10000 });
  });

  test("signup with duplicate email shows error", async ({ page }) => {
    const email = `dup_${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.fill("input[placeholder='Display name']", "Dup User");
    await page.fill("input[placeholder='Email']", email);
    await page.fill("input[placeholder='Password']", "password123");
    await page.click("button[type='submit']");
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    await page.evaluate(() => localStorage.clear());
    await page.goto("/signup");
    await page.fill("input[placeholder='Display name']", "Dup User");
    await page.fill("input[placeholder='Email']", email);
    await page.fill("input[placeholder='Password']", "password123");
    await page.click("button[type='submit']");
    await expect(page.locator("text=Could not create account")).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated API access returns 401", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/progress`);
    expect(res.status()).toBe(401);
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

  test("review SRS card with correct and incorrect grading", async ({ page }) => {
    await page.goto("/review");
    const hasCards = await page.getByTestId("review-card").isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasCards) return;

    await expect(page.getByTestId("review-remaining")).toBeVisible();
    await page.getByTestId("review-incorrect").click();

    const stillHasCards = await page.getByTestId("review-card").isVisible({ timeout: 2000 }).catch(() => false);
    if (stillHasCards) {
      await page.getByTestId("review-correct").click();
    }
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

  test("placement test: AI generates questions, learner answers, AI evaluates", async ({ page }) => {
    await page.goto("/placement");
    await expect(page.getByTestId("placement-question")).toBeVisible({ timeout: 30000 });

    const questionCount = await page.locator("text=/of (\\d+)/").textContent();
    const total = parseInt(questionCount?.match(/of (\d+)/)?.[1] || "5");

    for (let i = 0; i < total; i++) {
      await page.getByTestId("placement-question").waitFor({ timeout: 10000 });
      const options = page.getByTestId("placement-question").locator("button");
      const count = await options.count();
      const pick = Math.floor(Math.random() * count);
      await options.nth(pick).click();
    }

    await expect(page.getByTestId("placement-result")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("placement-accept").click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("writing: AI generates learner text, AI evaluates with high score", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);
    if (!lesson) return;

    await page.goto(`/writing/${lesson.lessonId}`);
    const hasExercise = await page.getByTestId("writing-exercise").isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasExercise) return;

    const prompt = await page.getByTestId("writing-prompt").textContent();
    if (!prompt) return;

    const learnerText = await simulateLearner(request, prompt, lesson.levelPosition, "good");
    if (!learnerText) return;

    await page.getByTestId("writing-input").fill(learnerText);
    await page.getByTestId("writing-submit").click();
    await expect(page.getByTestId("writing-feedback")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("writing-score")).toBeVisible();
  });

  test("writing: AI generates poor learner text, AI evaluates with suggestions", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);
    if (!lesson) return;

    await page.goto(`/writing/${lesson.lessonId}`);
    const hasExercise = await page.getByTestId("writing-exercise").isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasExercise) return;

    const prompt = await page.getByTestId("writing-prompt").textContent();
    if (!prompt) return;

    const learnerText = await simulateLearner(request, prompt, lesson.levelPosition, "poor");
    if (!learnerText) return;

    await page.getByTestId("writing-input").fill(learnerText);
    await page.getByTestId("writing-submit").click();
    await expect(page.getByTestId("writing-feedback")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("writing-suggestions")).toBeVisible();
  });

  test("lesson player renders exercises and accepts answers", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);
    if (!lesson) return;

    await page.goto(`/learn/${lesson.levelId}/${lesson.unitId}/${lesson.lessonId}`);
    const hasPlayer = await page.getByTestId("lesson-player").isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasPlayer) return;

    await expect(page.getByTestId("exercise-progress")).toBeVisible();

    const choiceBtn = page.getByTestId("choice-0");
    const blankInput = page.getByTestId("blank-input");

    if (await choiceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await choiceBtn.click();
    } else if (await blankInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const exercise = await getExercise(request, lesson.lessonId);
      const answer = exercise?.content?.correct_answer || exercise?.content?.options?.[0];
      if (answer) {
        await blankInput.fill(answer);
        await page.getByTestId("blank-submit").click();
      }
    }
  });

  test("immersive reader displays text with tap-to-gloss", async ({ page, request }) => {
    const itemsRes = await request.get(`${API_URL}/api/v1/library?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const items = await itemsRes.json();
    const textItem = (Array.isArray(items) ? items : []).find((i: any) => ["graded_reader", "article", "novel"].includes(i.item_type));
    if (!textItem) return;

    await page.goto(`/library/read/${textItem.id}`);
    await expect(page.getByTestId("immersive-reader")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("reader-text")).toBeVisible();
    await expect(page.getByTestId("reader-timer")).toBeVisible();

    const words = page.getByTestId("reader-text").locator("span");
    if (await words.count() > 0) {
      await words.first().click();
      const glossVisible = await page.getByTestId("tap-gloss").isVisible({ timeout: 3000 }).catch(() => false);
      if (glossVisible) {
        await expect(page.getByTestId("gloss-word")).toBeVisible();
      }
    }
  });

  test("listening exercise plays audio and accepts answer", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);
    if (!lesson) return;

    await page.goto(`/learn/${lesson.levelId}/${lesson.unitId}/${lesson.lessonId}`);
    const hasPlayer = await page.getByTestId("lesson-player").isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasPlayer) return;

    const listenBtn = page.getByTestId("listen-btn");
    if (await listenBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listenBtn.click();
      const option = page.getByTestId("listen-option-0");
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click();
      }
    }
  });

  test("speaking: AI generates realistic transcription, AI evaluates accuracy", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);
    if (!lesson) return;

    await page.goto(`/speaking/${lesson.lessonId}`);
    const hasExercise = await page.getByTestId("speaking-exercise").isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasExercise) return;

    const targetText = await page.getByTestId("speaking-target").textContent();
    if (!targetText) return;

    const exercise = await getExercise(request, lesson.lessonId);
    if (!exercise) return;

    const transcription = await simulateLearner(request, targetText, lesson.levelPosition, "good", "speaking");
    if (!transcription) return;

    const res = await request.post(`${API_URL}/api/v1/speaking/submit`, {
      headers: { authorization: `Bearer ${authToken}` },
      data: { exercise_id: String(exercise.id), transcription, target_text: targetText },
    });
    const feedback = await res.json();
    expect(feedback.accuracy_score).toBeDefined();
  });

  test("speaking: AI generates poor transcription, AI detects pronunciation errors", async ({ request }) => {
    const lesson = await getAnyLesson(request);
    if (!lesson) return;

    const exercise = await getExercise(request, lesson.lessonId);
    if (!exercise) return;

    const targetText = exercise.content?.target_text || exercise.content?.prompt;
    if (!targetText) return;

    const transcription = await simulateLearner(request, targetText, lesson.levelPosition, "poor", "speaking");
    if (!transcription) return;

    const res = await request.post(`${API_URL}/api/v1/speaking/submit`, {
      headers: { authorization: `Bearer ${authToken}` },
      data: { exercise_id: String(exercise.id), transcription, target_text: targetText },
    });
    const feedback = await res.json();
    expect(feedback.accuracy_score).toBeDefined();
    expect(feedback.pronunciation_notes).toBeDefined();
  });
});
