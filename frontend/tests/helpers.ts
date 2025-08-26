// tests/helpers.ts
import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

async function ensureOnApp(page: Page) {
  const url = page.url();
  if (!/^https?:\/\//.test(url) || !/\/tasks(\b|\/|$)/.test(url)) {
    await page.goto("/tasks");
  }
}

export async function clearInput(input: Locator) {
  await input.click();
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await input.press(`${mod}+A`);
  await input.press("Delete");
}

// ★ 追加: 必要なら /api/auth/sign_in を叩いてトークンを確保
async function ensureAuthTokens(page: Page) {
  await page.evaluate(async () => {
    const hasTokens =
      !!localStorage.getItem("access-token") &&
      !!localStorage.getItem("client") &&
      !!localStorage.getItem("uid");

    if (hasTokens) return;

    const res = await fetch("/api/auth/sign_in", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: "e2e@example.com", password: "password" }),
    });

    const at = res.headers.get("access-token");
    const client = res.headers.get("client");
    const uid = res.headers.get("uid");
    if (at && client && uid) {
      localStorage.setItem("access-token", at);
      localStorage.setItem("client", client);
      localStorage.setItem("uid", uid);
      // AuthProvider に再適用させる
      window.dispatchEvent(new Event("auth:refresh"));
    } else {
      throw new Error("sign_in failed: no DTA headers");
    }
  });
}

/**
 * localStorage の DTA トークンで /api/tasks を叩いて作成。
 * 新トークンが返れば localStorage を更新し、/tasks を再読込して反映を待つ。
 */
export async function createTaskViaApi(
  page: Page,
  overrides: Record<string, any> = {}
) {
  await ensureOnApp(page);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // ★ サインイン確保（storageState が空でも自前で入る）
  await ensureAuthTokens(page);

  const isParent = overrides.parent_id == null;
  const payload = {
    title: `Seed-${Date.now()}`,
    deadline: null,
    parent_id: null,
    status: "in_progress",
    progress: 0,
    ...(isParent ? { site: "E2E" } : {}),
    ...overrides,
  };

  const result = await page.evaluate(async (payload) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const at = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const uid = localStorage.getItem("uid");
    if (at && client && uid) {
      headers["access-token"] = at;
      headers["client"] = client;
      headers["uid"] = uid;
    } else {
      return { ok: false, status: 0, data: { errors: ["DTA tokens missing in localStorage"] } };
    }

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers,
      body: JSON.stringify({ task: payload }),
      credentials: "same-origin",
    });

    const newAt = res.headers.get("access-token");
    const newClient = res.headers.get("client");
    const newUid = res.headers.get("uid");
    if (newAt && newClient && newUid) {
      localStorage.setItem("access-token", newAt);
      localStorage.setItem("client", newClient);
      localStorage.setItem("uid", newUid);
      window.dispatchEvent(new Event("auth:refresh"));
    }

    let data: any = null;
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  }, payload);

  expect(
    result.ok,
    `createTaskViaApi ${result.status} ${JSON.stringify(result.data)}`
  ).toBeTruthy();

  const createdId = result.data?.id;
  if (createdId) {
    await page.goto("/tasks");
    try {
      await page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          /(\/api\/)?tasks\b/.test(r.url()) &&
          r.status() === 200,
        { timeout: 10_000 }
      );
    } catch {}
    await page.waitForLoadState("networkidle");

    const selector = `[data-testid="task-item-${createdId}"]`;
    for (let i = 0; i < 10; i++) {
      if (await page.locator(selector).first().isVisible()) break;
      await page.waitForTimeout(300);
    }
    await page.waitForSelector(selector, { state: "visible", timeout: 10_000 });
  }

  return result.data;
}
