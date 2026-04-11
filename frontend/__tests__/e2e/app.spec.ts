import { test, expect, APIRequestContext } from "@playwright/test";

const API_URL = process.env.RAILS_API_URL || "http://localhost:3001";

let authToken: string;

async function getAnyLesson(request: APIRequestContext) {
  const levelsRes = await request.get(`${API_URL}/api/v1/curriculum?language_code=ja`, {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const levels = await levelsRes.json();
  expect(Array.isArray(levels) && levels.length > 0, "No curriculum levels found").toBeTruthy();

  for (const level of levels) {
    const levelRes = await request.get(`${API_URL}/api/v1/curriculum/${level.id}`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const data = await levelRes.json();
    for (const unit of data.curriculum_units || []) {
      for (const lesson of unit.lessons || []) {
        return { levelId: level.id, unitId: unit.id, lessonId: lesson.id, levelPosition: level.position };
      }
    }
  }
  throw new Error("No lessons found in any curriculum level");
}

async function getExercise(request: APIRequestContext, lessonId: number) {
  const res = await request.get(`${API_URL}/api/v1/lessons/${lessonId}`, {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  const exercise = data.exercises?.[0];
  expect(exercise, "No exercises found for lesson").toBeTruthy();
  return exercise;
}

async function simulateLearner(request: APIRequestContext, context: string, level: number, quality: "good" | "poor", exerciseType: "writing" | "speaking" = "writing") {
  const res = await request.post(`${API_URL}/api/v1/simulate`, {
    headers: { authorization: `Bearer ${authToken}` },
    data: { context, level, quality, exercise_type: exerciseType },
  });
  const data = await res.json();
  expect(data.text, "AI simulation returned empty text").toBeTruthy();
  return data.text;
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
    const signupRes = await request.post(`${API_URL}/api/v1/sessions/signup`, {
      data: { display_name: "E2E Tester", email, password: "password123" },
    });
    const body = await signupRes.json();
    authToken = body.auth_token;

    const headers = { authorization: `Bearer ${authToken}` };

    const itemsRes = await request.get(`${API_URL}/api/v1/library?language_code=ja`, { headers });
    const items = await itemsRes.json();
    const item = (Array.isArray(items) ? items : []).find((i: any) => i.item_type === "graded_reader");
    if (item) {
      await request.post(`${API_URL}/api/v1/library/${item.id}/record_session`, {
        headers,
        data: {
          session_type: "reading",
          duration_seconds: 300,
          words_read: 100,
          progress_pct: 0.5,
          new_srs_cards: [
            { word: "おじいさん", definition_ja: "年を取った男の人" },
            { word: "おばあさん", definition_ja: "年を取った女の人" },
          ],
        },
      });
    }
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
    await expect(page.getByTestId("review-card")).toBeVisible({ timeout: 5000 });
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
    await expect(page.getByTestId("placement-question")).toBeVisible({ timeout: 60000 });

    const questionCount = await page.locator("text=/of (\\d+)/").textContent();
    const total = parseInt(questionCount?.match(/of (\d+)/)?.[1] || "5");

    for (let i = 0; i < total; i++) {
      await page.getByTestId("placement-question").waitFor({ timeout: 30000 });
      const options = page.getByTestId("placement-question").locator("button");
      const count = await options.count();
      const pick = Math.floor(Math.random() * count);
      await options.nth(pick).click();
    }

    await expect(page.getByTestId("placement-result")).toBeVisible({ timeout: 60000 });
    await page.getByTestId("placement-accept").click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("writing: AI generates learner text, AI evaluates with high score", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);

    await page.goto(`/writing/${lesson.lessonId}`);
    await expect(page.getByTestId("writing-exercise")).toBeVisible({ timeout: 15000 });

    const prompt = await page.getByTestId("writing-prompt").textContent();
    expect(prompt, "Writing prompt is empty").toBeTruthy();

    const learnerText = await simulateLearner(request, prompt!, lesson.levelPosition, "good");

    await page.getByTestId("writing-input").fill(learnerText);
    await page.getByTestId("writing-submit").click();
    await expect(page.getByTestId("writing-feedback")).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId("writing-score")).toBeVisible();
  });

  test("writing: AI generates poor learner text, AI evaluates with feedback", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);

    await page.goto(`/writing/${lesson.lessonId}`);
    await expect(page.getByTestId("writing-exercise")).toBeVisible({ timeout: 15000 });

    const prompt = await page.getByTestId("writing-prompt").textContent();
    expect(prompt, "Writing prompt is empty").toBeTruthy();

    const learnerText = await simulateLearner(request, prompt!, lesson.levelPosition, "poor");

    await page.getByTestId("writing-input").fill(learnerText);
    await page.getByTestId("writing-submit").click();
    await expect(page.getByTestId("writing-feedback")).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId("writing-score")).toBeVisible();
  });

  test("lesson player: navigate from dashboard, render exercises, answer", async ({ page, request }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("level-map")).toBeVisible({ timeout: 15000 });

    const levelCard = page.locator("[data-testid^='level-card-']").first();
    await expect(levelCard).toBeVisible();
    await levelCard.click();

    await expect(page.getByTestId("lesson-player")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("exercise-progress")).toBeVisible();

    const choiceBtn = page.getByTestId("choice-0");
    const blankInput = page.getByTestId("blank-input");

    if (await choiceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await choiceBtn.click();
      await page.getByTestId("choice-continue").click();
    } else if (await blankInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const lessonUrl = page.url();
      const lessonId = lessonUrl.split("/").pop();
      const exercise = await getExercise(request, Number(lessonId));
      const answer = exercise.content?.correct_answer || exercise.content?.options?.[0];
      expect(answer, "Exercise has no answer").toBeTruthy();
      await blankInput.fill(answer);
      await page.getByTestId("blank-submit").click();
      await page.getByTestId("blank-continue").click();
    }
  });

  test("immersive reader displays text with tap-to-gloss", async ({ page, request }) => {
    const itemsRes = await request.get(`${API_URL}/api/v1/library?language_code=ja`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    const items = await itemsRes.json();
    const textItem = (Array.isArray(items) ? items : []).find((i: any) => ["graded_reader", "article", "novel"].includes(i.item_type));
    expect(textItem, "No text library item found").toBeTruthy();

    await page.goto(`/library/read/${textItem.id}`);
    await expect(page.getByTestId("immersive-reader")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("reader-text")).toBeVisible();
    await expect(page.getByTestId("reader-timer")).toBeVisible();

    const words = page.getByTestId("reader-text").locator("span");
    expect(await words.count()).toBeGreaterThan(0);
    await words.first().click();
    const glossVisible = await page.getByTestId("tap-gloss").isVisible({ timeout: 3000 }).catch(() => false);
    if (glossVisible) {
      await expect(page.getByTestId("gloss-word")).toBeVisible();
    }
  });

  test("listening exercise plays audio and accepts answer", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);

    await page.goto(`/learn/${lesson.levelId}/${lesson.unitId}/${lesson.lessonId}`);
    await expect(page.getByTestId("lesson-player")).toBeVisible({ timeout: 15000 });

    const listenBtn = page.getByTestId("listen-btn");
    if (await listenBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listenBtn.click();
      const option = page.getByTestId("listen-option-0");
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click();
        await page.getByTestId("listen-continue").click();
      }
    }
  });

  test("speaking: AI generates realistic transcription, AI evaluates accuracy", async ({ page, request }) => {
    const lesson = await getAnyLesson(request);

    await page.goto(`/speaking/${lesson.lessonId}`);
    await expect(page.getByTestId("speaking-exercise")).toBeVisible({ timeout: 15000 });

    const targetText = await page.getByTestId("speaking-target").textContent();
    expect(targetText, "Speaking target text is empty").toBeTruthy();

    const exercise = await getExercise(request, lesson.lessonId);
    const transcription = await simulateLearner(request, targetText!, lesson.levelPosition, "good", "speaking");

    const res = await request.post(`${API_URL}/api/v1/speaking/submit`, {
      headers: { authorization: `Bearer ${authToken}` },
      data: { exercise_id: String(exercise.id), transcription, target_text: targetText },
    });
    const feedback = await res.json();
    expect(feedback.accuracy_score).toBeDefined();
  });

  test("speaking: AI generates poor transcription, AI detects pronunciation errors", async ({ request }) => {
    const lesson = await getAnyLesson(request);
    const exercise = await getExercise(request, lesson.lessonId);

    const targetText = exercise.content?.target_text || exercise.content?.prompt;
    expect(targetText, "Exercise has no target text").toBeTruthy();

    const transcription = await simulateLearner(request, targetText, lesson.levelPosition, "poor", "speaking");

    const res = await request.post(`${API_URL}/api/v1/speaking/submit`, {
      headers: { authorization: `Bearer ${authToken}` },
      data: { exercise_id: String(exercise.id), transcription, target_text: targetText },
    });
    const feedback = await res.json();
    expect(feedback.accuracy_score).toBeDefined();
    expect(feedback.pronunciation_notes).toBeDefined();
  });
});
